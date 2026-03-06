using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Interfaces;
using LogiMaster.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;

namespace LogiMaster.Infrastructure.Data.Repositories;

public class EdiProductRepository : BaseRepository<EdiProduct>, IEdiProductRepository
{
    public EdiProductRepository(LogiMasterDbContext context) : base(context) { }

    public async Task<IEnumerable<EdiProduct>> GetByClientIdAsync(int clientId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.Client)
            .Where(p => p.EdiClientId == clientId && p.IsActive)
            .OrderBy(p => p.Description)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<EdiProduct>> SearchAsync(int clientId, string term, CancellationToken cancellationToken = default)
    {
        var termUpper = term.ToUpper();
        return await _dbSet
            .Include(p => p.Client)
            .Where(p => p.EdiClientId == clientId && p.IsActive &&
                (p.Description.ToUpper().Contains(termUpper) ||
                 (p.Reference != null && p.Reference.ToUpper().Contains(termUpper)) ||
                 (p.Code != null && p.Code.ToUpper().Contains(termUpper))))
            .OrderBy(p => p.Description)
            .Take(50)
            .ToListAsync(cancellationToken);
    }

    public async Task<EdiProduct?> FindForConversionAsync(string descriptionOrCode, int clientId, CancellationToken cancellationToken = default)
    {
        var term = descriptionOrCode.Trim().ToUpper();
        return await _dbSet
            .FirstOrDefaultAsync(p => 
                p.EdiClientId == clientId && 
                p.IsActive &&
                (p.Description.ToUpper() == term ||
                 p.Code != null && p.Code.ToUpper() == term ||
                 p.Reference != null && p.Reference.ToUpper() == term),
                cancellationToken);
    }
}
