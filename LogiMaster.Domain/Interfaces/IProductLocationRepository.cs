using LogiMaster.Domain.Entities;

namespace LogiMaster.Domain.Interfaces;

public interface IProductLocationRepository : IRepository<ProductLocation>
{
    Task<IEnumerable<ProductLocation>> GetByProductIdAsync(int productId, CancellationToken ct = default);
    Task<IEnumerable<ProductLocation>> GetByLocationIdAsync(int locationId, CancellationToken ct = default);
    Task<ProductLocation?> GetByProductAndLocationAsync(int productId, int locationId, CancellationToken ct = default);
    Task<IEnumerable<ProductLocation>> GetAllWithDetailsAsync(int? productId = null, int? locationId = null, CancellationToken ct = default);
    Task ClearPrimaryForProductAsync(int productId, CancellationToken ct = default);
}
