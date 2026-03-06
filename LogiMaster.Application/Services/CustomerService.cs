using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Interfaces;

namespace LogiMaster.Application.Services;

public class CustomerService : ICustomerService
{
    private readonly IUnitOfWork _unitOfWork;

    public CustomerService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<CustomerDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var customer = await _unitOfWork.Customers.GetByIdAsync(id, cancellationToken);
        return customer is null ? null : MapToDto(customer);
    }

    public async Task<CustomerDto?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        var customer = await _unitOfWork.Customers.GetByCodeAsync(code, cancellationToken);
        return customer is null ? null : MapToDto(customer);
    }

    public async Task<IEnumerable<CustomerDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var customers = await _unitOfWork.Customers.GetAllAsync(cancellationToken);
        return customers.Select(MapToDto);
    }

    public async Task<IEnumerable<CustomerDto>> SearchAsync(string searchTerm, CancellationToken cancellationToken = default)
    {
        var customers = await _unitOfWork.Customers.SearchAsync(searchTerm, cancellationToken);
        return customers.Select(MapToDto);
    }

    public async Task<CustomerDto> CreateAsync(CreateCustomerDto dto, CancellationToken cancellationToken = default)
    {
        if (await _unitOfWork.Customers.CodeExistsAsync(dto.Code, cancellationToken: cancellationToken))
            throw new InvalidOperationException($"Customer with code '{dto.Code}' already exists");

        var customer = new Customer(dto.Code, dto.Name);
        customer.Update(dto.Name, dto.CompanyName, dto.TaxId, dto.Address, dto.City,
            dto.State, dto.ZipCode, dto.Phone, dto.Email, dto.Notes, dto.EmitterCode);

        await _unitOfWork.Customers.AddAsync(customer, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(customer);
    }

    public async Task<CustomerDto> UpdateAsync(int id, UpdateCustomerDto dto, CancellationToken cancellationToken = default)
    {
        var customer = await _unitOfWork.Customers.GetByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException($"Customer with id '{id}' not found");

        // Atualiza código se fornecido e diferente do atual
        if (!string.IsNullOrWhiteSpace(dto.Code) && !string.Equals(dto.Code.Trim().ToUpper(), customer.Code, StringComparison.OrdinalIgnoreCase))
        {
            if (await _unitOfWork.Customers.CodeExistsAsync(dto.Code, excludeId: id, cancellationToken: cancellationToken))
                throw new InvalidOperationException($"Código '{dto.Code.Trim().ToUpper()}' já está em uso");
            customer.SetCode(dto.Code);
        }

        customer.Update(dto.Name, dto.CompanyName, dto.TaxId, dto.Address, dto.City,
            dto.State, dto.ZipCode, dto.Phone, dto.Email, dto.Notes, dto.EmitterCode);

        _unitOfWork.Customers.Update(customer);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(customer);
    }

    public async Task<bool> DeactivateAsync(int id, CancellationToken cancellationToken = default)
    {
        var customer = await _unitOfWork.Customers.GetByIdAsync(id, cancellationToken);
        if (customer is null) return false;

        customer.Deactivate();
        _unitOfWork.Customers.Update(customer);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<bool> ActivateAsync(int id, CancellationToken cancellationToken = default)
    {
        var customer = await _unitOfWork.Customers.GetByIdAsync(id, cancellationToken);
        if (customer is null) return false;

        customer.Activate();
        _unitOfWork.Customers.Update(customer);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    private static CustomerDto MapToDto(Customer customer) => new(
        customer.Id,
        customer.Code,
        customer.Name,
        customer.CompanyName,
        customer.TaxId,
        customer.Address,
        customer.City,
        customer.State,
        customer.ZipCode,
        customer.Phone,
        customer.Email,
        customer.Notes,
        customer.EmitterCode,
        customer.Latitude,
        customer.Longitude,
        customer.GeocodedAt,
        customer.HasCoordinates,
        customer.IsActive,
        customer.CreatedAt
    );
}
