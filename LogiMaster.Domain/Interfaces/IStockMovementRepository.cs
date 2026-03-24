using LogiMaster.Domain.Entities;

namespace LogiMaster.Domain.Interfaces;

public interface IStockMovementRepository
{
    Task<IEnumerable<StockMovement>> GetByProductIdAsync(int productId, CancellationToken ct = default);
    Task<IEnumerable<StockMovement>> GetAllWithDetailsAsync(CancellationToken ct = default);
    Task<decimal> GetCurrentStockAsync(int productId, CancellationToken ct = default);
    Task<Dictionary<int, decimal>> GetCurrentStockAllProductsAsync(CancellationToken ct = default);
    Task AddAsync(StockMovement movement, CancellationToken ct = default);
    Task AddRangeAsync(IEnumerable<StockMovement> movements, CancellationToken ct = default);
    Task<StockMovement?> GetByIdAsync(int id, CancellationToken ct = default);
}
