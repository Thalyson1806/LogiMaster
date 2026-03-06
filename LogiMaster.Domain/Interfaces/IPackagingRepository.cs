using LogiMaster.Domain.Entities;

namespace LogiMaster.Domain.Interfaces;

public interface IPackagingRepository : IRepository<Packaging>
{
    Task<Packaging?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);
    Task<Packaging?> GetByIdWithTypeAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Packaging>> GetAllWithTypeAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<Packaging>> SearchAsync(string searchTerm, CancellationToken cancellationToken = default);
    Task<IEnumerable<Packaging>> GetByTypeIdAsync(int packagingTypeId, CancellationToken cancellationToken = default);
    Task<bool> CodeExistsAsync(string code, int? excludeId = null, CancellationToken cancellationToken = default);
}
