using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Interfaces;
using Microsoft.Data.Sqlite;

namespace LogiMaster.Application.Services;

public class EdiMigrationService
{
    private readonly IUnitOfWork _unitOfWork;

    public EdiMigrationService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<MigrationResult> MigrateFromSqliteAsync(string sqlitePath, CancellationToken cancellationToken = default)
    {
        var result = new MigrationResult();

        if (!File.Exists(sqlitePath))
        {
            result.Success = false;
            result.ErrorMessage = $"Arquivo não encontrado: {sqlitePath}";
            return result;
        }

        // Buscar todos os clientes EDI do novo banco
        var ediClients = await _unitOfWork.EdiClients.GetAllAsync(cancellationToken);
        var clientMap = ediClients.ToDictionary(c => c.Code.ToUpper(), c => c.Id);

        using var connection = new SqliteConnection($"Data Source={sqlitePath}");
        await connection.OpenAsync(cancellationToken);

        using var command = connection.CreateCommand();
        command.CommandText = "SELECT cliente, descricao, referencia, codigo, valor FROM produtos";

        using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            var clienteNome = reader.GetString(0).Trim().ToUpper().Replace(" ", "_");
            var descricao = reader.GetString(1).Trim();
            var referencia = reader.IsDBNull(2) ? null : reader.GetString(2).Trim();
            var codigo = reader.IsDBNull(3) ? null : reader.GetString(3).Trim();
            var valor = reader.IsDBNull(4) ? (decimal?)null : (decimal)reader.GetDouble(4);

            result.TotalRead++;

            // Tentar encontrar o cliente no novo banco
            if (!clientMap.TryGetValue(clienteNome, out var ediClientId))
            {
                // Tentar sem underline
                var clienteSemUnderline = clienteNome.Replace("_", "");
                if (!clientMap.TryGetValue(clienteSemUnderline, out ediClientId))
                {
                    result.ClientesNaoEncontrados.Add(clienteNome);
                    continue;
                }
            }

            // Verificar se já existe
            var existing = await _unitOfWork.EdiProducts.FindForConversionAsync(descricao, ediClientId, cancellationToken);
            if (existing != null)
            {
                result.Duplicados++;
                continue;
            }

            // Criar novo produto
            var product = new EdiProduct(ediClientId, descricao);
            product.Update(descricao, referencia, codigo, valor, null);

            await _unitOfWork.EdiProducts.AddAsync(product, cancellationToken);
            result.Importados++;

            // Salvar a cada 100 registros
            if (result.Importados % 100 == 0)
            {
                await _unitOfWork.SaveChangesAsync(cancellationToken);
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        result.Success = true;
        return result;
    }
}

public class MigrationResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public int TotalRead { get; set; }
    public int Importados { get; set; }
    public int Duplicados { get; set; }
    public HashSet<string> ClientesNaoEncontrados { get; set; } = new();
}
