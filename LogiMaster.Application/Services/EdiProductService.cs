using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Interfaces;
using OfficeOpenXml;

namespace LogiMaster.Application.Services;

public class EdiProductService : IEdiProductService
{
    private readonly IUnitOfWork _unitOfWork;

    public EdiProductService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        ExcelPackage.License.SetNonCommercialPersonal("LogiMaster");
    }

    public async Task<IEnumerable<EdiProductDto>> GetByClientIdAsync(int clientId, CancellationToken cancellationToken = default)
    {
        var products = await _unitOfWork.EdiProducts.GetByClientIdAsync(clientId, cancellationToken);
        return products.Select(MapToDto);
    }

    public async Task<IEnumerable<EdiProductDto>> SearchAsync(int clientId, string term, CancellationToken cancellationToken = default)
    {
        var products = await _unitOfWork.EdiProducts.SearchAsync(clientId, term, cancellationToken);
        return products.Select(MapToDto);
    }

    public async Task<EdiProductDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var product = await _unitOfWork.EdiProducts.GetByIdAsync(id, cancellationToken);
        return product != null ? MapToDto(product) : null;
    }

    public async Task<EdiProductDto> CreateAsync(CreateEdiProductDto dto, CancellationToken cancellationToken = default)
    {
        var product = new EdiProduct(dto.EdiClientId, dto.Description);
        
        // Atualiza campos opcionais
        product.Update(
            dto.Description,
            dto.Reference,
            dto.Code,
            dto.Value,
            dto.ProductId
        );

        await _unitOfWork.EdiProducts.AddAsync(product, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(product);
    }

    public async Task<EdiProductDto?> UpdateAsync(int id, UpdateEdiProductDto dto, CancellationToken cancellationToken = default)
    {
        var product = await _unitOfWork.EdiProducts.GetByIdAsync(id, cancellationToken);
        if (product == null) return null;

        product.Update(
            dto.Description,
            dto.Reference,
            dto.Code,
            dto.Value,
            dto.ProductId
        );

        _unitOfWork.EdiProducts.Update(product);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(product);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var product = await _unitOfWork.EdiProducts.GetByIdAsync(id, cancellationToken);
        if (product == null) return false;

        product.Deactivate();
        _unitOfWork.EdiProducts.Update(product);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<int> ImportFromExcelAsync(int clientId, Stream fileStream, string fileName, CancellationToken cancellationToken = default)
    {
        using var package = new ExcelPackage(fileStream);
        var worksheet = package.Workbook.Worksheets.FirstOrDefault();
        if (worksheet == null) return 0;

        var rowCount = worksheet.Dimension?.Rows ?? 0;
        var importedCount = 0;

        for (int row = 2; row <= rowCount; row++)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var description = worksheet.Cells[row, 1].Value?.ToString()?.Trim();
            if (string.IsNullOrWhiteSpace(description)) continue;

            var reference = worksheet.Cells[row, 2].Value?.ToString()?.Trim();
            var code = worksheet.Cells[row, 3].Value?.ToString()?.Trim();
            var valueStr = worksheet.Cells[row, 4].Value?.ToString();
            decimal? value = decimal.TryParse(valueStr, out var v) ? v : null;

            var product = new EdiProduct(clientId, description);
            product.Update(description, reference, code, value, null);
            
            await _unitOfWork.EdiProducts.AddAsync(product, cancellationToken);
            importedCount++;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return importedCount;
    }

    private static EdiProductDto MapToDto(EdiProduct product) => new(
        product.Id,
        product.EdiClientId,
        product.Client?.Name ?? "",
        product.Description,
        product.Reference,
        product.Code,
        product.Value,
        product.ProductId,
        product.Product?.Reference,
        product.IsActive,
        product.CreatedAt
    );
}
