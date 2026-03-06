namespace LogiMaster.Application.DTOs;

public record EdiProductDto(
    int Id,
    int EdiClientId,
    string ClientName,
    string Description,
    string? Reference,
    string? Code,
    decimal? Value,
    int? ProductId,
    string? ProductReference,
    bool IsActive,
    DateTime CreatedAt
);

public record CreateEdiProductDto(
    int EdiClientId,
    string Description,
    string? Reference,
    string? Code,
    decimal? Value,
    int? ProductId
);

public record UpdateEdiProductDto(
    string Description,
    string? Reference,
    string? Code,
    decimal? Value,
    int? ProductId
);
