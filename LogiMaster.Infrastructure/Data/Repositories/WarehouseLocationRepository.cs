using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Interfaces;
using LogiMaster.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;

namespace LogiMaster.Infrastructure.Data.Repositories;

public class WarehouseLocationRepository : BaseRepository<WarehouseLocation>, IWarehouseLocationRepository
{
    public WarehouseLocationRepository(LogiMasterDbContext context) : base(context)
    {
    }

    public async Task<WarehouseLocation?> GetByCodeAsync(string code, CancellationToken ct = default)
    {
        return await _dbSet
            .Include(l => l.WarehouseStreet)
            .FirstOrDefaultAsync(l => l.Code == code.ToUpper(), ct);
    }

    public async Task<IEnumerable<WarehouseLocation>> GetByStreetIdAsync(int streetId, CancellationToken ct = default)
    {
        return await _dbSet
            .Include(l => l.WarehouseStreet)
            .Where(l => l.StreetId == streetId && l.IsActive)
            .OrderBy(l => l.Rack)
            .ThenBy(l => l.Level)
            .ThenBy(l => l.Position)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<WarehouseLocation>> GetAllWithStreetAsync(CancellationToken ct = default)
    {
        return await _dbSet
            .Include(l => l.WarehouseStreet)
            .Where(l => l.IsActive)
            .OrderBy(l => l.Street)
            .ThenBy(l => l.Rack)
            .ThenBy(l => l.Level)
            .ThenBy(l => l.Position)
            .ToListAsync(ct);
    }

    public async Task<bool> CodeExistsAsync(string code, int? excludeId = null, CancellationToken ct = default)
    {
        return await _dbSet
            .AnyAsync(l => l.Code == code.ToUpper() && (excludeId == null || l.Id != excludeId), ct);
    }

    public async Task<bool> HasProductsAsync(int locationId, CancellationToken ct = default)
    {
        return await _context.Set<ProductLocation>()
            .AnyAsync(pl => pl.LocationId == locationId, ct);
    }
}
