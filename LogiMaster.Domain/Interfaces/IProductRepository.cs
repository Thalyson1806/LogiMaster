using LogiMaster.Domain.Entities;

namespace LogiMaster.Domain.Interfaces;

public interface IProductRepository : IRepository<Product>
{
    Task<Product?> GetByReferenceAsync(string reference, CancellationToken cancellationToken = default);
    Task<Product?> GetByIdWithPackagingAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Product>> GetAllWithPackagingAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<Product>> SearchAsync(string searchTerm, CancellationToken cancellationToken = default);
    Task<bool> ReferenceExistsAsync(string reference, int? excludeId = null, CancellationToken cancellationToken = default);
}
