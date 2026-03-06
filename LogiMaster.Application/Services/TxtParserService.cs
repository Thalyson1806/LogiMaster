using System.Text;
using System.Text.RegularExpressions;
using LogiMaster.Application.Interfaces;

namespace LogiMaster.Application.Services;

/// <summary>
/// Parser para arquivo TXT de Pedidos Pendentes - Metalúrgica Formigari
/// </summary>
public class TxtParserService : IFileParserService, ITxtParserService
{
    // Padrão para linha de cabeçalho de cliente: "3520-1   AETHRA SISTEMAS AUTOMOTIVOS S.A.   31 30459199   CONTAGEM-MG"
    private readonly Regex _customerHeaderPattern = new(@"^(\d+)-\d+\s+([A-Z][A-Z0-9\s\.\,\-\(\)\/\&]+?)\s{2,}.*?([A-Z\s]+)-([A-Z]{2})\s*(?:ROTA|$)", RegexOptions.Compiled);

    // Padrão simplificado para cliente (código-filial + nome)
    private readonly Regex _customerSimplePattern = new(@"^(\d+)-\d+\s+([A-Z][A-Z0-9\s\.\,\-\(\)\/\&]{3,}?)\s{2,}", RegexOptions.Compiled);

    // Padrão para linha de item com referência tipo "00MF00-0000"
    private readonly Regex _itemWithRefPattern = new(@"^\s*(\d{4,6})\s+(\d{2}MF\d{2}-\d{4})\s+(.+)", RegexOptions.Compiled);

    // Padrão alternativo para linha de item (código numérico + qualquer referência alfanumérica)
    private readonly Regex _itemGenericPattern = new(@"^\s*(\d{4,6})\s+([A-Z0-9][A-Z0-9\-]+)\s+(.+)", RegexOptions.Compiled | RegexOptions.IgnoreCase);

    // Padrão para extrair números do final da linha de item
    // Formato: UN/PC/KG/CX  QTD  %PEND  UNIT  TOTAL  DATA
    private readonly Regex _itemNumbersPattern = new(@"(UN|PC|PCS|KG|CX|MT|M2|LT|PR|JG)\s+([\d\.,]+)\s+([\d\.,]+)\s+([\d\.,]+)\s+([\d\.,]+)\s+(\d{2}/\d{2}/\d{2,4})\s*$", RegexOptions.Compiled | RegexOptions.IgnoreCase);

    // Padrões para ignorar
    private readonly string[] _ignoreStarts = {
        "METALURGICA FORMIGARI", "PEDIDOS PENDENTES", "PREV.ENTREGA", "FILIAL:",
        "____", "----", "====", "****",
        "CODIGO REFERENCIA", "CODIGO  REFERENCIA", "CODIGO   REFERENCIA", "C.C.",
        "TOTAL PENDENTE", "TOTAL PEDIDO", "TOTAL GERAL", "TOTAL PRODUTO",
        "TOTAL SERVICO", "TOTAL CLIENTE", "TOTAL C/", "SALDO:", "PEDIDO:",
        "OBSERVACAO", "OBS:", "PAGINA", "DATA:", "HORA:", "USUARIO:",
        "FORMA PGTO", "APR:", "VALOR FRETE", "TIPO:", "SHIPMENT"
    };

    public bool CanHandle(string fileName)
    {
        return fileName.EndsWith(".txt", StringComparison.OrdinalIgnoreCase);
    }

    public async Task<FileParseResult> ParseAsync(Stream fileStream, string fileName, CancellationToken cancellationToken = default)
    {
        var txtResult = await ParseAsync(fileStream, cancellationToken);

        return new FileParseResult
        {
            Success = txtResult.Success,
            ErrorMessage = txtResult.ErrorMessage,
            Warnings = txtResult.Warnings,
            Items = txtResult.Items.Select(i => new ParsedItem
            {
                CustomerCode = i.CustomerCode,
                CustomerName = i.CustomerName,
                ProductReference = i.ProductReference,
                ProductDescription = i.ProductDescription,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                TotalValue = i.TotalValue,
                IsCustomerTotal = i.IsCustomerTotal,
                LineNumber = i.LineNumber
            }).ToList()
        };
    }

