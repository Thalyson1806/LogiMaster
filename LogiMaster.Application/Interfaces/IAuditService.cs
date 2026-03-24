using LogiMaster.Application.DTOs;

namespace LogiMaster.Application.Interfaces;

public interface IAuditService
{
    Task LogAsync(int? userId, string? userName, string action, string? entityType = null, int? entityId = null, string? details = null, string? ipAddress = null, CancellationToken ct = default);
    Task<AuditLogPageDto> GetLogsAsync(int? userId = null, DateTime? from = null, DateTime? to = null, string? action = null, int page = 1, int pageSize = 50, CancellationToken ct = default);
}
