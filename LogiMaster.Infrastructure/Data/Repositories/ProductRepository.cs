using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Interfaces;
using LogiMaster.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;

namespace LogiMaster.Infrastructure.Data.Repositories;

public class ProductRepository : BaseRepository<Product>, IProductRepository
{
    public ProductRepository(LogiMasterDbContext context) : base(context)
    {
    }

    public async Task<Product?> GetByReferenceAsync(string reference, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.DefaultPackaging)
            .FirstOrDefaultAsync(p => p.Reference == reference.ToUpper(), cancellationToken);
    }

    public async Task<Product?> GetByIdWithPackagingAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.DefaultPackaging)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<Product>> GetAllWithPackagingAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.DefaultPackaging)
            .Where(p => p.IsActive)
            .OrderBy(p => p.Reference)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Product>> SearchAsync(string searchTerm, CancellationToken cancellationToken = default)
    {
        var term = searchTerm.ToLower();
        return await _dbSet
            .Include(p => p.DefaultPackaging)
            .Where(p => p.IsActive &&
                (p.Reference.ToLower().Contains(term) ||
                 p.Description.ToLower().Contains(term)))
            .OrderBy(p => p.Reference)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> ReferenceExistsAsync(string reference, int? excludeId = null, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AnyAsync(p => p.IsActive && p.Reference == reference.ToUpper() && (excludeId == null || p.Id != excludeId), cancellationToken);
    }
}
