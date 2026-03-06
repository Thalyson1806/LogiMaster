using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Interfaces;
using LogiMaster.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;

namespace LogiMaster.Infrastructure.Data.Repositories;

public class PackagingRepository : BaseRepository<Packaging>, IPackagingRepository
{
    public PackagingRepository(LogiMasterDbContext context) : base(context)
    {
    }

    public async Task<Packaging?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.PackagingType)
            .FirstOrDefaultAsync(p => p.Code == code.ToUpper(), cancellationToken);
    }

    public async Task<Packaging?> GetByIdWithTypeAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.PackagingType)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<Packaging>> GetAllWithTypeAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.PackagingType)
            .Where(p => p.IsActive)
            .OrderBy(p => p.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Packaging>> SearchAsync(string searchTerm, CancellationToken cancellationToken = default)
    {
        var term = searchTerm.ToLower();
        return await _dbSet
            .Include(p => p.PackagingType)
            .Where(p => p.IsActive &&
                (p.Code.ToLower().Contains(term) ||
                 p.Name.ToLower().Contains(term) ||
                 p.PackagingType.Name.ToLower().Contains(term)))
            .OrderBy(p => p.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Packaging>> GetByTypeIdAsync(int packagingTypeId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.PackagingType)
            .Where(p => p.IsActive && p.PackagingTypeId == packagingTypeId)
            .OrderBy(p => p.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> CodeExistsAsync(string code, int? excludeId = null, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AnyAsync(p => p.IsActive && p.Code == code.ToUpper() && (excludeId == null || p.Id != excludeId), cancellationToken);
    }
}
