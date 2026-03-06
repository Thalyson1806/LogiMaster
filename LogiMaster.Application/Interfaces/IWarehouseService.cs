using LogiMaster.Application.DTOs;

namespace LogiMaster.Application.Interfaces;

public interface IWarehouseService
{
    // Streets
    Task<IEnumerable<WarehouseStreetDto>> GetAllStreetsAsync(CancellationToken ct = default);
    Task<WarehouseStreetDto?> GetStreetByIdAsync(int id, CancellationToken ct = default);
    Task<WarehouseStreetDto> CreateStreetAsync(CreateWarehouseStreetDto dto, CancellationToken ct = default);
    Task<WarehouseStreetDto> UpdateStreetAsync(int id, UpdateWarehouseStreetDto dto, CancellationToken ct = default);
    Task DeleteStreetAsync(int id, CancellationToken ct = default);

    // Locations
    Task<IEnumerable<WarehouseLocationDto>> GetAllLocationsAsync(CancellationToken ct = default);
    Task<IEnumerable<WarehouseLocationDto>> GetLocationsByStreetAsync(int streetId, CancellationToken ct = default);
    Task<WarehouseLocationDto?> GetLocationByIdAsync(int id, CancellationToken ct = default);
    Task<WarehouseLocationDto?> GetLocationByCodeAsync(string code, CancellationToken ct = default);
    Task<WarehouseLocationDto> CreateLocationAsync(CreateWarehouseLocationDto dto, CancellationToken ct = default);
    Task<IEnumerable<WarehouseLocationDto>> BulkCreateLocationsAsync(BulkCreateLocationsDto dto, CancellationToken ct = default);
    Task DeleteLocationAsync(int id, CancellationToken ct = default);

    // Product Locations
    Task<IEnumerable<ProductLocationDto>> GetProductLocationsAsync(int? productId = null, int? locationId = null, CancellationToken ct = default);
    Task<ProductLocationDto> AssignProductLocationAsync(AssignProductLocationDto dto, CancellationToken ct = default);
    Task DeleteProductLocationAsync(int id, CancellationToken ct = default);

    // Map
    Task<WarehouseMapDto> GetWarehouseMapAsync(CancellationToken ct = default);
}
