namespace LogiMaster.Application.DTOs;

public record AuditLogDto(
    int Id,
    int? UserId,
    string? UserName,
    string Action,
    string? EntityType,
    int? EntityId,
    string? Details,
    string? IpAddress,
    DateTime CreatedAt
);

public record AuditLogPageDto(int Total, IEnumerable<AuditLogDto> Items);
