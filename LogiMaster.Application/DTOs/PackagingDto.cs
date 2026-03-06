namespace LogiMaster.Application.DTOs;

public record PackagingDto(
    int Id,
    string Code,
    string Name,
    string? Description,
    int PackagingTypeId,
    string PackagingTypeName,  // Nome do tipo para exibição
    decimal? Length,
    decimal? Width,
    decimal? Height,
    decimal? Weight,
    decimal? MaxWeight,
    int? MaxUnits,
    string? Notes,
    bool IsActive,
    DateTime CreatedAt
);

public record CreatePackagingDto(
    string Code,
    string Name,
    int PackagingTypeId,
    string? Description = null,
    decimal? Length = null,
    decimal? Width = null,
    decimal? Height = null,
    decimal? Weight = null,
    decimal? MaxWeight = null,
    int? MaxUnits = null,
    string? Notes = null
);

public record UpdatePackagingDto(
    string Name,
    int PackagingTypeId,
    string? Description,
    decimal? Length,
    decimal? Width,
    decimal? Height,
    decimal? Weight,
    decimal? MaxWeight,
    int? MaxUnits,
    string? Notes
);
