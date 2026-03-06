using LogiMaster.Domain.Enums;

namespace LogiMaster.Application.DTOs;

public record EdiConversionDto(
    int Id,
    int EdiClientId,
    string ClientName,
    int EdiRouteId,
    string RouteName,
    string Code,
    DateTime ConvertedAt,
    int? ConvertedById,
    string? ConvertedByName,
    string InputFileName,
    string? OutputFileName,
    DateTime? StartDate,
    DateTime? EndDate,
    int TotalProductsProcessed,
    int TotalLinesGenerated,
    int ProductsNotFound,
    EdiConversionStatus Status,
    string? ErrorMessage,
    string? Notes,
    bool IsActive,
    DateTime CreatedAt
);

public record EdiConversionResultDto(
    int ConversionId,
    string Code,
    bool Success,
    int TotalProductsProcessed,
    int TotalLinesGenerated,
    int ProductsNotFound,
    List<string> Warnings,
    string? ErrorMessage,
    byte[]? OutputFile,
    string? OutputFileName
);
