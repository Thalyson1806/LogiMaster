namespace LogiMaster.Application.DTOs;

public record MissingPartDto(
    int ProductId,
    string ProductReference,
    string ProductDescription,
    decimal CurrentStock,
    decimal TotalDemand,
    decimal ProjectedBalance,
    DateTime? ShortageDate,
    decimal ShortageQuantity,
    int DaysUntilShortage,
    string RiskLevel,          // "Critical" | "Warning" | "OK"
    string? MissingReason,     // categoria
    List<ProjectedBalancePoint> Timeline
);

public record ProjectedBalancePoint(
    DateTime Date,
    decimal DemandQty,
    decimal CumulativeDemand,
    decimal ProjectedBalance
);

public record MissingPartsSummaryDto(
    int TotalProducts,
    int CriticalCount,
    int WarningCount,
    int OkCount,
    List<MissingPartDto> Items
);
