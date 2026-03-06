namespace LogiMaster.Domain.Entities;

public class EdiClient : BaseEntity
{
    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string? EdiCode { get; private set; }
    public int? CustomerId { get; private set; }
    public string SpreadsheetConfigJson { get; private set; } = "{}";
    public string DeliveryRulesJson { get; private set; } = "{}";
    public string FileType { get; private set; } = "xlsx";

    // Navigation
    public virtual Customer? Customer { get; private set; }
    public virtual ICollection<EdiRoute> Routes { get; private set; } = new List<EdiRoute>();
    public virtual ICollection<EdiProduct> Products { get; private set; } = new List<EdiProduct>();
    public virtual ICollection<EdiConversion> Conversions { get; private set; } = new List<EdiConversion>();

    protected EdiClient() { }

    public EdiClient(string code, string name)
    {
        Code = code.ToUpper().Trim();
        Name = name.Trim();
    }

    public void Update(string name, string? description, string? ediCode, int? customerId, string spreadsheetConfigJson, string deliveryRulesJson, string fileType)
    {
        Name = name.Trim();
        Description = description?.Trim();
        EdiCode = ediCode?.Trim();
        CustomerId = customerId;
        SpreadsheetConfigJson = spreadsheetConfigJson;
        DeliveryRulesJson = deliveryRulesJson;
        FileType = fileType;
        MarkUpdated();
    }
}
