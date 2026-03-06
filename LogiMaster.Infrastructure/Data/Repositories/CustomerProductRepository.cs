using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Interfaces;
using LogiMaster.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;

namespace LogiMaster.Infrastructure.Data.Repositories;

public class CustomerProductRepository : BaseRepository<CustomerProduct>, ICustomerProductRepository
{
    public CustomerProductRepository(LogiMasterDbContext context) : base(context) { }

    public async Task<IEnumerable<CustomerProduct>> GetByCustomerIdAsync(int customerId, CancellationToken ct = default)
    {
        return await _context.Set<CustomerProduct>()
            .Include(cp => cp.Product)
            .Include(cp => cp.Customer)
            .Where(cp => cp.CustomerId == customerId && cp.IsActive)
            .OrderBy(cp => cp.CustomerCode)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<CustomerProduct>> GetByProductIdAsync(int productId, CancellationToken ct = default)
    {
        return await _context.Set<CustomerProduct>()
            .Include(cp => cp.Customer)
            .Include(cp => cp.Product)
            .Where(cp => cp.ProductId == productId && cp.IsActive)
            .ToListAsync(ct);
    }

    public async Task<CustomerProduct?> FindByCustomerCodeAsync(string customerCode, int? customerId = null, CancellationToken ct = default)
    {
        var normalized = customerCode.Trim().ToUpper();
        var query = _context.Set<CustomerProduct>()
            .Include(cp => cp.Customer)
            .Include(cp => cp.Product)
            .Where(cp => cp.IsActive && cp.CustomerCode == normalized);

        if (customerId.HasValue)
            query = query.Where(cp => cp.CustomerId == customerId.Value);

        return await query.FirstOrDefaultAsync(ct);
    }

    public async Task<bool> ExistsAsync(int customerId, int productId, CancellationToken ct = default)
    {
        return await _context.Set<CustomerProduct>()
            .AnyAsync(cp => cp.CustomerId == customerId && cp.ProductId == productId && cp.IsActive, ct);
    }

    public async Task<CustomerProduct?> FindInactiveAsync(int customerId, int productId, CancellationToken ct = default)
    {
        return await _context.Set<CustomerProduct>()
            .FirstOrDefaultAsync(cp => cp.CustomerId == customerId && cp.ProductId == productId && !cp.IsActive, ct);
    }

    public override async Task<IEnumerable<CustomerProduct>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Set<CustomerProduct>()
            .Include(cp => cp.Customer)
            .Include(cp => cp.Product)
            .Where(cp => cp.IsActive)
            .OrderBy(cp => cp.Customer.Name).ThenBy(cp => cp.CustomerCode)
            .ToListAsync(cancellationToken);
    }

    public override async Task<CustomerProduct?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Set<CustomerProduct>()
            .Include(cp => cp.Customer)
            .Include(cp => cp.Product)
            .FirstOrDefaultAsync(cp => cp.Id == id, cancellationToken);
    }
}