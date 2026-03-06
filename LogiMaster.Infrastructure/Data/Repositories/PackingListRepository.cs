using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Enums;
using LogiMaster.Domain.Interfaces;
using LogiMaster.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;

namespace LogiMaster.Infrastructure.Data.Repositories;

public class PackingListRepository : BaseRepository<PackingList>, IPackingListRepository
{
    public PackingListRepository(LogiMasterDbContext context) : base(context)
    {
    }

    public override async Task<IEnumerable<PackingList>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.Customer)
            .Where(p => p.IsActive)
            .OrderByDescending(p => p.RequestedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<PackingList?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.Customer)
            .FirstOrDefaultAsync(p => p.Code == code, cancellationToken);
    }

    public async Task<PackingList?> GetWithItemsAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.Customer)
            .Include(p => p.CreatedBy)
            .Include(p => p.SeparatedBy)
            .Include(p => p.ConferencedBy)
            .Include(p => p.InvoicedBy)
            .Include(p => p.Items)
                .ThenInclude(i => i.Product)
            .Include(p => p.NfPdfs)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<PackingListNfPdf>> GetNfPdfsAsync(int packingListId, CancellationToken ct = default)
    {
        return await _context.PackingListNfPdfs
            .Where(n => n.PackingListId == packingListId)
            .OrderBy(n => n.UploadedAt)
            .ToListAsync(ct);
    }

    public async Task AddNfPdfAsync(PackingListNfPdf nfPdf, CancellationToken ct = default)
    {
        await _context.PackingListNfPdfs.AddAsync(nfPdf, ct);
    }

    public async Task<PackingListNfPdf?> GetNfPdfByIdAsync(int id, CancellationToken ct = default)
    {
        return await _context.PackingListNfPdfs
            .FirstOrDefaultAsync(n => n.Id == id, ct);
    }

    public async Task<IEnumerable<PackingListItem>> GetPendingLabelItemsAsync(int conferencedById, CancellationToken cancellationToken = default)
    {
        return await _context.PackingListItems
            .Include(i => i.PackingList)
                .ThenInclude(p => p.Customer)
            .Include(i => i.PackingList)
                .ThenInclude(p => p.ConferencedBy)
            .Where(i =>
                i.IsConferenced &&
                !i.IsLabelPrinted &&
                i.PackingList.ConferencedById == conferencedById &&
                i.PackingList.IsActive)
            .OrderBy(i => i.PackingList.ConferencedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<PackingListItem?> GetItemByIdAsync(int itemId, CancellationToken cancellationToken = default)
    {
        return await _context.PackingListItems
            .FirstOrDefaultAsync(i => i.Id == itemId, cancellationToken);
    }

    public async Task<IEnumerable<PackingList>> GetByStatusAsync(PackingListStatus status, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.Customer)
            .Where(p => p.Status == status && p.IsActive)
            .OrderByDescending(p => p.RequestedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<PackingList>> GetByCustomerAsync(int customerId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.Customer)
            .Where(p => p.CustomerId == customerId && p.IsActive)
            .OrderByDescending(p => p.RequestedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<PackingList>> GetPendingForShippingAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.Customer)
            .Where(p => p.IsActive &&
                (p.Status == PackingListStatus.AwaitingConference ||
                 p.Status == PackingListStatus.InConference))
            .OrderBy(p => p.RequestedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<PackingList>> GetPendingForInvoicingAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.Customer)
            .Where(p => p.IsActive && p.Status == PackingListStatus.AwaitingInvoicing)
            .OrderBy(p => p.RequestedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<PackingListDashboardSummary> GetDashboardSummaryAsync(CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;

        var summary = new PackingListDashboardSummary
        {
            TotalPending = await _dbSet.CountAsync(p => p.IsActive && p.Status == PackingListStatus.Pending, cancellationToken),
            TotalInSeparation = await _dbSet.CountAsync(p => p.IsActive && p.Status == PackingListStatus.InSeparation, cancellationToken),
            TotalAwaitingConference = await _dbSet.CountAsync(p => p.IsActive && p.Status == PackingListStatus.AwaitingConference, cancellationToken),
            TotalInConference = await _dbSet.CountAsync(p => p.IsActive && p.Status == PackingListStatus.InConference, cancellationToken),
            TotalAwaitingInvoicing = await _dbSet.CountAsync(p => p.IsActive && p.Status == PackingListStatus.AwaitingInvoicing, cancellationToken),
            TotalInvoicedToday = await _dbSet.CountAsync(p => p.IsActive &&
                p.Status == PackingListStatus.Invoiced &&
                p.InvoicedAt.HasValue &&
                p.InvoicedAt.Value.Date == today, cancellationToken),
            TotalValuePending = await _dbSet
                .Where(p => p.IsActive && p.Status != PackingListStatus.Invoiced && p.Status != PackingListStatus.Cancelled)
                .SumAsync(p => p.TotalValue, cancellationToken)
        };

        return summary;
    }
}
