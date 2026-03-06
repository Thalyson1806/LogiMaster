namespace LogiMaster.Domain.Entities;

/// <summary>
/// Tipos de embalagem (CAIXA, PALETE, SACOLA, etc) - cadastro dinâmico
/// </summary>
public class PackagingType : BaseEntity
{
    public string Code { get; private set; } = string.Empty;    // Ex: "CAIXA", "PALETE"
    public string Name { get; private set; } = string.Empty;    // Ex: "Caixa Plástica"
    public string? Description { get; private set; }

    // Navigation - embalagens desse tipo
    public virtual ICollection<Packaging> Packagings { get; private set; } = new List<Packaging>();

    protected PackagingType() { }

    public PackagingType(string code, string name)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new ArgumentException("Código do tipo é obrigatório", nameof(code));
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Nome do tipo é obrigatório", nameof(name));

        Code = code.Trim().ToUpper();
        Name = name.Trim();
    }

    public void Update(string name, string? description)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Nome do tipo é obrigatório", nameof(name));

        Name = name.Trim();
        Description = description?.Trim();
        MarkUpdated();
    }
}
