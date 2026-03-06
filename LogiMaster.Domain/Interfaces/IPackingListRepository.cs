using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Enums;

namespace LogiMaster.Domain.Interfaces;

public interface IPackingListRepository : IRepository<PackingList>
{
    Task<PackingList?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);
    Task<PackingList?> GetWithItemsAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<PackingList>> GetByStatusAsync(PackingListStatus status, CancellationToken cancellationToken = default);
    Task<IEnumerable<PackingList>> GetByCustomerAsync(int customerId, CancellationToken cancellationToken = default);
    Task<IEnumerable<PackingList>> GetPendingForShippingAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<PackingList>> GetPendingForInvoicingAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets dashboard summary data
    /// </summary>
    Task<PackingListDashboardSummary> GetDashboardSummaryAsync(CancellationToken cancellationToken = default);

    Task<IEnumerable<PackingListNfPdf>> GetNfPdfsAsync(int packingListId, CancellationToken ct = default);
    Task AddNfPdfAsync(PackingListNfPdf nfPdf, CancellationToken ct = default);
    Task<PackingListNfPdf?> GetNfPdfByIdAsync(int id, CancellationToken ct = default);

    Task<IEnumerable<PackingListItem>> GetPendingLabelItemsAsync(int conferencedById, CancellationToken cancellationToken = default);
    Task<PackingListItem?> GetItemByIdAsync(int itemId, CancellationToken cancellationToken = default);
}

public class PackingListDashboardSummary
{
    public int TotalPending { get; set; }
    public int TotalInSeparation { get; set; }
    public int TotalAwaitingConference { get; set; }
    public int TotalInConference { get; set; }
    public int TotalAwaitingInvoicing { get; set; }
    public int TotalInvoicedToday { get; set; }
    public decimal TotalValuePending { get; set; }
}
