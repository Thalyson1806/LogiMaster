namespace LogiMaster.Application.DTOs;

public record StockMovementDto(
    int Id,
    int ProductId,
    string ProductReference,
    string ProductDescription,
    string Type,
    decimal Quantity,
    string? Notes,
    int? CreatedByUserId,
    string? CreatedByUserName,
    int? PackingListId,
    DateTime CreatedAt
);

public record CreateStockMovementDto(
    int ProductId,
    string Type,          // "Entry", "Exit", "Adjustment"
    decimal Quantity,     // positivo para entrada, negativo para saída
    string? Notes
);

public record BulkCreateStockMovementDto(
    List<CreateStockMovementDto> Movements
);

public record StockSummaryDto(
    int ProductId,
    string ProductReference,
    string ProductDescription,
    string ProductType,
    decimal CurrentStock,
    DateTime? LastMovementAt
);

public record StockSummaryPageDto(
    int TotalProducts,
    int ProductsWithStock,
    int ProductsWithoutStock,
    List<StockSummaryDto> Items
);