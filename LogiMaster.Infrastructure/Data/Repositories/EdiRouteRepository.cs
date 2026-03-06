using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Interfaces;
using LogiMaster.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;

namespace LogiMaster.Infrastructure.Data.Repositories;

public class EdiRouteRepository : BaseRepository<EdiRoute>, IEdiRouteRepository
{
    public EdiRouteRepository(LogiMasterDbContext context) : base(context) { }

    public async Task<IEnumerable<EdiRoute>> GetByClientIdAsync(int clientId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(r => r.Client)
            .Where(r => r.EdiClientId == clientId && r.IsActive)
            .OrderBy(r => r.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<EdiRoute?> GetDefaultByClientIdAsync(int clientId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(r => r.EdiClientId == clientId && r.IsDefault && r.IsActive, cancellationToken);
    }
}
