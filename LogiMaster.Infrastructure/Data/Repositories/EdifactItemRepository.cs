using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Interfaces;
using LogiMaster.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;

namespace LogiMaster.Infrastructure.Data.Repositories;

public class EdifactItemRepository : IEdifactItemRepository
{
    private readonly LogiMasterDbContext _context;

    public EdifactItemRepository(LogiMasterDbContext context)
    {
        _context = context;
    }

    public async Task<EdifactItem?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await _context.EdifactItems
            .Include(i => i.Product)
            .FirstOrDefaultAsync(i => i.Id == id && i.IsActive, ct);
    }

    public async Task<IEnumerable<EdifactItem>> GetByFileIdAsync(int fileId, CancellationToken ct = default)
    {
        return await _context.EdifactItems
            .Include(i => i.Product)
            .Where(i => i.IsActive && i.EdifactFileId == fileId)
            .OrderBy(i => i.LineNumber)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<EdifactItem>> GetUnprocessedByFileIdAsync(int fileId, CancellationToken ct = default)
    {
        return await _context.EdifactItems
            .Include(i => i.Product)
            .Where(i => i.IsActive && i.EdifactFileId == fileId && !i.IsProcessed)
            .OrderBy(i => i.LineNumber)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<EdifactItem>> GetByDateRangeAsync(DateTime start, DateTime end, CancellationToken ct = default)
    {
        return await _context.EdifactItems
            .Include(i => i.Product)
            .Include(i => i.EdifactFile)
                .ThenInclude(f => f.Customer)
            .Where(i => i.IsActive && 
                        i.DeliveryStart >= start && 
                        i.DeliveryEnd <= end)
            .OrderBy(i => i.DeliveryStart)
            .ToListAsync(ct);
    }

    public async Task AddAsync(EdifactItem item, CancellationToken ct = default)
    {
        await _context.EdifactItems.AddAsync(item, ct);
    }

    public async Task AddRangeAsync(IEnumerable<EdifactItem> items, CancellationToken ct = default)
    {
        await _context.EdifactItems.AddRangeAsync(items, ct);
    }

    public void Update(EdifactItem item)
    {
        _context.EdifactItems.Update(item);
    }


    public async Task<IEnumerable<EdifactItem>> GetFutureItemsWithProductAsync(DateTime from, CancellationToken ct = default)
{
    return await _context.EdifactItems
        .Include(i => i.Product)
        .Include(i => i.EdifactFile)
            .ThenInclude(f => f.Customer)
        .Where(i => i.IsActive && i.ProductId.HasValue && i.DeliveryStart >= from)
        .OrderBy(i => i.DeliveryStart)
        .ToListAsync(ct);
}

}
