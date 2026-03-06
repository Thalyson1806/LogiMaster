using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Interfaces;
using LogiMaster.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;

namespace LogiMaster.Infrastructure.Data.Repositories;

public class BillingRequestRepository : BaseRepository<BillingRequest>, IBillingRequestRepository
{
    public BillingRequestRepository(LogiMasterDbContext context) : base(context)
    {
    }

    public async Task<BillingRequest?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(b => b.Code == code, cancellationToken);
    }

    public async Task<BillingRequest?> GetWithItemsAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(b => b.ImportedBy)
            .Include(b => b.Items)
                .ThenInclude(i => i.Customer)
            .Include(b => b.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<BillingRequest>> GetUnprocessedAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(b => !b.IsProcessed && b.IsActive)
            .OrderByDescending(b => b.ImportedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<BillingRequestItem>> GetPendingItemsByCustomerAsync(int customerId, CancellationToken cancellationToken = default)
    {
        return await _context.BillingRequestItems
            .Include(i => i.Product)
            .Where(i => i.CustomerId == customerId && i.PendingQuantity > 0 && !i.IsCustomerTotal)
            .OrderBy(i => i.ProductReference)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<CustomerPendingSummary>> GetPendingSummaryByCustomerAsync(
        int? billingRequestId = null, 
        DateTime? startDate = null, 
        DateTime? endDate = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.BillingRequestItems
            .Include(i => i.BillingRequest)
            .Where(i => i.CustomerId.HasValue &&
                        i.PendingQuantity > 0 &&
                        !i.IsCustomerTotal);

        if (billingRequestId.HasValue)
        {
            query = query.Where(i => i.BillingRequestId == billingRequestId.Value);
        }

        // Filtro por data de importação do BillingRequest
        if (startDate.HasValue)
        {
            var start = startDate.Value.Date;
            query = query.Where(i => i.BillingRequest.ImportedAt.Date >= start);
        }

        if (endDate.HasValue)
        {
            var end = endDate.Value.Date;
            query = query.Where(i => i.BillingRequest.ImportedAt.Date <= end);
        }

        // Get items with customer data
        var items = await query
            .Select(i => new
            {
                i.CustomerId,
                CustomerCode = i.Customer != null ? i.Customer.Code : i.CustomerCode ?? "",
                CustomerName = i.Customer != null ? i.Customer.Name : i.CustomerName ?? "",
                i.PendingQuantity,
                i.UnitPrice
            })
            .ToListAsync(cancellationToken);

        // Group in memory to avoid EF Core GroupBy issues with SQLite
        var result = items
            .GroupBy(i => new { i.CustomerId, i.CustomerCode, i.CustomerName })
            .Select(g => new CustomerPendingSummary
            {
                CustomerId = g.Key.CustomerId!.Value,
                CustomerCode = g.Key.CustomerCode,
                CustomerName = g.Key.CustomerName,
                TotalItems = g.Count(),
                TotalPendingQuantity = g.Sum(i => i.PendingQuantity),
                TotalPendingValue = g.Sum(i => i.PendingQuantity * i.UnitPrice)
            })
            .OrderByDescending(s => s.TotalPendingValue)
            .ToList();

        return result;
    }

    public async Task<IEnumerable<BillingRequest>> GetByDeliveryDateAsync(DateTime deliveryDate, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(b => b.Items)
            .Where(b => b.Items.Any(i => i.DeliveryDate.HasValue && i.DeliveryDate.Value.Date == deliveryDate.Date))
            .ToListAsync(cancellationToken);
    }

    public async Task DeleteAllAsync(CancellationToken cancellationToken = default)
    {
        // Primeiro deleta TODOS os items (sem filtro de IsActive)
        await _context.BillingRequestItems.ExecuteDeleteAsync(cancellationToken);

        // Depois deleta TODOS os billing requests (sem filtro de IsActive)
        await _dbSet.ExecuteDeleteAsync(cancellationToken);
    }
    public async Task<BillingRequestItem?> GetItemByIdAsync(int id, CancellationToken ct = default)
  {
    return await _context.BillingRequestItems
        .FirstOrDefaultAsync(i => i.Id == id, ct);
  }

}
