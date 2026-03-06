using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Enums;
using LogiMaster.Domain.Interfaces;
using LogiMaster.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;

namespace LogiMaster.Infrastructure.Data.Repositories;

public class EdifactFileRepository : IEdifactFileRepository
{
    private readonly LogiMasterDbContext _context;

    public EdifactFileRepository(LogiMasterDbContext context)
    {
        _context = context;
    }

    public async Task<EdifactFile?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await _context.EdifactFiles
            .Include(f => f.Customer)
            .FirstOrDefaultAsync(f => f.Id == id && f.IsActive, ct);
    }

    public async Task<EdifactFile?> GetByIdWithItemsAsync(int id, CancellationToken ct = default)
    {
        return await _context.EdifactFiles
            .Include(f => f.Customer)
            .Include(f => f.Items.Where(i => i.IsActive))
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(f => f.Id == id && f.IsActive, ct);
    }

    public async Task<IEnumerable<EdifactFile>> GetAllAsync(CancellationToken ct = default)
    {
        return await _context.EdifactFiles
            .Include(f => f.Customer)
            .Where(f => f.IsActive)
            .OrderByDescending(f => f.ReceivedAt)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<EdifactFile>> GetByStatusAsync(EdifactFileStatus status, CancellationToken ct = default)
    {
        return await _context.EdifactFiles
            .Include(f => f.Customer)
            .Where(f => f.IsActive && f.Status == status)
            .OrderByDescending(f => f.ReceivedAt)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<EdifactFile>> GetByCustomerIdAsync(int customerId, CancellationToken ct = default)
    {
        return await _context.EdifactFiles
            .Include(f => f.Customer)
            .Where(f => f.IsActive && f.CustomerId == customerId)
            .OrderByDescending(f => f.ReceivedAt)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<EdifactFile>> GetPendingFilesAsync(int limit = 10, CancellationToken ct = default)
    {
        return await _context.EdifactFiles
            .Include(f => f.Customer)
            .Where(f => f.IsActive && f.Status == EdifactFileStatus.Pending)
            .OrderBy(f => f.ReceivedAt)
            .Take(limit)
            .ToListAsync(ct);
    }

    public async Task AddAsync(EdifactFile file, CancellationToken ct = default)
    {
        await _context.EdifactFiles.AddAsync(file, ct);
    }

    public void Update(EdifactFile file)
    {
        _context.EdifactFiles.Update(file);
    }
}
