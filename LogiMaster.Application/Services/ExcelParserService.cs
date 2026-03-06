using LogiMaster.Application.Interfaces;
using OfficeOpenXml;

namespace LogiMaster.Application.Services;

/// <summary>
/// Parser para arquivo Excel de Pedidos Pendentes
/// Colunas:
/// A: Cliente | B: Pedido | C: DataPedido | E: Referencia | F: Descricao
/// I: Quantidade | J: %Pendente | L: Total | M: Previsão Entrega
/// </summary>
public class ExcelParserService : IFileParserService
{
    public ExcelParserService()
    {
        // EPPlus 8 requer licença - uso não-comercial
        ExcelPackage.License.SetNonCommercialPersonal("LogiMaster");



    }

    public bool CanHandle(string fileName)
    {
        return fileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase) ||
               fileName.EndsWith(".xls", StringComparison.OrdinalIgnoreCase);
    }

    public async Task<FileParseResult> ParseAsync(Stream fileStream, string fileName, CancellationToken cancellationToken = default)
    {
        var result = new FileParseResult { Success = true };

        try
        {
            using var package = new ExcelPackage(fileStream);
            var worksheet = package.Workbook.Worksheets.FirstOrDefault();

            if (worksheet == null)
            {
                result.Success = false;
                result.ErrorMessage = "Nenhuma planilha encontrada no arquivo.";
                return result;
            }

            var rowCount = worksheet.Dimension?.Rows ?? 0;
            if (rowCount == 0)
            {
                result.Success = false;
                result.ErrorMessage = "Planilha vazia.";
                return result;
            }

            // Mapear clientes únicos para gerar código se necessário
            var customerCodeMap = new Dictionary<string, string>();
            var customerCodeCounter = 1;

            // Começar da linha 2 (assumindo que linha 1 é cabeçalho)
            for (int row = 2; row <= rowCount; row++)
            {
                cancellationToken.ThrowIfCancellationRequested();

                // Coluna A: Cliente
                var customerName = GetCellValue(worksheet, row, 1);
                if (string.IsNullOrWhiteSpace(customerName))
                    continue;

                // Coluna E: Referencia
                var reference = GetCellValue(worksheet, row, 5);
                if (string.IsNullOrWhiteSpace(reference))
                    continue;

                // Coluna F: Descricao
                var description = GetCellValue(worksheet, row, 6);

                // Coluna I: Quantidade
                var quantityValue = GetNumericValue(worksheet, row, 9);
                var quantity = (int)Math.Round(quantityValue);
                if (quantity <= 0)
                    continue;

                // Coluna L: Total (valor)
                var totalValue = GetNumericValue(worksheet, row, 12);

                // Calcular preço unitário
                var unitPrice = quantity > 0 ? totalValue / quantity : 0;

                // Coluna M: Previsão de Entrega
                var expectedDeliveryDate = GetDateValue(worksheet, row, 13);

                // Gerar código do cliente baseado no nome (se não existir)
                if (!customerCodeMap.ContainsKey(customerName))
                {
                    // Tentar extrair código do nome se houver padrão "CODIGO - NOME"
                    var customerCode = ExtractCustomerCode(customerName);
                    if (string.IsNullOrEmpty(customerCode))
                    {
                        customerCode = customerCodeCounter.ToString("D4");
                        customerCodeCounter++;
                    }
                    customerCodeMap[customerName] = customerCode;
                }

                var item = new ParsedItem
                {
                    CustomerCode = customerCodeMap[customerName],
                    CustomerName = CleanCustomerName(customerName),
                    ProductReference = reference.Trim(),
                    ProductDescription = description?.Trim() ?? "",
                    Quantity = quantity,
                    UnitPrice = unitPrice,
                    TotalValue = totalValue,
                    IsCustomerTotal = false,
                    ExpectedDeliveryDate = expectedDeliveryDate,
                    LineNumber = row
                };

                result.Items.Add(item);
            }

            if (result.Items.Count == 0)
            {
                result.Success = false;
                result.ErrorMessage = "Nenhum item válido encontrado no arquivo.";
            }
        }
        catch (Exception ex)
        {
            result.Success = false;
            result.ErrorMessage = $"Erro ao processar arquivo Excel: {ex.Message}";
        }

        return await Task.FromResult(result);
    }

    private static string GetCellValue(ExcelWorksheet worksheet, int row, int col)
    {
        var cell = worksheet.Cells[row, col];
        return cell?.Value?.ToString()?.Trim() ?? "";
    }

    private static decimal GetNumericValue(ExcelWorksheet worksheet, int row, int col)
    {
        var cell = worksheet.Cells[row, col];
        if (cell?.Value == null)
            return 0;

        if (cell.Value is double d)
            return (decimal)d;

        if (cell.Value is decimal dec)
            return dec;

        if (cell.Value is int i)
            return i;

        var strValue = cell.Value.ToString();
        if (string.IsNullOrWhiteSpace(strValue))
            return 0;

        // aqui o parser vai tentar passar como número, considerando formato br
        strValue = strValue.Replace("R$", "").Replace(" ", "").Trim();

        
        if (strValue.Contains(',') && strValue.Contains('.'))
        {
            var lastComma = strValue.LastIndexOf(',');
            var lastPeriod = strValue.LastIndexOf('.');

            if (lastComma > lastPeriod)
            {
                strValue = strValue.Replace(".", "").Replace(",", ".");
            }
            else
            {
                strValue = strValue.Replace(",", "");
            }
        }
        else if (strValue.Contains(','))
        {
            strValue = strValue.Replace(",", ".");
        }

        return decimal.TryParse(strValue, System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture, out var result) ? result : 0;
    }

    private static DateTime? GetDateValue(ExcelWorksheet worksheet, int row, int col)
    {
        var cell = worksheet.Cells[row, col];
        if (cell?.Value == null)
            return null;

        // excel armazena datas como double (numero de dias desde 30/12/1899, por isso é preciso fazer a conversão)
        if (cell.Value is double d)
        {
            try
            {
                return DateTime.FromOADate(d);
            }
            catch
            {
                return null;
            }
        }

        if (cell.Value is DateTime dt)
            return dt;
            

        // aqui tenta fazer o parse considerando formatos comuns string
        var strValue = cell.Value.ToString()?.Trim();
        if (string.IsNullOrWhiteSpace(strValue))
            return null;

               
        string[] formats = { "dd/MM/yyyy", "d/M/yyyy", "dd-MM-yyyy", "yyyy-MM-dd" };
        if (DateTime.TryParseExact(strValue, formats,
            System.Globalization.CultureInfo.GetCultureInfo("pt-BR"),
            System.Globalization.DateTimeStyles.None, out var parsed))
        {
            return parsed;
        }

        // Tentar parse genérico
        if (DateTime.TryParse(strValue, System.Globalization.CultureInfo.GetCultureInfo("pt-BR"),
            System.Globalization.DateTimeStyles.None, out var genericParsed))
        {
            return genericParsed;
        }

        return null;
    }

    private static string ExtractCustomerCode(string customerName)
    {
        // Tentar extrair código se o nome tiver padrão "CODIGO - NOME" ou "CODIGO NOME"
        var parts = customerName.Split(new[] { " - ", "-" }, StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length >= 2)
        {
            var potentialCode = parts[0].Trim();
            // Verificar se é um código (número ou alfanumérico curto)
            if (potentialCode.Length <= 10 && (int.TryParse(potentialCode, out _) ||
                System.Text.RegularExpressions.Regex.IsMatch(potentialCode, @"^[A-Z0-9]+$")))
            {
                return potentialCode;
            }
        }
        return "";
    }

    private static string CleanCustomerName(string customerName)
    {
        // Remover código do início se houver padrão "CODIGO - NOME"
        var parts = customerName.Split(new[] { " - " }, StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length >= 2)
        {
            var potentialCode = parts[0].Trim();
            if (potentialCode.Length <= 10 && (int.TryParse(potentialCode, out _) ||
                System.Text.RegularExpressions.Regex.IsMatch(potentialCode, @"^[A-Z0-9]+$")))
            {
                return string.Join(" - ", parts.Skip(1)).Trim();
            }
        }
        return customerName.Trim();
    }
}
