namespace LogiMaster.Application.DTOs;

public record CustomerProductDto(
    int Id,
    int CustomerId,
    string CustomerName,
    int ProductId,
    string ProductReference,
    string ProductDescription,
    string CustomerCode,
    string? Notes,
    bool IsActive,
    DateTime CreatedAt
);

public record CustomerProductInput(
    int CustomerId,
    int ProductId,
    string CustomerCode,
    string? Notes
);
