using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Interfaces;
using LogiMaster.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;

namespace LogiMaster.Infrastructure.Data.Repositories;

public class EdiConversionRepository : BaseRepository<EdiConversion>, IEdiConversionRepository
{
    public EdiConversionRepository(LogiMasterDbContext context) : base(context) { }

    public async Task<IEnumerable<EdiConversion>> GetByClientIdAsync(int clientId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(c => c.Client)
            .Include(c => c.Route)
            .Include(c => c.ConvertedBy)
            .Where(c => c.EdiClientId == clientId)
            .OrderByDescending(c => c.ConvertedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<EdiConversion?> GetWithDetailsAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(c => c.Client)
            .Include(c => c.Route)
            .Include(c => c.ConvertedBy)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }
}
