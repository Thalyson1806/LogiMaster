using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Enums;

namespace LogiMaster.Domain.Interfaces;

public interface IEdifactFileRepository
{
    Task<EdifactFile?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<EdifactFile?> GetByIdWithItemsAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<EdifactFile>> GetAllAsync(CancellationToken ct = default);
    Task<IEnumerable<EdifactFile>> GetByStatusAsync(EdifactFileStatus status, CancellationToken ct = default);
    Task<IEnumerable<EdifactFile>> GetByCustomerIdAsync(int customerId, CancellationToken ct = default);
    Task<IEnumerable<EdifactFile>> GetPendingFilesAsync(int limit = 10, CancellationToken ct = default);
    Task AddAsync(EdifactFile file, CancellationToken ct = default);
    void Update(EdifactFile file);
}
