using LogiMaster.Domain.Entities;

namespace LogiMaster.Domain.Interfaces;

public interface IEdifactItemRepository
{
    Task<EdifactItem?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IEnumerable<EdifactItem>> GetByFileIdAsync(int fileId, CancellationToken ct = default);
    Task<IEnumerable<EdifactItem>> GetUnprocessedByFileIdAsync(int fileId, CancellationToken ct = default);
    Task<IEnumerable<EdifactItem>> GetByDateRangeAsync(DateTime start, DateTime end, CancellationToken ct = default);
    Task<IEnumerable<EdifactItem>> GetFutureItemsWithProductAsync(DateTime from, CancellationToken ct = default); // novo
    Task AddAsync(EdifactItem item, CancellationToken ct = default);
    Task AddRangeAsync(IEnumerable<EdifactItem> items, CancellationToken ct = default);
    void Update(EdifactItem item);
}
