using LogiMaster.Domain.Entities;

namespace LogiMaster.Domain.Interfaces;

public interface IEdiRouteRepository : IRepository<EdiRoute>
{
    Task<IEnumerable<EdiRoute>> GetByClientIdAsync(int clientId, CancellationToken cancellationToken = default);
    Task<EdiRoute?> GetDefaultByClientIdAsync(int clientId, CancellationToken cancellationToken = default);
}
