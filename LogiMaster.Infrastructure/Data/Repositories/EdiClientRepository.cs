using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Interfaces;
using LogiMaster.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;

namespace LogiMaster.Infrastructure.Data.Repositories;

public class EdiClientRepository : BaseRepository<EdiClient>, IEdiClientRepository
{
    public EdiClientRepository(LogiMasterDbContext context) : base(context) { }

    public override async Task<IEnumerable<EdiClient>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(c => c.Customer)
            .Include(c => c.Routes.Where(r => r.IsActive))
            .Include(c => c.Products.Where(p => p.IsActive))
            .Where(c => c.IsActive)
            .ToListAsync(cancellationToken);
    }

    public override async Task<EdiClient?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(c => c.Customer)
            .Include(c => c.Routes.Where(r => r.IsActive))
            .Include(c => c.Products.Where(p => p.IsActive))
            .FirstOrDefaultAsync(c => c.Id == id && c.IsActive, cancellationToken);
    }

    public async Task<EdiClient?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(c => c.Customer)
            .FirstOrDefaultAsync(c => c.Code == code.ToUpper() && c.IsActive, cancellationToken);
    }

    public async Task<EdiClient?> GetWithRoutesAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(c => c.Customer)
            .Include(c => c.Routes.Where(r => r.IsActive))
            .FirstOrDefaultAsync(c => c.Id == id && c.IsActive, cancellationToken);
    }

    public async Task<bool> CodeExistsAsync(string code, int? excludeId = null, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AnyAsync(c =>
            c.Code == code.ToUpper() &&
            (excludeId == null || c.Id != excludeId),
            cancellationToken);
    }
}
