using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Interfaces;
using LogiMaster.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;

namespace LogiMaster.Infrastructure.Data.Repositories;

public class StockMovementRepository : IStockMovementRepository
{
    private readonly LogiMasterDbContext _context;

    public StockMovementRepository(LogiMasterDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<StockMovement>> GetByProductIdAsync(int productId, CancellationToken ct = default)
    {
        return await _context.StockMovements
            .Include(m => m.Product)
            .Include(m => m.CreatedByUser)
            .Where(m => m.ProductId == productId && m.IsActive)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<StockMovement>> GetAllWithDetailsAsync(CancellationToken ct = default)
    {
        return await _context.StockMovements
            .Include(m => m.Product)
            .Include(m => m.CreatedByUser)
            .Where(m => m.IsActive)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<decimal> GetCurrentStockAsync(int productId, CancellationToken ct = default)
    {
        return await _context.StockMovements
            .Where(m => m.ProductId == productId && m.IsActive)
            .SumAsync(m => m.Quantity, ct);
    }

    public async Task<Dictionary<int, decimal>> GetCurrentStockAllProductsAsync(CancellationToken ct = default)
    {
        return await _context.StockMovements
            .Where(m => m.IsActive)
            .GroupBy(m => m.ProductId)
            .Select(g => new { ProductId = g.Key, Stock = g.Sum(m => m.Quantity) })
            .ToDictionaryAsync(x => x.ProductId, x => x.Stock, ct);
    }

    public async Task<StockMovement?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await _context.StockMovements.FindAsync([id], ct);
    }

    public async Task AddAsync(StockMovement movement, CancellationToken ct = default)
    {
        await _context.StockMovements.AddAsync(movement, ct);
    }

    public async Task AddRangeAsync(IEnumerable<StockMovement> movements, CancellationToken ct = default)
    {
        await _context.StockMovements.AddRangeAsync(movements, ct);
    }
}
