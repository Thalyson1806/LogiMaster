using LogiMaster.Domain.Entities;

namespace LogiMaster.Domain.Interfaces;

public interface IWarehouseStreetRepository : IRepository<WarehouseStreet>
{
    Task<WarehouseStreet?> GetByCodeAsync(string code, CancellationToken ct = default);
    Task<IEnumerable<WarehouseStreet>> GetAllWithLocationsAsync(CancellationToken ct = default);
    Task<bool> CodeExistsAsync(string code, int? excludeId = null, CancellationToken ct = default);
}
