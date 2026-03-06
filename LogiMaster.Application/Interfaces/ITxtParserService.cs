namespace LogiMaster.Application.Interfaces;

public interface ITxtParserService
{
    /// <summary>
    /// Parses TXT file content and extracts billing request items
    /// </summary>
    Task<TxtParseResult> ParseAsync(Stream fileStream, CancellationToken cancellationToken = default);
}

public class TxtParseResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public List<TxtParsedItem> Items { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
}

public class TxtParsedItem
{
    public string? CustomerCode { get; set; }
    public string? CustomerName { get; set; }
    public string? ProductReference { get; set; }
    public string? ProductDescription { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalValue { get; set; }
    public bool IsCustomerTotal { get; set; }
    public int LineNumber { get; set; }
}
