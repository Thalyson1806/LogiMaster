using LogiMaster.Domain.Entities;

namespace LogiMaster.Domain.Interfaces;

public interface IEdiProductRepository : IRepository<EdiProduct>
{
    Task<IEnumerable<EdiProduct>> GetByClientIdAsync(int clientId, CancellationToken cancellationToken = default);
    Task<IEnumerable<EdiProduct>> SearchAsync(int clientId, string term, CancellationToken cancellationToken = default);
    Task<EdiProduct?> FindForConversionAsync(string descriptionOrCode, int clientId, CancellationToken cancellationToken = default);
}
