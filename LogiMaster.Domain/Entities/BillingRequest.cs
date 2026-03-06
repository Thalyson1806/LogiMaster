namespace LogiMaster.Domain.Entities;

/// <summary>
/// Solicitação de Faturamento - Importação do arquivo TXT
/// </summary>
public class BillingRequest : BaseEntity
{
    public string Code { get; private set; } = string.Empty;
    public DateTime ImportedAt { get; private set; }
    public string? FileName { get; private set; }
    public int TotalItems { get; private set; }
    public int TotalCustomers { get; private set; }
    public decimal TotalValue { get; private set; }
    public int TotalQuantity { get; private set; }
    public int? ImportedById { get; private set; }
    public string? Notes { get; private set; }
    public bool IsProcessed { get; private set; }

    // Navigation
    public virtual User? ImportedBy { get; private set; }
    public virtual ICollection<BillingRequestItem> Items { get; private set; } = new List<BillingRequestItem>();

    protected BillingRequest() { }

    public BillingRequest(string? fileName, int? importedById)
    {
        Code = GenerateCode();
        ImportedAt = DateTime.UtcNow;
        FileName = fileName;
        ImportedById = importedById;
    }

    private static string GenerateCode()
    {
        return $"BR{DateTime.UtcNow:yyyyMMddHHmmssfff}";
    }

    public void AddItem(BillingRequestItem item)
    {
        Items.Add(item);
        RecalculateTotals();
    }

    public void RecalculateTotals()
    {
        TotalItems = Items.Count;
        TotalCustomers = Items.Where(i => i.CustomerId.HasValue).Select(i => i.CustomerId).Distinct().Count();
        TotalValue = Items.Sum(i => i.TotalValue);
        TotalQuantity = Items.Sum(i => i.Quantity);
        MarkUpdated();
    }


    public void SetNotes(string? notes)
    {
        Notes = notes?.Trim();
        MarkUpdated();
    }

    public void MarkAsProcessed()
    {
        IsProcessed = true;
        MarkUpdated();
    }
}
