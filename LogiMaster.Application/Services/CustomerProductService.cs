using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace LogiMaster.Application.Services;

public class CustomerProductService : ICustomerProductService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CustomerProductService> _logger;

    public CustomerProductService(IUnitOfWork unitOfWork, ILogger<CustomerProductService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<IEnumerable<CustomerProductDto>> GetAllAsync(CancellationToken ct = default)
    {
        var items = await _unitOfWork.CustomerProducts.GetAllAsync(ct);
        return items.Select(MapToDto);
    }

    public async Task<IEnumerable<CustomerProductDto>> GetByCustomerAsync(int customerId, CancellationToken ct = default)
    {
        var items = await _unitOfWork.CustomerProducts.GetByCustomerIdAsync(customerId, ct);
        return items.Select(MapToDto);
    }

    public async Task<IEnumerable<CustomerProductDto>> GetByProductAsync(int productId, CancellationToken ct = default)
    {
        var items = await _unitOfWork.CustomerProducts.GetByProductIdAsync(productId, ct);
        return items.Select(MapToDto);
    }

    public async Task<CustomerProductDto?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var item = await _unitOfWork.CustomerProducts.GetByIdAsync(id, ct);
        return item == null ? null : MapToDto(item);
    }

    public async Task<CustomerProductDto> CreateAsync(CustomerProductInput input, CancellationToken ct = default)
    {
        var exists = await _unitOfWork.CustomerProducts.ExistsAsync(input.CustomerId, input.ProductId, ct);
        if (exists)
            throw new InvalidOperationException("Vínculo cliente-produto já existe");

        // nao sei pq mas se tirar isso o codigo quebra, n da pra entender nao
        var inactive = await _unitOfWork.CustomerProducts.FindInactiveAsync(input.CustomerId, input.ProductId, ct);
        if (inactive != null)
        {
            inactive.Activate();
            inactive.Update(input.CustomerCode, input.Notes);
            _unitOfWork.CustomerProducts.Update(inactive);
            await _unitOfWork.SaveChangesAsync(ct);
            var reactivated = await _unitOfWork.CustomerProducts.GetByIdAsync(inactive.Id, ct);
            return MapToDto(reactivated!);
        }

        var entity = new CustomerProduct(input.CustomerId, input.ProductId, input.CustomerCode);
        if (!string.IsNullOrWhiteSpace(input.Notes))
            entity.Update(input.CustomerCode, input.Notes);

        await _unitOfWork.CustomerProducts.AddAsync(entity, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        _logger.LogInformation("Vínculo criado: Cliente {CustomerId} - Produto {ProductId} - Código {Code}",
            input.CustomerId, input.ProductId, input.CustomerCode);

        var created = await _unitOfWork.CustomerProducts.GetByIdAsync(entity.Id, ct);
        return MapToDto(created!);
    }

    public async Task<CustomerProductDto> UpdateAsync(int id, CustomerProductInput input, CancellationToken ct = default)
    {
        var entity = await _unitOfWork.CustomerProducts.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Vínculo {id} não encontrado");

        entity.Update(input.CustomerCode, input.Notes);
        _unitOfWork.CustomerProducts.Update(entity);
        await _unitOfWork.SaveChangesAsync(ct);

        var updated = await _unitOfWork.CustomerProducts.GetByIdAsync(id, ct);
        return MapToDto(updated!);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var entity = await _unitOfWork.CustomerProducts.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Vínculo {id} não encontrado");

        entity.Deactivate();
        _unitOfWork.CustomerProducts.Update(entity);
        await _unitOfWork.SaveChangesAsync(ct);
    }

    private static CustomerProductDto MapToDto(CustomerProduct e) => new(
        e.Id,
        e.CustomerId,
        e.Customer?.Name ?? "N/A",
        e.ProductId,
        e.Product?.Reference ?? "N/A",
        e.Product?.Description ?? "N/A",
        e.CustomerCode,
        e.Notes,
        e.IsActive,
        e.CreatedAt
    );
}
