namespace LogiMaster.Application.DTOs;

public record CustomerDto(
    int Id,
    string Code,
    string Name,
    string? CompanyName,
    string? TaxId,
    string? Address,
    string? City,
    string? State,
    string? ZipCode,
    string? Phone,
    string? Email,
    string? Notes,
    string? EmitterCode,
    double? Latitude,
    double? Longitude,
    DateTime? GeocodedAt,
    bool HasCoordinates,
    bool IsActive,
    DateTime CreatedAt
);

public record CreateCustomerDto(
    string Code,
    string Name,
    string? CompanyName,
    string? TaxId,
    string? Address,
    string? City,
    string? State,
    string? ZipCode,
    string? Phone,
    string? Email,
    string? Notes,
    string? EmitterCode = null
);

public record UpdateCustomerDto(
    string Name,
    string? Code,
    string? CompanyName,
    string? TaxId,
    string? Address,
    string? City,
    string? State,
    string? ZipCode,
    string? Phone,
    string? Email,
    string? Notes,
    string? EmitterCode = null
);

public record CustomerMapDto(
    int Id,
    string Code,
    string Name,
    string? City,
    string? State,
    double Latitude,
    double Longitude,
    int PendingDeliveries,
    decimal PendingValue
);
