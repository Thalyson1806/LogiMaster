namespace LogiMaster.Domain.Entities;

public class EdiProduct : BaseEntity
{
    public int EdiClientId { get; private set; }
    public string Description { get; private set; } = string.Empty;
    public string? Reference { get; private set; }
    public string? Code { get; private set; }
    public decimal? Value { get; private set; }
    public int? ProductId { get; private set; }

    // Navigation
    public virtual EdiClient Client { get; private set; } = null!;
    public virtual Product? Product { get; private set; }

    protected EdiProduct() { }

    public EdiProduct(int ediClientId, string description)
    {
        EdiClientId = ediClientId;
        Description = description.Trim();
    }

    public void Update(string description, string? reference, string? code, decimal? value, int? productId)
    {
        Description = description.Trim();
        Reference = reference?.Trim();
        Code = code?.Trim();
        Value = value;
        ProductId = productId;
        MarkUpdated();
    }
}
