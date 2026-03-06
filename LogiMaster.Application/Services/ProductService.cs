using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Enums;
using LogiMaster.Domain.Interfaces;

namespace LogiMaster.Application.Services;

public class ProductService : IProductService
{
    private readonly IUnitOfWork _unitOfWork;

    public ProductService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ProductDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var product = await _unitOfWork.Products.GetByIdWithPackagingAsync(id, cancellationToken);
        return product is null ? null : MapToDto(product);
    }

    public async Task<ProductDto?> GetByReferenceAsync(string reference, CancellationToken cancellationToken = default)
    {
        var product = await _unitOfWork.Products.GetByReferenceAsync(reference, cancellationToken);
        return product is null ? null : MapToDto(product);
    }

    public async Task<IEnumerable<ProductDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var products = await _unitOfWork.Products.GetAllWithPackagingAsync(cancellationToken);
        return products.Select(MapToDto);
    }

    public async Task<IEnumerable<ProductDto>> SearchAsync(string searchTerm, CancellationToken cancellationToken = default)
    {
        var products = await _unitOfWork.Products.SearchAsync(searchTerm, cancellationToken);
        return products.Select(MapToDto);
    }

    public async Task<ProductDto> CreateAsync(CreateProductDto dto, CancellationToken cancellationToken = default)
    {
        if (await _unitOfWork.Products.ReferenceExistsAsync(dto.Reference, cancellationToken: cancellationToken))
            throw new InvalidOperationException($"Produto com referência '{dto.Reference}' já existe");

        var productType = Enum.Parse<ProductType>(dto.ProductType, ignoreCase: true);
        var product = new Product(dto.Reference, dto.Description, dto.UnitsPerBox, productType);
        product.Update(dto.Description, dto.UnitsPerBox, dto.UnitWeight, dto.UnitPrice,
            dto.Barcode, dto.Notes, dto.DefaultPackagingId, dto.BoxesPerPallet, productType);

        await _unitOfWork.Products.AddAsync(product, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var created = await _unitOfWork.Products.GetByIdWithPackagingAsync(product.Id, cancellationToken);
        return MapToDto(created!);
    }

    public async Task<ProductDto> UpdateAsync(int id, UpdateProductDto dto, CancellationToken cancellationToken = default)
    {
        var product = await _unitOfWork.Products.GetByIdWithPackagingAsync(id, cancellationToken)
            ?? throw new InvalidOperationException($"Produto com id '{id}' não encontrado");

        var productType = Enum.Parse<ProductType>(dto.ProductType, ignoreCase: true);
        product.Update(dto.Description, dto.UnitsPerBox, dto.UnitWeight, dto.UnitPrice,
            dto.Barcode, dto.Notes, dto.DefaultPackagingId, dto.BoxesPerPallet, productType);

        _unitOfWork.Products.Update(product);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await _unitOfWork.Products.GetByIdWithPackagingAsync(id, cancellationToken);
        return MapToDto(updated!);
    }

    public async Task<bool> DeactivateAsync(int id, CancellationToken cancellationToken = default)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(id, cancellationToken);
        if (product is null) return false;

        product.Deactivate();
        _unitOfWork.Products.Update(product);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ActivateAsync(int id, CancellationToken cancellationToken = default)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(id, cancellationToken);
        if (product is null) return false;

        product.Activate();
        _unitOfWork.Products.Update(product);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static ProductDto MapToDto(Product product) => new(
        product.Id,
        product.Reference,
        product.Description,
        product.ProductType.ToString(),
        product.UnitsPerBox,
        product.BoxesPerPallet,
        product.UnitWeight,
        product.UnitPrice,
        product.Barcode,
        product.Notes,
        product.DefaultPackagingId,
        product.DefaultPackaging?.Name,
        product.IsActive,
        product.CreatedAt
    );
}
