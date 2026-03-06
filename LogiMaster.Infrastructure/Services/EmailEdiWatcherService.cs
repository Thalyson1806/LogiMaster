using LogiMaster.Application.Settings;
using MailKit.Net.Pop3;
using MailKit.Security;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;

namespace LogiMaster.Infrastructure.Services;

/// <summary>
/// Monitora a caixa de e-mail via POP3 e salva automaticamente os anexos
/// EDI (.edi) e planilhas (.xlsx/.xls) nas pastas corretas para processamento.
/// </summary>
public class EmailEdiWatcherService : BackgroundService
{
    private readonly ILogger<EmailEdiWatcherService> _logger;
    private readonly EmailSettings _emailSettings;
    private readonly EmailEdiWatcherSettings _watcherSettings;
    private readonly EdiFileWatcherSettings _ediSettings;
    private string ProcessedUidsFile =>
        Path.Combine(_watcherSettings.SpreadsheetFolder, ".processed_email_uids.txt");

    public EmailEdiWatcherService(
        ILogger<EmailEdiWatcherService> logger,
        IOptions<EmailSettings> emailSettings,
        IOptions<EmailEdiWatcherSettings> watcherSettings,
        IOptions<EdiFileWatcherSettings> ediSettings)
    {
        _logger = logger;
        _emailSettings = emailSettings.Value;
        _watcherSettings = watcherSettings.Value;
        _ediSettings = ediSettings.Value;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_watcherSettings.Enabled)
        {
            _logger.LogInformation("EmailEdiWatcherService desabilitado");
            return;
        }

        if (string.IsNullOrEmpty(_emailSettings.Pop3Host))
        {
            _logger.LogWarning("EmailEdiWatcherService: Pop3Host não configurado. Serviço não iniciado.");
            return;
        }

        _logger.LogInformation(
            "EmailEdiWatcherService iniciado. Polling a cada {Min} min. Pasta EDI: {Edi} | Pasta Planilhas: {Xl}",
            _watcherSettings.PollingIntervalMinutes,
            _ediSettings.WatchFolder,
            _watcherSettings.SpreadsheetFolder);

        EnsureDirectories();

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessEmailsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro no EmailEdiWatcherService");
            }

            await Task.Delay(
                TimeSpan.FromMinutes(_watcherSettings.PollingIntervalMinutes),
                stoppingToken);
        }
    }

    private void EnsureDirectories()
    {
        Directory.CreateDirectory(_ediSettings.WatchFolder);
        Directory.CreateDirectory(_watcherSettings.SpreadsheetFolder);
    }

    private async Task ProcessEmailsAsync(CancellationToken ct)
    {
        using var client = new Pop3Client();

        var sslOption = _emailSettings.Pop3UseSsl
            ? SecureSocketOptions.SslOnConnect
            : SecureSocketOptions.Auto;

        try
        {
            await client.ConnectAsync(
                _emailSettings.Pop3Host,
                _emailSettings.Pop3Port,
                sslOption, ct);

            await client.AuthenticateAsync(
                _emailSettings.Pop3User,
                _emailSettings.Pop3Password, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao conectar/autenticar no servidor POP3 ({Host}:{Port})",
                _emailSettings.Pop3Host, _emailSettings.Pop3Port);
            return;
        }

        try
        {
            var count = client.Count;
            if (count == 0)
            {
                _logger.LogDebug("Caixa de entrada vazia");
                return;
            }

            _logger.LogInformation("{Count} e-mail(s) encontrado(s) na caixa", count);

            // Obter UIDs para evitar reprocessar o mesmo e-mail
            var uids = client.GetMessageUids();
            var processedUids = LoadProcessedUids();
            var toDelete = new List<int>();

            for (int i = 0; i < count; i++)
            {
                if (ct.IsCancellationRequested) break;

                var uid = uids[i];

                if (processedUids.Contains(uid))
                {
                    _logger.LogDebug("E-mail UID={Uid} já processado, ignorando", uid);
                    continue;
                }

                try
                {
                    var message = await client.GetMessageAsync(i, ct);
                    var downloaded = await ProcessAttachmentsAsync(message, ct);

                    if (downloaded)
                    {
                        SaveProcessedUid(uid);

                        if (_watcherSettings.DeleteAfterDownload)
                            toDelete.Add(i);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro ao processar e-mail UID={Uid}", uid);
                }
            }

            // Marcar para exclusão (executada no Disconnect)
            foreach (var idx in toDelete)
                client.DeleteMessage(idx);
        }
        finally
        {
            await client.DisconnectAsync(true, ct);
        }
    }

    private async Task<bool> ProcessAttachmentsAsync(MimeMessage message, CancellationToken ct)
    {
        var downloaded = false;

        _logger.LogDebug("Verificando e-mail: '{Subject}' de {From} em {Date}",
            message.Subject, message.From, message.Date);

        foreach (var bodyPart in message.BodyParts)
        {
            if (bodyPart is not MimePart mimePart) continue;

            var fileName = mimePart.FileName;
            if (string.IsNullOrEmpty(fileName)) continue;

            var ext = Path.GetExtension(fileName).ToLowerInvariant();
            if (ext != ".edi" && ext != ".xlsx" && ext != ".xls") continue;

            try
            {
                using var ms = new MemoryStream();
                await mimePart.Content.DecodeToAsync(ms, ct);

                var destFolder = ext == ".edi"
                    ? _ediSettings.WatchFolder
                    : _watcherSettings.SpreadsheetFolder;

                var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
                var destFileName = $"{timestamp}_{SanitizeFileName(fileName)}";
                var destPath = Path.Combine(destFolder, destFileName);

                await File.WriteAllBytesAsync(destPath, ms.ToArray(), ct);

                _logger.LogInformation(
                    "Anexo salvo: {File} → {Dest} ({Bytes} bytes)",
                    fileName, destPath, ms.Length);

                downloaded = true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao salvar anexo {File}", fileName);
            }
        }

        return downloaded;
    }

    private HashSet<string> LoadProcessedUids()
    {
        if (!File.Exists(ProcessedUidsFile))
            return new HashSet<string>();

        return new HashSet<string>(
            File.ReadAllLines(ProcessedUidsFile)
                .Where(l => !string.IsNullOrWhiteSpace(l)));
    }

    private void SaveProcessedUid(string uid)
    {
        File.AppendAllLines(ProcessedUidsFile, new[] { uid });
    }

    private static string SanitizeFileName(string fileName)
    {
        var invalid = Path.GetInvalidFileNameChars();
        return string.Concat(fileName.Select(c => invalid.Contains(c) ? '_' : c));
    }
}
