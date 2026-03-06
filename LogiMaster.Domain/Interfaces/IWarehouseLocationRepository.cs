using LogiMaster.Domain.Entities;

namespace LogiMaster.Domain.Interfaces;

public interface IWarehouseLocationRepository : IRepository<WarehouseLocation>
{
    Task<WarehouseLocation?> GetByCodeAsync(string code, CancellationToken ct = default);
    Task<IEnumerable<WarehouseLocation>> GetByStreetIdAsync(int streetId, CancellationToken ct = default);
    Task<IEnumerable<WarehouseLocation>> GetAllWithStreetAsync(CancellationToken ct = default);
    Task<bool> CodeExistsAsync(string code, int? excludeId = null, CancellationToken ct = default);
    Task<bool> HasProductsAsync(int locationId, CancellationToken ct = default);
}
