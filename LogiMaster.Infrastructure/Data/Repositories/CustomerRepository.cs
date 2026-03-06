using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Interfaces;
using LogiMaster.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;

namespace LogiMaster.Infrastructure.Data.Repositories;

public class CustomerRepository : BaseRepository<Customer>, ICustomerRepository
{
    public CustomerRepository(LogiMasterDbContext context) : base(context)
    {
    }

    public async Task<Customer?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(c => c.Code == code.ToUpper(), cancellationToken);
    }

    public async Task<IEnumerable<Customer>> SearchAsync(string searchTerm, CancellationToken cancellationToken = default)
    {
        var term = searchTerm.ToLower();
        return await _dbSet
            .Where(c => c.IsActive &&
                (c.Code.ToLower().Contains(term) ||
                 c.Name.ToLower().Contains(term) ||
                 (c.CompanyName != null && c.CompanyName.ToLower().Contains(term))))
            .OrderBy(c => c.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> CodeExistsAsync(string code, int? excludeId = null, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AnyAsync(c => c.IsActive && c.Code == code.ToUpper() && (excludeId == null || c.Id != excludeId), cancellationToken);
    }

public async Task<Customer?> FindByEmitterCodeAsync(string emitterCode, CancellationToken cancellationToken = default)
{
    var normalized = emitterCode.Trim().ToUpper();
    return await _dbSet
        .FirstOrDefaultAsync(c => c.IsActive && c.EmitterCode != null &&
            c.EmitterCode.ToUpper() == normalized, cancellationToken);
}

}
