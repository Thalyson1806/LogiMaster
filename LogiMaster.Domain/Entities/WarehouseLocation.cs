namespace LogiMaster.Domain.Entities;

public class WarehouseLocation : BaseEntity
{
    public int StreetId { get; private set; }
    public string Code { get; private set; } = string.Empty;
    public string Street { get; private set; } = string.Empty;
    public string Rack { get; private set; } = string.Empty;
    public int Level { get; private set; }
    public string Position { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public int? Capacity { get; private set; }
    public bool IsAvailable { get; private set; } = true;

    public virtual WarehouseStreet WarehouseStreet { get; private set; } = null!;
    public virtual ICollection<ProductLocation> ProductLocations { get; private set; } = new List<ProductLocation>();

    protected WarehouseLocation() { }

    public WarehouseLocation(int streetId, string street, string rack, int level, string position)
    {
        if (streetId <= 0)
            throw new ArgumentException("StreetId is required", nameof(streetId));
        if (string.IsNullOrWhiteSpace(street))
            throw new ArgumentException("Street is required", nameof(street));
        if (string.IsNullOrWhiteSpace(rack))
            throw new ArgumentException("Rack is required", nameof(rack));
        if (level < 0)
            throw new ArgumentException("Level must be >= 0", nameof(level));
        if (string.IsNullOrWhiteSpace(position))
            throw new ArgumentException("Position is required", nameof(position));

        StreetId = streetId;
        Street = street.Trim().ToUpper();
        Rack = rack.Trim().PadLeft(2, '0');
        Level = level;
        Position = position.Trim().PadLeft(2, '0');
        Code = $"{Street}-{Rack}-{Level}-{Position}";
    }

    public void Update(string? description, int? capacity, bool isAvailable)
    {
        Description = description?.Trim();
        Capacity = capacity;
        IsAvailable = isAvailable;
        MarkUpdated();
    }

    public void SetAvailable(bool available)
    {
        IsAvailable = available;
        MarkUpdated();
    }

    public string FullCode => Code;
}
