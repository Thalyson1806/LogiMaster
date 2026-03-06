using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Interfaces;
using LogiMaster.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;

namespace LogiMaster.Infrastructure.Data.Repositories;

public class ProductLocationRepository : BaseRepository<ProductLocation>, IProductLocationRepository
{
    public ProductLocationRepository(LogiMasterDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<ProductLocation>> GetByProductIdAsync(int productId, CancellationToken ct = default)
    {
        return await _dbSet
            .Include(pl => pl.Product)
            .Include(pl => pl.WarehouseLocation)
            .Where(pl => pl.ProductId == productId)
            .OrderByDescending(pl => pl.IsPrimary)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<ProductLocation>> GetByLocationIdAsync(int locationId, CancellationToken ct = default)
    {
        return await _dbSet
            .Include(pl => pl.Product)
            .Include(pl => pl.WarehouseLocation)
            .Where(pl => pl.LocationId == locationId)
            .ToListAsync(ct);
    }

    public async Task<ProductLocation?> GetByProductAndLocationAsync(int productId, int locationId, CancellationToken ct = default)
    {
        return await _dbSet
            .Include(pl => pl.Product)
            .Include(pl => pl.WarehouseLocation)
            .FirstOrDefaultAsync(pl => pl.ProductId == productId && pl.LocationId == locationId, ct);
    }

    public async Task<IEnumerable<ProductLocation>> GetAllWithDetailsAsync(int? productId = null, int? locationId = null, CancellationToken ct = default)
    {
        var query = _dbSet
            .Include(pl => pl.Product)
            .Include(pl => pl.WarehouseLocation)
            .AsQueryable();

        if (productId.HasValue)
            query = query.Where(pl => pl.ProductId == productId.Value);

        if (locationId.HasValue)
            query = query.Where(pl => pl.LocationId == locationId.Value);

        return await query
            .OrderBy(pl => pl.WarehouseLocation.Code)
            .ToListAsync(ct);
    }

    public async Task ClearPrimaryForProductAsync(int productId, CancellationToken ct = default)
    {
        var primaries = await _dbSet
            .Where(pl => pl.ProductId == productId && pl.IsPrimary)
            .ToListAsync(ct);

        foreach (var pl in primaries)
        {
            pl.Update(false, pl.Quantity, pl.Notes);
        }
    }
}
