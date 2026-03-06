namespace LogiMaster.Application.DTOs;

public record ProductDto(
    int Id,
    string Reference,
    string Description,
    string ProductType,
    int UnitsPerBox,
    int? BoxesPerPallet,
    decimal? UnitWeight,
    decimal? UnitPrice,
    string? Barcode,
    string? Notes,
    int? DefaultPackagingId,
    string? DefaultPackagingName,
    bool IsActive,
    DateTime CreatedAt
);

public record CreateProductDto(
    string Reference,
    string Description,
    string ProductType = "FinishedProduct",
    int UnitsPerBox = 1,
    int? BoxesPerPallet = null,
    decimal? UnitWeight = null,
    decimal? UnitPrice = null,
    string? Barcode = null,
    string? Notes = null,
    int? DefaultPackagingId = null
);

public record UpdateProductDto(
    string Description,
    int UnitsPerBox,
    string ProductType = "FinishedProduct",
    int? BoxesPerPallet = null,
    decimal? UnitWeight = null,
    decimal? UnitPrice = null,
    string? Barcode = null,
    string? Notes = null,
    int? DefaultPackagingId = null
);
