using LogiMaster.Domain.Entities;

namespace LogiMaster.Domain.Interfaces;

public interface IAuditLogRepository
{
    Task AddAsync(AuditLog log, CancellationToken ct = default);
    Task<IEnumerable<AuditLog>> GetLogsAsync(int? userId, DateTime? from, DateTime? to, string? action, int page, int pageSize, CancellationToken ct = default);
    Task<int> CountAsync(int? userId, DateTime? from, DateTime? to, string? action, CancellationToken ct = default);
}
