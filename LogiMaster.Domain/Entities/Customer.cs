namespace LogiMaster.Domain.Entities;

public class Customer : BaseEntity
{
    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string? CompanyName { get; private set; }
    public string? TaxId { get; private set; } // CNPJ
    public string? Address { get; private set; }
    public string? City { get; private set; }
    public string? State { get; private set; }
    public string? ZipCode { get; private set; }
    public string? Phone { get; private set; }
    public string? Email { get; private set; }
    public string? Notes { get; private set; }
    public string? EmitterCode { get; private set; } // Código do emitente no arquivo EDI (NAD+BY, UNB sender, etc.)

    // Geolocalização
    public double? Latitude { get; private set; }
    public double? Longitude { get; private set; }
    public DateTime? GeocodedAt { get; private set; }

    // Navigation
    public virtual ICollection<PackingList> PackingLists { get; private set; } = new List<PackingList>();
    public virtual ICollection<BillingRequestItem> BillingRequestItems { get; private set; } = new List<BillingRequestItem>();

    protected Customer() { }

    public Customer(string code, string name)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new ArgumentException("Customer code is required", nameof(code));
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Customer name is required", nameof(name));

        Code = code.Trim().ToUpper();
        Name = name.Trim();
    }

    public void SetEmitterCode(string? code)
    {
        EmitterCode = string.IsNullOrWhiteSpace(code) ? null : code.Trim().ToUpper();
        MarkUpdated();
    }

    public void Update(string name, string? companyName, string? taxId, string? address,
        string? city, string? state, string? zipCode, string? phone, string? email, string? notes, string? emitterCode = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Customer name is required", nameof(name));

        // Se o endereço mudou, limpar coordenadas para recalcular
        if (Address != address?.Trim() || City != city?.Trim() || State != state?.Trim())
        {
            Latitude = null;
            Longitude = null;
            GeocodedAt = null;
        }

        Name = name.Trim();
        CompanyName = companyName?.Trim();
        TaxId = taxId?.Trim();
        Address = address?.Trim();
        City = city?.Trim();
        State = state?.Trim().ToUpper();
        ZipCode = zipCode?.Trim();
        Phone = phone?.Trim();
        Email = email?.Trim().ToLower();
        Notes = notes?.Trim();
        EmitterCode = string.IsNullOrWhiteSpace(emitterCode) ? EmitterCode : emitterCode.Trim().ToUpper();
        MarkUpdated();
    }

    public void SetCode(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new ArgumentException("Customer code is required", nameof(code));
        Code = code.Trim().ToUpper();
        MarkUpdated();
    }

    public void SetCoordinates(double latitude, double longitude)
    {
        Latitude = latitude;
        Longitude = longitude;
        GeocodedAt = DateTime.UtcNow;
        MarkUpdated();
    }

    public void ClearCoordinates()
    {
        Latitude = null;
        Longitude = null;
        GeocodedAt = null;
        MarkUpdated();
    }

    public bool HasCoordinates => Latitude.HasValue && Longitude.HasValue;
    
    public string FullAddress => string.Join(", ", 
        new[] { Address, City, State, ZipCode }
        .Where(s => !string.IsNullOrWhiteSpace(s)));
}
