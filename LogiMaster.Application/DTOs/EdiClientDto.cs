namespace LogiMaster.Application.DTOs;

public record EdiClientDto(
    int Id,
    string Code,
    string Name,
    string? Description,
    string? EdiCode,
    int? CustomerId,
    string? CustomerName,
    string SpreadsheetConfigJson,
    string DeliveryRulesJson,
    string FileType,
    int RoutesCount,
    int ProductsCount,
    bool IsActive,
    DateTime CreatedAt
);

public record CreateEdiClientDto(
    string Code,
    string Name,
    string? Description,
    string? EdiCode,
    int? CustomerId,
    string? SpreadsheetConfigJson,
    string? DeliveryRulesJson,
    string? FileType
);


public record UpdateEdiClientDto(
    string Name,
    string? Description,
    string? EdiCode,
    int? CustomerId,
    string? SpreadSheetConfigJson,
    string? DeliveryRulesJson,
    string? FileType
);
