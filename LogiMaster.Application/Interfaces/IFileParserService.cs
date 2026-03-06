namespace LogiMaster.Application.Interfaces;

/// <summary>
/// Interface unificada para parsers de arquivos (TXT e PDF)
/// </summary>
public interface IFileParserService
{
    /// <summary>
    /// Parseia arquivo e extrai itens de pedidos pendentes
    /// </summary>
    Task<FileParseResult> ParseAsync(Stream fileStream, string fileName, CancellationToken cancellationToken = default);

    /// <summary>
    /// Verifica se o serviço suporta o tipo de arquivo
    /// </summary>
    bool CanHandle(string fileName);
}

public class FileParseResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public List<ParsedItem> Items { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
}

public class ParsedItem
{
    public string? CustomerCode { get; set; }
    public string? CustomerName { get; set; }
    public string? ProductReference { get; set; }
    public string? ProductDescription { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalValue { get; set; }
    public bool IsCustomerTotal { get; set; }
    public DateTime? ExpectedDeliveryDate { get; set; }
    public int LineNumber { get; set; }
}
