using System.Text;
using System.Text.RegularExpressions;
using LogiMaster.Application.Interfaces;
using UglyToad.PdfPig;

namespace LogiMaster.Application.Services;

/// <summary>
/// Parser para arquivo PDF de Pedidos Pendentes
/// </summary>
public class PdfParserService : IFileParserService
{
    // Padrão para linha de cabeçalho de cliente: "3520-1   AETHRA SISTEMAS AUTOMOTIVOS S.A.   31 30459199   CONTAGEM-MG"
    private readonly Regex _customerHeaderPattern = new(@"^(\d+)-\d+\s+([A-Z][A-Z0-9\s\.\,\-\(\)\/\&]+?)\s+(?:\d[\d\s\-]*\s+)?([A-Z][A-Z\s]*)-([A-Z]{2})\s+ROTA", RegexOptions.Compiled);

    // Padrão simplificado para cliente (código-filial + nome + cidade-UF)
    private readonly Regex _customerSimplePattern = new(@"^(\d+)-\d+\s+([A-Z][A-Z0-9\s\.\,\-\(\)\/\&]+?)\s{2,}.*?([A-Z\s]+)-([A-Z]{2})\s*(?:ROTA|$)", RegexOptions.Compiled);

    // Padrão para linha de item: código + referência + descrição + CC + UN + QTD + % + UNIT + TOTAL + DATA
    // Exemplo: "26901 10MF01-0285 5U7803523 - GANCHO 2 UN 2.600,000 100,00 2,644 6.874,40 30/01/2026"
    private readonly Regex _itemPattern = new(
        @"^\s*(\d{4,6})\s+(\d{2}MF\d{2}-\d{4})\s+(.+?)\s+(\d)\s+(UN|PC|PCS|KG|CX|MT|M2|LT|PR|JG)\s+([\d\.,]+)\s+([\d\.,]+)\s+([\d\.,]+)\s+([\d\.,]+)\s+(\d{2}/\d{2}/\d{2,4})\s*$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    // Padrão alternativo mais flexível
    private readonly Regex _itemFlexPattern = new(
        @"^\s*(\d{4,6})\s+(\d{2}MF\d{2}-\d{4})\s+(.+?)\s+\d\s+(UN|PC|PCS|KG|CX|MT|M2|LT|PR|JG)\s+([\d\.,]+)\s+[\d\.,]+\s+([\d\.,]+)\s+([\d\.,]+)\s+\d{2}/\d{2}/\d{2,4}",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    // Padrões para ignorar
    private readonly string[] _ignoreStarts = {
        "METALURGICA FORMIGARI", "PEDIDOS PENDENTES", "PREV.ENTREGA", "FILIAL:",
        "____", "----", "====", "****", "CODIGO REFERENCIA", "C.C.",
        "TOTAL PENDENTE", "TOTAL PEDIDO", "TOTAL GERAL", "TOTAL PRODUTO",
        "TOTAL SERVICO", "TOTAL CLIENTE", "TOTAL C/", "SALDO:", "PEDIDO:",
        "OBSERVACAO", "OBS:", "PAGINA", "DATA:", "HORA:", "USUARIO:",
        "FORMA PGTO", "APR:", "VALOR FRETE", "TIPO:", "SHIPMENT"
    };

    public bool CanHandle(string fileName)
    {
        return fileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase);
    }

    public async Task<FileParseResult> ParseAsync(Stream fileStream, string fileName, CancellationToken cancellationToken = default)
    {
        var result = new FileParseResult { Success = true };

        try
        {
            // PdfPig precisa de um MemoryStream com Position = 0
            using var memoryStream = new MemoryStream();
            await fileStream.CopyToAsync(memoryStream, cancellationToken);
            memoryStream.Position = 0;

            using var document = PdfDocument.Open(memoryStream);

            string? currentCustomerCode = null;
            string? currentCustomerName = null;
            var lineNumber = 0;

            foreach (var page in document.GetPages())
            {
                cancellationToken.ThrowIfCancellationRequested();

                var text = page.Text;
                var lines = text.Split('\n', StringSplitOptions.None);

                foreach (var rawLine in lines)
                {
                    lineNumber++;
                    var line = rawLine.Trim();

                    if (string.IsNullOrWhiteSpace(line))
                        continue;

                    // Ignorar linhas de cabeçalho e totais
                    if (ShouldIgnoreLine(line))
                        continue;

                    // Verificar se é cabeçalho de cliente
                    if (TryParseCustomerHeader(line, out var code, out var name))
                    {
                        currentCustomerCode = code;
                        currentCustomerName = name;
                        continue;
                    }

                    // Tentar parsear como linha de item
                    var item = TryParseItemLine(line, lineNumber, currentCustomerCode, currentCustomerName);
                    if (item != null)
                    {
                        result.Items.Add(item);
                    }
                }
            }

            if (result.Items.Count == 0)
            {
                result.Success = false;
                result.ErrorMessage = "Nenhum item válido encontrado no arquivo PDF.";
            }
        }
        catch (Exception ex)
        {
            result.Success = false;
            result.ErrorMessage = $"Erro ao processar PDF: {ex.Message}";
        }

        return result;
    }

    private bool ShouldIgnoreLine(string line)
    {
        foreach (var start in _ignoreStarts)
        {
            if (line.StartsWith(start, StringComparison.OrdinalIgnoreCase))
                return true;
        }
        return false;
    }

    private bool TryParseCustomerHeader(string line, out string? code, out string? name)
    {
        code = null;
        name = null;

        // Primeiro padrão
        var match = _customerHeaderPattern.Match(line);
        if (match.Success)
        {
            code = match.Groups[1].Value.Trim();
            name = match.Groups[2].Value.Trim();
            return true;
        }

        // Padrão simplificado
        match = _customerSimplePattern.Match(line);
        if (match.Success)
        {
            code = match.Groups[1].Value.Trim();
            name = match.Groups[2].Value.Trim();
            return true;
        }

        // Tentar detectar cliente pelo padrão CODIGO-FILIAL + NOME + CIDADE-UF
        var simpleMatch = Regex.Match(line, @"^(\d+)-\d+\s+([A-Z][A-Z0-9\s\.\,\-\(\)\/\&]{3,}?)\s{2,}");
        if (simpleMatch.Success && line.Contains("-") && (line.Contains("ROTA") || Regex.IsMatch(line, @"[A-Z]{2,}\s*-\s*[A-Z]{2}\s*$")))
        {
            code = simpleMatch.Groups[1].Value.Trim();
            name = simpleMatch.Groups[2].Value.Trim();
            return true;
        }

        return false;
    }

    private ParsedItem? TryParseItemLine(string line, int lineNumber, string? customerCode, string? customerName)
    {
        // Tentar padrão principal
        var match = _itemPattern.Match(line);
        if (match.Success)
        {
            return CreateItemFromMatch(match, lineNumber, customerCode, customerName);
        }

        // Tentar padrão flexível
        match = _itemFlexPattern.Match(line);
        if (match.Success)
        {
            return CreateItemFromFlexMatch(match, lineNumber, customerCode, customerName);
        }

        return null;
    }

    private ParsedItem CreateItemFromMatch(Match match, int lineNumber, string? customerCode, string? customerName)
    {
        var productCode = match.Groups[1].Value.Trim();
        var reference = match.Groups[2].Value.Trim();
        var description = match.Groups[3].Value.Trim();
        var unit = match.Groups[5].Value.ToUpper();
        var quantity = ParseDecimal(match.Groups[6].Value);
        var unitPrice = ParseDecimal(match.Groups[8].Value);
        var totalValue = ParseDecimal(match.Groups[9].Value);

        if (quantity <= 0)
            return null!;

        return new ParsedItem
        {
            CustomerCode = customerCode,
            CustomerName = customerName,
            ProductReference = reference,
            ProductDescription = description,
            Quantity = (int)Math.Round(quantity),
            UnitPrice = unitPrice,
            TotalValue = totalValue > 0 ? totalValue : quantity * unitPrice,
            IsCustomerTotal = false,
            LineNumber = lineNumber
        };
    }

    private ParsedItem CreateItemFromFlexMatch(Match match, int lineNumber, string? customerCode, string? customerName)
    {
        var productCode = match.Groups[1].Value.Trim();
        var reference = match.Groups[2].Value.Trim();
        var description = match.Groups[3].Value.Trim();
        var unit = match.Groups[4].Value.ToUpper();
        var quantity = ParseDecimal(match.Groups[5].Value);
        var unitPrice = ParseDecimal(match.Groups[6].Value);
        var totalValue = ParseDecimal(match.Groups[7].Value);

        if (quantity <= 0)
            return null!;

        return new ParsedItem
        {
            CustomerCode = customerCode,
            CustomerName = customerName,
            ProductReference = reference,
            ProductDescription = description,
            Quantity = (int)Math.Round(quantity),
            UnitPrice = unitPrice,
            TotalValue = totalValue > 0 ? totalValue : quantity * unitPrice,
            IsCustomerTotal = false,
            LineNumber = lineNumber
        };
    }

    private static decimal ParseDecimal(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return 0;

        var cleaned = value.Trim();

        // Formato brasileiro: 1.234,56 ou 2.600,000
        if (cleaned.Contains(',') && cleaned.Contains('.'))
        {
            var lastComma = cleaned.LastIndexOf(',');
            var lastPeriod = cleaned.LastIndexOf('.');

            if (lastComma > lastPeriod)
            {
                // Formato brasileiro: 1.234,56 -> 1234.56
                cleaned = cleaned.Replace(".", "").Replace(",", ".");
            }
            else
            {
                // Formato americano: 1,234.56 -> 1234.56
                cleaned = cleaned.Replace(",", "");
            }
        }
        else if (cleaned.Contains(','))
        {
            // Pode ser decimal brasileiro: 123,45 ou milhar: 1,234
            var parts = cleaned.Split(',');
            if (parts.Length == 2 && parts[1].Length <= 3)
            {
                cleaned = cleaned.Replace(",", ".");
            }
            else
            {
                cleaned = cleaned.Replace(",", "");
            }
        }

        cleaned = Regex.Replace(cleaned, @"[^\d\-\.]", "");

        return decimal.TryParse(cleaned, System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture, out var result) ? result : 0;
    }
}
