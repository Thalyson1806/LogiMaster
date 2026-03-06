using LogiMaster.Domain.Enums;

namespace LogiMaster.Domain.Entities;

public class Product : BaseEntity
{
    public string Reference { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public ProductType ProductType { get; private set; } = ProductType.FinishedProduct;
    public int UnitsPerBox { get; private set; } = 1;
    public int? BoxesPerPallet { get; private set; }
    public decimal? UnitWeight { get; private set; }
    public decimal? UnitPrice { get; private set; }
    public string? Barcode { get; private set; }
    public string? Notes { get; private set; }

    public int? DefaultPackagingId { get; private set; }
    public virtual Packaging? DefaultPackaging { get; private set; }

    public virtual ICollection<PackingListItem> PackingListItems { get; private set; } = new List<PackingListItem>();
    public virtual ICollection<ProductLocation> Locations { get; private set; } = new List<ProductLocation>();

    protected Product() { }

    public Product(string reference, string description, int unitsPerBox = 1, ProductType productType = ProductType.FinishedProduct)
    {
        if (string.IsNullOrWhiteSpace(reference))
            throw new ArgumentException("Product reference is required", nameof(reference));
        if (string.IsNullOrWhiteSpace(description))
            throw new ArgumentException("Product description is required", nameof(description));
        if (unitsPerBox < 1)
            throw new ArgumentException("Units per box must be greater than zero", nameof(unitsPerBox));

        Reference = reference.Trim().ToUpper();
        Description = description.Trim();
        UnitsPerBox = unitsPerBox;
        ProductType = productType;
    }

    public void Update(string description, int unitsPerBox, decimal? unitWeight, decimal? unitPrice,
        string? barcode, string? notes, int? defaultPackagingId = null, int? boxesPerPallet = null,
        ProductType productType = ProductType.FinishedProduct)
    {
        if (string.IsNullOrWhiteSpace(description))
            throw new ArgumentException("Product description is required", nameof(description));
        if (unitsPerBox < 1)
            throw new ArgumentException("Units per box must be greater than zero", nameof(unitsPerBox));

        Description = description.Trim();
        UnitsPerBox = unitsPerBox;
        BoxesPerPallet = boxesPerPallet;
        UnitWeight = unitWeight;
        UnitPrice = unitPrice;
        Barcode = barcode?.Trim();
        Notes = notes?.Trim();
        DefaultPackagingId = defaultPackagingId;
        ProductType = productType;
        MarkUpdated();
    }

    public void SetDefaultPackaging(int? packagingId)
    {
        DefaultPackagingId = packagingId;
        MarkUpdated();
    }
}
