namespace LogiMaster.Domain.Entities;

public class ProductLocation : BaseEntity
{
    public int ProductId { get; private set; }
    public int LocationId { get; private set; }
    public bool IsPrimary { get; private set; }
    public int? Quantity { get; private set; }
    public string? Notes { get; private set; }


    public virtual Product Product { get; private set; } = null!;
    public virtual WarehouseLocation WarehouseLocation { get; private set; } = null!;

    protected ProductLocation() {}
    
     public ProductLocation(int productId, int locationId, bool isPrimary = false)
    {
        if (productId <= 0)
            throw new ArgumentException("ProductId is required", nameof(productId));
        if (locationId <= 0)
            throw new ArgumentException("LocationId is required", nameof(locationId));

            ProductId = productId;
            LocationId = locationId;
            IsPrimary = isPrimary;
    }

    public void Update(bool isPrimary, int? quantity, string? notes)
    {
        IsPrimary = isPrimary;
        Quantity = quantity;
        Notes = notes?.Trim();
        MarkUpdated();
    }

    public void SetAsPrimary()
    {
        IsPrimary = true;
        MarkUpdated();
    }
}