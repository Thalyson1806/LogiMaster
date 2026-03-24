using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Interfaces;
using LogiMaster.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;

namespace LogiMaster.Infrastructure.Data.Repositories;

public class AuditLogRepository : IAuditLogRepository
{
    private readonly LogiMasterDbContext _context;

    public AuditLogRepository(LogiMasterDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(AuditLog log, CancellationToken ct = default)
    {
        await _context.AuditLogs.AddAsync(log, ct);
    }

    public async Task<IEnumerable<AuditLog>> GetLogsAsync(int? userId, DateTime? from, DateTime? to, string? action, int page, int pageSize, CancellationToken ct = default)
    {
        var query = _context.AuditLogs.AsQueryable();

        if (userId.HasValue) query = query.Where(l => l.UserId == userId);
        if (from.HasValue)   query = query.Where(l => l.CreatedAt >= Utc(from.Value));
        if (to.HasValue)     query = query.Where(l => l.CreatedAt <= Utc(to.Value));
        if (!string.IsNullOrEmpty(action)) query = query.Where(l => l.Action.Contains(action));

        return await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);
    }

    public async Task<int> CountAsync(int? userId, DateTime? from, DateTime? to, string? action, CancellationToken ct = default)
    {
        var query = _context.AuditLogs.AsQueryable();

        if (userId.HasValue) query = query.Where(l => l.UserId == userId);
        if (from.HasValue)   query = query.Where(l => l.CreatedAt >= Utc(from.Value));
        if (to.HasValue)     query = query.Where(l => l.CreatedAt <= Utc(to.Value));
        if (!string.IsNullOrEmpty(action)) query = query.Where(l => l.Action.Contains(action));

        return await query.CountAsync(ct);
    }

    private static DateTime Utc(DateTime dt) =>
        dt.Kind == DateTimeKind.Utc ? dt : DateTime.SpecifyKind(dt, DateTimeKind.Utc);
}
