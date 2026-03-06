namespace LogiMaster.Application.DTOs;

public record WarehouseStreetDto(
    int Id,
    string Code,
    string Name,
    string? Description,
    int SortOrder,
    int RackCount,
    string? Color,
    int LocationCount,
    bool IsActive,
    DateTime CreatedAt
);

public record CreateWarehouseStreetDto(
    string Code,
    string Name,
    string? Description = null,
    int SortOrder = 0,
    int RackCount = 0,
    string? Color = null
);

public record UpdateWarehouseStreetDto(
    string Name,
    string? Description,
    int SortOrder,
    int RackCount,
    string? Color
);

public record WarehouseLocationDto(
    int Id,
    int StreetId,
    string StreetName,
    string Code,
    string Street,
    string Rack,
    int Level,
    string Position,
    string? Description,
    int? Capacity,
    bool IsAvailable,
    int ProductCount,
    bool IsActive,
    DateTime CreatedAt
);

public record CreateWarehouseLocationDto(
    int StreetId,
    string Street,
    string Rack,
    int Level,
    string Position,
    string? Description = null,
    int? Capacity = null
);

public record BulkCreateLocationsDto(
    int StreetId,
    string Street,
    int RackStart,
    int RackEnd,
    int LevelStart,
    int LevelEnd,
    int PositionStart,
    int PositionEnd
);

public record ProductLocationDto(
    int Id,
    int ProductId,
    string ProductReference,
    string ProductDescription,
    int LocationId,
    string LocationCode,
    bool IsPrimary,
    int? Quantity,
    string? Notes
);

public record AssignProductLocationDto(
    int ProductId,
    int LocationId,
    bool IsPrimary = false,
    int? Quantity = null,
    string? Notes = null
);

public record WarehouseMapDto(
    IEnumerable<WarehouseStreetDto> Streets,
    IEnumerable<WarehouseLocationDto> Locations,
    int TotalStreets,
    int TotalLocations,
    int OccupiedLocations,
    int AvailableLocations
);
