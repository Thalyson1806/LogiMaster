using LogiMaster.Domain.Entities;

namespace LogiMaster.Domain.Interfaces;

public interface IBillingRequestRepository : IRepository<BillingRequest>
{
    Task<BillingRequest?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);
    Task<BillingRequest?> GetWithItemsAsync(int id, CancellationToken cancellationToken = default);
    Task<BillingRequestItem?> GetItemByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<BillingRequest>> GetUnprocessedAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<BillingRequestItem>> GetPendingItemsByCustomerAsync(int customerId, CancellationToken cancellationToken = default);
    Task<IEnumerable<BillingRequest>> GetByDeliveryDateAsync(DateTime deliveryDate, CancellationToken cancellationToken = default);
  
    /// <summary>
    /// Deleta TODOS os pedidos e seus items do banco (hard delete)
    /// </summary>
    Task DeleteAllAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets summary of pending quantities grouped by customer
    /// </summary>
    Task<IEnumerable<CustomerPendingSummary>> GetPendingSummaryByCustomerAsync(
        int? billingRequestId = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        CancellationToken cancellationToken = default);
}

public class CustomerPendingSummary
{
    public int CustomerId { get; set; }
    public string CustomerCode { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public int TotalItems { get; set; }
    public int TotalPendingQuantity { get; set; }
    public decimal TotalPendingValue { get; set; }
}
