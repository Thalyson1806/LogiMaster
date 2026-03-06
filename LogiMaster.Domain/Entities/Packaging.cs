namespace LogiMaster.Domain.Entities;

/// <summary>
/// Representa uma embalagem (caixa, palete, etc) usada para transportar produtos
/// </summary>
public class Packaging : BaseEntity
{
    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    
    // Vínculo com Tipo de Embalagem
    public int PackagingTypeId { get; private set; }
    public virtual PackagingType PackagingType { get; private set; } = null!;
    
    public decimal? Length { get; private set; }
    public decimal? Width { get; private set; }
    public decimal? Height { get; private set; }
    public decimal? Weight { get; private set; }
    public decimal? MaxWeight { get; private set; }
    public int? MaxUnits { get; private set; }
    public string? Notes { get; private set; }

    // Navigation
    public virtual ICollection<Product> Products { get; private set; } = new List<Product>();

    protected Packaging() { }

    public Packaging(string code, string name, int packagingTypeId)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new ArgumentException("Código da embalagem é obrigatório", nameof(code));
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Nome da embalagem é obrigatório", nameof(name));
        if (packagingTypeId <= 0)
            throw new ArgumentException("Tipo de embalagem é obrigatório", nameof(packagingTypeId));

        Code = code.Trim().ToUpper();
        Name = name.Trim().ToUpper();
        PackagingTypeId = packagingTypeId;
    }

    public void Update(
        string name,
        int packagingTypeId,
        string? description,
        decimal? length,
        decimal? width,
        decimal? height,
        decimal? weight,
        decimal? maxWeight,
        int? maxUnits,
        string? notes)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Nome da embalagem é obrigatório", nameof(name));
        if (packagingTypeId <= 0)
            throw new ArgumentException("Tipo de embalagem é obrigatório", nameof(packagingTypeId));

        Name = name.Trim().ToUpper();
        PackagingTypeId = packagingTypeId;
        Description = description?.Trim();
        Length = length;
        Width = width;
        Height = height;
        Weight = weight;
        MaxWeight = maxWeight;
        MaxUnits = maxUnits;
        Notes = notes?.Trim();
        MarkUpdated();
    }
}
