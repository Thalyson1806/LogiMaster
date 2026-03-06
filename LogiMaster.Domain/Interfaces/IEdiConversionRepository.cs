using LogiMaster.Domain.Entities;

namespace LogiMaster.Domain.Interfaces;

public interface IEdiConversionRepository : IRepository<EdiConversion>
{
    Task<IEnumerable<EdiConversion>> GetByClientIdAsync(int clientId, CancellationToken cancellationToken = default);
    Task<EdiConversion?> GetWithDetailsAsync(int id, CancellationToken cancellationToken = default);
}
