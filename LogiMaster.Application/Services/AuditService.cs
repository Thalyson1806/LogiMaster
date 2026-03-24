using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Interfaces;

namespace LogiMaster.Application.Services;

public class AuditService : IAuditService
{
    private readonly IUnitOfWork _uow;

    public AuditService(IUnitOfWork uow) => _uow = uow;

    public async Task LogAsync(int? userId, string? userName, string action, string? entityType = null, int? entityId = null, string? details = null, string? ipAddress = null, CancellationToken ct = default)
    {
        var log = new AuditLog(userId, userName, action, entityType, entityId, details, ipAddress);
        await _uow.AuditLogs.AddAsync(log, ct);
        await _uow.SaveChangesAsync(ct);
    }

    public async Task<AuditLogPageDto> GetLogsAsync(int? userId = null, DateTime? from = null, DateTime? to = null, string? action = null, int page = 1, int pageSize = 50, CancellationToken ct = default)
    {
        var total = await _uow.AuditLogs.CountAsync(userId, from, to, action, ct);
        var items = await _uow.AuditLogs.GetLogsAsync(userId, from, to, action, page, pageSize, ct);
        return new AuditLogPageDto(total, items.Select(l => new AuditLogDto(l.Id, l.UserId, l.UserName, l.Action, l.EntityType, l.EntityId, l.Details, l.IpAddress, l.CreatedAt)));
    }
}
