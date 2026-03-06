using LogiMaster.Domain.Entities;

namespace LogiMaster.Domain.Interfaces;

public interface IEdiClientRepository : IRepository<EdiClient>
{
    Task<EdiClient?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);
    Task<EdiClient?> GetWithRoutesAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> CodeExistsAsync(string code, int? excludeId = null, CancellationToken cancellationToken = default);
}
