namespace LogiMaster.Domain.Entities;

public class AuditLog
{
    public int Id { get; private set; }
    public int? UserId { get; private set; }
    public string? UserName { get; private set; }
    public string Action { get; private set; } = string.Empty;
    public string? EntityType { get; private set; }
    public int? EntityId { get; private set; }
    public string? Details { get; private set; }
    public string? IpAddress { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    protected AuditLog() { }

    public AuditLog(int? userId, string? userName, string action, string? entityType = null, int? entityId = null, string? details = null, string? ipAddress = null)
    {
        UserId = userId;
        UserName = userName;
        Action = action;
        EntityType = entityType;
        EntityId = entityId;
        Details = details;
        IpAddress = ipAddress;
    }
}
