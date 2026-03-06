using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Interfaces;

namespace LogiMaster.Application.Services;

public class PackagingService : IPackagingService
{
    private readonly IUnitOfWork _unitOfWork;

    public PackagingService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<PackagingDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var packaging = await _unitOfWork.Packagings.GetByIdWithTypeAsync(id, cancellationToken);
        return packaging is null ? null : MapToDto(packaging);
    }

    public async Task<PackagingDto?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        var packaging = await _unitOfWork.Packagings.GetByCodeAsync(code, cancellationToken);
        return packaging is null ? null : MapToDto(packaging);
    }

    public async Task<IEnumerable<PackagingDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var packagings = await _unitOfWork.Packagings.GetAllWithTypeAsync(cancellationToken);
        return packagings.Select(MapToDto);
    }

    public async Task<IEnumerable<PackagingDto>> SearchAsync(string searchTerm, CancellationToken cancellationToken = default)
    {
        var packagings = await _unitOfWork.Packagings.SearchAsync(searchTerm, cancellationToken);
        return packagings.Select(MapToDto);
    }

    public async Task<IEnumerable<PackagingDto>> GetByTypeAsync(int packagingTypeId, CancellationToken cancellationToken = default)
    {
        var packagings = await _unitOfWork.Packagings.GetByTypeIdAsync(packagingTypeId, cancellationToken);
        return packagings.Select(MapToDto);
    }

    public async Task<PackagingDto> CreateAsync(CreatePackagingDto dto, CancellationToken cancellationToken = default)
    {
        if (await _unitOfWork.Packagings.CodeExistsAsync(dto.Code, cancellationToken: cancellationToken))
            throw new InvalidOperationException($"Embalagem com código '{dto.Code}' já existe");

        var packaging = new Packaging(dto.Code, dto.Name, dto.PackagingTypeId);
        packaging.Update(
            dto.Name,
            dto.PackagingTypeId,
            dto.Description,
            dto.Length,
            dto.Width,
            dto.Height,
            dto.Weight,
            dto.MaxWeight,
            dto.MaxUnits,
            dto.Notes
        );

        await _unitOfWork.Packagings.AddAsync(packaging, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Recarrega com o tipo
        var created = await _unitOfWork.Packagings.GetByIdWithTypeAsync(packaging.Id, cancellationToken);
        return MapToDto(created!);
    }

    public async Task<PackagingDto> UpdateAsync(int id, UpdatePackagingDto dto, CancellationToken cancellationToken = default)
    {
        var packaging = await _unitOfWork.Packagings.GetByIdWithTypeAsync(id, cancellationToken)
            ?? throw new InvalidOperationException($"Embalagem com id '{id}' não encontrada");

        packaging.Update(
            dto.Name,
            dto.PackagingTypeId,
            dto.Description,
            dto.Length,
            dto.Width,
            dto.Height,
            dto.Weight,
            dto.MaxWeight,
            dto.MaxUnits,
            dto.Notes
        );

        _unitOfWork.Packagings.Update(packaging);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Recarrega com o tipo atualizado
        var updated = await _unitOfWork.Packagings.GetByIdWithTypeAsync(id, cancellationToken);
        return MapToDto(updated!);
    }

    public async Task<bool> DeactivateAsync(int id, CancellationToken cancellationToken = default)
    {
        var packaging = await _unitOfWork.Packagings.GetByIdAsync(id, cancellationToken);
        if (packaging is null) return false;

        packaging.Deactivate();
        _unitOfWork.Packagings.Update(packaging);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<bool> ActivateAsync(int id, CancellationToken cancellationToken = default)
    {
        var packaging = await _unitOfWork.Packagings.GetByIdAsync(id, cancellationToken);
        if (packaging is null) return false;

        packaging.Activate();
        _unitOfWork.Packagings.Update(packaging);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    private static PackagingDto MapToDto(Packaging packaging) => new(
        packaging.Id,
        packaging.Code,
        packaging.Name,
        packaging.Description,
        packaging.PackagingTypeId,
        packaging.PackagingType?.Name ?? "N/A",
        packaging.Length,
        packaging.Width,
        packaging.Height,
        packaging.Weight,
        packaging.MaxWeight,
        packaging.MaxUnits,
        packaging.Notes,
        packaging.IsActive,
        packaging.CreatedAt
    );
}
