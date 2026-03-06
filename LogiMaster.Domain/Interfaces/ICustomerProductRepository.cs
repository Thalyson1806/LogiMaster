using LogiMaster.Domain.Entities;

namespace LogiMaster.Domain.Interfaces;

public interface ICustomerProductRepository : IRepository<CustomerProduct>
{
    Task<IEnumerable<CustomerProduct>> GetByCustomerIdAsync(int customerId, CancellationToken ct = default);
    Task<IEnumerable<CustomerProduct>> GetByProductIdAsync(int productId, CancellationToken ct = default);
    Task<CustomerProduct?> FindByCustomerCodeAsync(string customerCode, int? customerId = null, CancellationToken ct = default);
    Task<bool> ExistsAsync(int customerId, int productId, CancellationToken ct = default);
    Task<CustomerProduct?> FindInactiveAsync(int customerId, int productId, CancellationToken ct = default);
}