namespace LogiMaster.Domain.Entities;

public class WarehouseStreet : BaseEntity
{
    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public int SortOrder { get; private set; }
    public int RackCount { get; private set; }
    public string? Color { get; private set; }

    public virtual ICollection<WarehouseLocation> Locations { get; private set; } = new List<WarehouseLocation>();

    protected WarehouseStreet() { }

    public WarehouseStreet(string code, string name, int sortOrder = 0)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new ArgumentException("Code is required", nameof(code));
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name is required", nameof(name));

        Code = code.Trim().ToUpper();
        Name = name.Trim();
        SortOrder = sortOrder;
    }

    public void Update(string name, string? description, int sortOrder, int rackCount, string? color)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name is required", nameof(name));

        Name = name.Trim();
        Description = description?.Trim();
        SortOrder = sortOrder;
        RackCount = rackCount;
        Color = color?.Trim();
        MarkUpdated();
    }
}
