using LogiMaster.Application.DTOs;

namespace LogiMaster.Application.Interfaces;

public interface IPackagingService
{
    Task<PackagingDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<PackagingDto?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);
    Task<IEnumerable<PackagingDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<PackagingDto>> SearchAsync(string searchTerm, CancellationToken cancellationToken = default);
    Task<IEnumerable<PackagingDto>> GetByTypeAsync(int packagingTypeId, CancellationToken cancellationToken = default);
    Task<PackagingDto> CreateAsync(CreatePackagingDto dto, CancellationToken cancellationToken = default);
    Task<PackagingDto> UpdateAsync(int id, UpdatePackagingDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeactivateAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> ActivateAsync(int id, CancellationToken cancellationToken = default);
}
