using LogiMaster.Application.Interfaces;
using LogiMaster.Application.Settings;
using LogiMaster.Domain.Enums;
using LogiMaster.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace LogiMaster.Infrastructure.Services;

/// <summary>
/// Serviço em background que monitora uma pasta por arquivos .edi,
/// detecta automaticamente o formato (RND ou DELFOR/DELJIT),
/// importa no sistema e move o arquivo para pasta de processados.
/// </summary>
public class EdiFileWatcherService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<EdiFileWatcherService> _logger;
    private readonly EdiFileWatcherSettings _settings;

    public EdiFileWatcherService(
        IServiceProvider serviceProvider,
        ILogger<EdiFileWatcherService> logger,
        IOptions<EdiFileWatcherSettings> settings)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _settings = settings.Value;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_settings.Enabled)
        {
            _logger.LogInformation("EdiFileWatcherService desabilitado");
            return;
        }

        _logger.LogInformation("EdiFileWatcherService iniciado. Monitorando: {Folder}", _settings.WatchFolder);

        // Garantir que as pastas existam
        EnsureDirectories();

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessPendingFiles(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro no monitoramento de arquivos EDI");
            }

            await Task.Delay(TimeSpan.FromSeconds(_settings.PollingIntervalSeconds), stoppingToken);
        }

        _logger.LogInformation("EdiFileWatcherService finalizado");
    }

    private void EnsureDirectories()
    {
        Directory.CreateDirectory(_settings.WatchFolder);
        Directory.CreateDirectory(_settings.ProcessedFolder);
        Directory.CreateDirectory(_settings.ErrorFolder);
    }

    private async Task ProcessPendingFiles(CancellationToken ct)
    {
        if (!Directory.Exists(_settings.WatchFolder)) return;

        var files = Directory.GetFiles(_settings.WatchFolder, "*.edi")
            .Concat(Directory.GetFiles(_settings.WatchFolder, "*.EDI"))
            .Distinct()
            .OrderBy(f => File.GetCreationTime(f))
            .ToArray();

        if (files.Length == 0) return;

        _logger.LogInformation("Encontrados {Count} arquivo(s) EDI para processar", files.Length);

        foreach (var filePath in files)
        {
            if (ct.IsCancellationRequested) break;

            try
            {
                // Verificar se o arquivo não está sendo gravado ainda
                if (!IsFileReady(filePath)) continue;

                await ProcessSingleFile(filePath, ct);

                // Mover para processados
                var destPath = GetUniqueDestination(_settings.ProcessedFolder, filePath);
                File.Move(filePath, destPath);

                _logger.LogInformation("Arquivo EDI processado e movido: {File} → {Dest}",
                    Path.GetFileName(filePath), destPath);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao processar arquivo EDI: {File}", filePath);

                // Mover para pasta de erro
                try
                {
                    var errorDest = GetUniqueDestination(_settings.ErrorFolder, filePath);
                    File.Move(filePath, errorDest);
                }
                catch (Exception moveEx)
                {
                    _logger.LogError(moveEx, "Erro ao mover arquivo para pasta de erros");
                }
            }
        }
    }

    private async Task ProcessSingleFile(string filePath, CancellationToken ct)
    {
        var fileName = Path.GetFileName(filePath);
        var content = await File.ReadAllTextAsync(filePath, ct);

        if (string.IsNullOrWhiteSpace(content))
        {
            _logger.LogWarning("Arquivo EDI vazio: {File}", fileName);
            return;
        }

        // Detectar formato
        var messageType = DetectFormat(content);
        _logger.LogInformation("Formato detectado para {File}: {Type}", fileName, messageType);

        // Resolver customer
        var customerId = await ResolveCustomerId(content, messageType, ct);

        // Importar via EdifactService
        using var scope = _serviceProvider.CreateScope();
        var edifactService = scope.ServiceProvider.GetRequiredService<IEdifactService>();

        using var stream = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(content));
        var uploadResult = await edifactService.UploadFileAsync(stream, fileName, customerId, messageType, ct);

        _logger.LogInformation("Arquivo {File} importado com ID={Id}. Processando...",
            fileName, uploadResult.Id);

        // Processar imediatamente
        var processResult = await edifactService.ProcessFileAsync(uploadResult.Id, ct);

        if (processResult.Success)
        {
            _logger.LogInformation("Arquivo {File} processado: {Processed} itens OK, {Errors} erros",
                fileName, processResult.TotalItemsProcessed, processResult.TotalItemsWithError);
        }
        else
        {
            _logger.LogWarning("Arquivo {File} processado com erros: {Errors}",
                fileName, string.Join("; ", processResult.Errors));
        }
    }

    /// <summary>
    /// Detecta o formato do arquivo EDI pelo conteúdo.
    /// - Começa com "ITP" → RND/ANFAVEA
    /// - Começa com "UNB" ou "UNA" → EDIFACT (verifica UNH para DELFOR/DELJIT)
    /// </summary>
    private static EdifactMessageType DetectFormat(string content)
    {
        var trimmed = content.TrimStart();

        // RND/ANFAVEA
        if (trimmed.StartsWith("ITP", StringComparison.OrdinalIgnoreCase))
            return EdifactMessageType.RND;

        // EDIFACT standard
        if (trimmed.StartsWith("UNB") || trimmed.StartsWith("UNA"))
        {
            // Procurar UNH para determinar tipo de mensagem
            var unhIndex = content.IndexOf("UNH+", StringComparison.Ordinal);
            if (unhIndex >= 0)
            {
                var afterUnh = content.Substring(unhIndex, Math.Min(80, content.Length - unhIndex));

                if (afterUnh.Contains("DELJIT", StringComparison.OrdinalIgnoreCase))
                    return EdifactMessageType.DELJIT;

                if (afterUnh.Contains("DELFOR", StringComparison.OrdinalIgnoreCase))
                    return EdifactMessageType.DELFOR;
            }

            return EdifactMessageType.DELFOR; // default EDIFACT
        }

        // Se não conseguir detectar, assume DELFOR
        return EdifactMessageType.DELFOR;
    }

    /// <summary>
    /// Tenta resolver o CustomerId pelo CNPJ do remetente no arquivo.
    /// Se não encontrar, usa o DefaultCustomerId da configuração.
    /// </summary>
    private async Task<int> ResolveCustomerId(string content, EdifactMessageType type, CancellationToken ct)
    {
        try
        {
            if (type == EdifactMessageType.RND)
            {
                var senderName = ExtractRndSenderName(content);
                if (!string.IsNullOrEmpty(senderName))
                {
                    var customerId = await FindCustomerByName(senderName, ct);
                    if (customerId.HasValue) return customerId.Value;
                }
            }
            else
            {
                var senderCnpj = ExtractEdifactSenderCnpj(content);
                if (!string.IsNullOrEmpty(senderCnpj))
                {
                    var customerId = await FindCustomerByTaxId(senderCnpj, ct);
                    if (customerId.HasValue) return customerId.Value;
                }
            }

            // Fallback: identificar pelo vínculo produto-cliente
            var customerIdByProduct = await FindCustomerByProductCodes(content, type, ct);
            if (customerIdByProduct.HasValue) return customerIdByProduct.Value;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erro ao resolver customer automaticamente");
        }

        _logger.LogDebug("Usando DefaultCustomerId={Id}", _settings.DefaultCustomerId);
        return _settings.DefaultCustomerId;
    }

    private async Task<int?> FindCustomerByProductCodes(string content, EdifactMessageType type, CancellationToken ct)
    {
        var codes = new List<string>();

        if (type == EdifactMessageType.RND)
        {
            var lines = content.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
            foreach (var line in lines.Where(l => l.StartsWith("PE1")))
            {
                var code = line.Length >= 15 ? line.Substring(3, 12).Trim() : null;
                if (!string.IsNullOrEmpty(code)) codes.Add(code);
            }
        }
        else
        {
            var segments = content.Split('\'');
            foreach (var seg in segments)
            {
                if (seg.StartsWith("LIN+") || seg.StartsWith("PIA+"))
                {
                    var parts = seg.Split('+');
                    if (parts.Length > 2)
                    {
                        var code = parts[2].Split(':')[0].Trim();
                        if (!string.IsNullOrEmpty(code)) codes.Add(code);
                    }
                }
            }
        }

        if (codes.Count == 0) return null;

        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<LogiMasterDbContext>();

        foreach (var code in codes.Distinct())
        {
            var normalized = code.ToUpperInvariant();
            var cp = await dbContext.Set<Domain.Entities.CustomerProduct>()
                .Where(x => x.IsActive && x.CustomerCode == normalized)
                .FirstOrDefaultAsync(ct);

            if (cp != null)
            {
                _logger.LogInformation("Cliente identificado pelo código de produto {Code}: CustomerId={Id}", code, cp.CustomerId);
                return cp.CustomerId;
            }
        }

        return null;
    }

    private static string? ExtractEdifactSenderCnpj(string content)
    {
        // UNB+UNOA:3+01178298000197+5292085000169+...
        var unbIndex = content.IndexOf("UNB+", StringComparison.Ordinal);
        if (unbIndex < 0) return null;

        var unbEnd = content.IndexOf('\'', unbIndex);
        if (unbEnd < 0) unbEnd = content.Length;

        var unbSegment = content[unbIndex..unbEnd];
        var elements = unbSegment.Split('+');

        // elements[2] = sender ID
        if (elements.Length > 2)
        {
            var senderId = elements[2].Split(':')[0];
            return senderId.Trim();
        }

        return null;
    }

    private static string? ExtractRndSenderName(string content)
    {
        // Primeira linha que começa com ITP
        var lines = content.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
        var itpLine = lines.FirstOrDefault(l => l.TrimStart().StartsWith("ITP"));

        if (itpLine == null || itpLine.TrimEnd().Length < 50) return null;

        var trimmed = itpLine.TrimEnd();
        // Nomes estão nos últimos 50 chars: remetente(25) + destinatário(25)
        var namesBlock = trimmed[^50..];
        return namesBlock[..25].Trim();
    }

    private async Task<int?> FindCustomerByTaxId(string taxId, CancellationToken ct)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<LogiMasterDbContext>();

        // Tentar match exato e parcial (CNPJ pode ter/não ter zeros à esquerda)
        var customer = await dbContext.Customers
            .Where(c => c.IsActive && c.TaxId != null &&
                        (c.TaxId == taxId || c.TaxId.Contains(taxId) || taxId.Contains(c.TaxId)))
            .FirstOrDefaultAsync(ct);

        return customer?.Id;
    }

    private async Task<int?> FindCustomerByName(string name, CancellationToken ct)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<LogiMasterDbContext>();

        // Buscar por nome parcial (o nome no EDI pode estar truncado)
        var normalizedName = name.ToUpperInvariant().Trim();

        var customer = await dbContext.Customers
            .Where(c => c.IsActive &&
                        (c.Name.ToUpper().Contains(normalizedName) ||
                         (c.CompanyName != null && c.CompanyName.ToUpper().Contains(normalizedName)) ||
                         normalizedName.Contains(c.Name.ToUpper())))
            .FirstOrDefaultAsync(ct);

        return customer?.Id;
    }

    /// <summary>
    /// Verifica se o arquivo pode ser lido (não está sendo gravado por outro processo).
    /// </summary>
    private static bool IsFileReady(string path)
    {
        try
        {
            using var stream = File.Open(path, FileMode.Open, FileAccess.Read, FileShare.None);
            return true;
        }
        catch (IOException)
        {
            return false;
        }
    }

    /// <summary>
    /// Gera caminho de destino único (evita sobrescrever se já existir).
    /// </summary>
    private static string GetUniqueDestination(string folder, string sourceFilePath)
    {
        var fileName = Path.GetFileNameWithoutExtension(sourceFilePath);
        var ext = Path.GetExtension(sourceFilePath);
        var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
        return Path.Combine(folder, $"{timestamp}_{fileName}{ext}");
    }
}
