using LogiMaster.Application.DTOs;

namespace LogiMaster.Application.Interfaces;

public interface ICustomerProductService
{
    Task<IEnumerable<CustomerProductDto>> GetAllAsync(CancellationToken ct = default);
    Task<IEnumerable<CustomerProductDto>> GetByCustomerAsync(int customerId, CancellationToken ct = default);
    Task<IEnumerable<CustomerProductDto>> GetByProductAsync(int productId, CancellationToken ct = default);
    Task<CustomerProductDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<CustomerProductDto> CreateAsync(CustomerProductInput input, CancellationToken ct = default);
    Task<CustomerProductDto> UpdateAsync(int id, CustomerProductInput input, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}