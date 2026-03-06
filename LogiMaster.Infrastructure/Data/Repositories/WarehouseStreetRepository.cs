using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Interfaces;
using LogiMaster.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;

namespace LogiMaster.Infrastructure.Data.Repositories;

public class WarehouseStreetRepository : BaseRepository<WarehouseStreet>, IWarehouseStreetRepository
{
    public WarehouseStreetRepository(LogiMasterDbContext context) : base(context)
    {
    }

    public async Task<WarehouseStreet?> GetByCodeAsync(string code, CancellationToken ct = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(s => s.Code == code.ToUpper(), ct);
    }

    public async Task<IEnumerable<WarehouseStreet>> GetAllWithLocationsAsync(CancellationToken ct = default)
    {
        return await _dbSet
            .Include(s => s.Locations)
            .Where(s => s.IsActive)
            .OrderBy(s => s.SortOrder)
            .ThenBy(s => s.Code)
            .ToListAsync(ct);
    }

    public async Task<bool> CodeExistsAsync(string code, int? excludeId = null, CancellationToken ct = default)
    {
        return await _dbSet
            .AnyAsync(s => s.Code == code.ToUpper() && (excludeId == null || s.Id != excludeId), ct);
    }
}