    public async Task<TxtParseResult> ParseAsync(Stream fileStream, CancellationToken cancellationToken = default)
    {
        var result = new TxtParseResult { Success = true };

        try
        {
            using var reader = new StreamReader(fileStream, Encoding.GetEncoding("ISO-8859-1"));

            string? currentCustomerCode = null;
            string? currentCustomerName = null;
            var lineNumber = 0;

            while (!reader.EndOfStream)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var line = await reader.ReadLineAsync(cancellationToken);
                lineNumber++;

                if (string.IsNullOrWhiteSpace(line))
                    continue;

                var trimmed = line.TrimStart();

                // Ignorar linhas de cabeçalho e totais
                if (ShouldIgnoreLine(trimmed))
                    continue;

                // Verificar se é cabeçalho de cliente
                if (TryParseCustomerHeader(trimmed, out var code, out var name))
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

            if (result.Items.Count == 0)
            {
                result.Success = false;
                result.ErrorMessage = "Nenhum item válido encontrado no arquivo.";
            }
        }
        catch (Exception ex)
        {
            result.Success = false;
            result.ErrorMessage = $"Erro ao processar arquivo: {ex.Message}";
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

        // Primeiro padrão (mais específico)
        var match = _customerHeaderPattern.Match(line);
        if (match.Success)
        {
            code = match.Groups[1].Value.Trim();
            name = match.Groups[2].Value.Trim();
            return true;
        }

        // Padrão simplificado - só aceita se não for linha de item
        if (!Regex.IsMatch(line, @"^\s*\d{4,6}\s+\d{2}MF"))
        {
            match = _customerSimplePattern.Match(line);
            if (match.Success && line.Contains("-") &&
                (line.Contains("ROTA") || Regex.IsMatch(line, @"[A-Z]{2,}\s*-\s*[A-Z]{2}")))
            {
                code = match.Groups[1].Value.Trim();
                name = match.Groups[2].Value.Trim();
                return true;
            }
        }

        return false;
    }

    private TxtParsedItem? TryParseItemLine(string line, int lineNumber, string? customerCode, string? customerName)
    {
        var trimmed = line.TrimStart();

        // Verificar se linha começa com padrão de item (tenta padrão específico primeiro)
        var itemMatch = _itemWithRefPattern.Match(trimmed);
        if (!itemMatch.Success)
        {
            itemMatch = _itemGenericPattern.Match(trimmed);
        }

        if (!itemMatch.Success)
            return null;

        var productCode = itemMatch.Groups[1].Value.Trim();
        var reference = itemMatch.Groups[2].Value.Trim();

        // Extrair números do final da linha
        var numbersMatch = _itemNumbersPattern.Match(line);
        if (!numbersMatch.Success)
            return null;

        var unit = numbersMatch.Groups[1].Value.ToUpper();
        var quantity = ParseDecimal(numbersMatch.Groups[2].Value);
        // Group 3 é % pendente (ignorar)
        var unitPrice = ParseDecimal(numbersMatch.Groups[4].Value);
        var totalValue = ParseDecimal(numbersMatch.Groups[5].Value);

        if (quantity <= 0)
            return null;

        // Extrair descrição (entre referência e unidade)
        var descEndIndex = line.IndexOf(numbersMatch.Value);
        var descStartIndex = line.IndexOf(reference) + reference.Length;
        var description = "";

        if (descEndIndex > descStartIndex)
        {
            description = line.Substring(descStartIndex, descEndIndex - descStartIndex).Trim();
            // Remover C.C. no início se houver (número seguido de espaço)
            description = Regex.Replace(description, @"^\d+\s+", "").Trim();
        }

        return new TxtParsedItem
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
