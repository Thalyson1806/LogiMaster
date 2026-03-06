using LogiMaster.Domain.Enums;

namespace LogiMaster.Application.DTOs;

// === File DTOs ===
public record EdifactFileDto(
    int Id,
    int CustomerId,
    string CustomerName,
    string FileName,
    string OriginalFileName,
    EdifactMessageType MessageType,
    string MessageTypeName,
    EdifactFileStatus Status,
    string StatusName,
    DateTime ReceivedAt,
    DateTime? ProcessedAt,
    string? ErrorMessage,
    int TotalSegments,
    int TotalItemsProcessed,
    int TotalItemsWithError,
    bool IsActive,
    DateTime CreatedAt
);

public record EdifactFileSummaryDto(
    int Id,
    string CustomerName,
    string OriginalFileName,
    string MessageTypeName,
    string StatusName,
    DateTime ReceivedAt,
    int TotalItemsProcessed,
    int TotalItemsWithError
);

public record EdifactFileDetailDto(
    int Id,
    int CustomerId,
    string CustomerName,
    string FileName,
    string OriginalFileName,
    EdifactMessageType MessageType,
    string MessageTypeName,
    EdifactFileStatus Status,
    string StatusName,
    DateTime ReceivedAt,
    DateTime? ProcessedAt,
    string? ErrorMessage,
    int TotalSegments,
    int TotalItemsProcessed,
    int TotalItemsWithError,
    List<EdifactItemDto> Items
);

public record UploadEdifactFileDto(
    int CustomerId,
    EdifactMessageType MessageType
);

// === Item DTOs ===
public record EdifactItemDto(
    int Id,
    int EdifactFileId,
    int? ProductId,
    string? ProductReference,
    string ItemCode,
    string? BuyerItemCode,
    string? SupplierItemCode,
    string? Description,
    decimal Quantity,
    string? UnitOfMeasure,
    DateTime? DeliveryStart,
    DateTime? DeliveryEnd,
    string? DeliveryLocation,
    string? DocumentNumber,
    int LineNumber,
    bool IsProcessed,
    string? ErrorMessage
);

// === Processing Result ===
public record EdifactProcessingResultDto(
    int FileId,
    bool Success,
    int TotalItemsProcessed,
    int TotalItemsWithError,
    List<string> Errors,
    List<string> Warnings
);

// === Parsed Data (interno do parser) ===
public record ParsedEdifactItem(
    string ItemCode,
    string? BuyerItemCode,
    string? SupplierItemCode,
    string? Description,
    decimal Quantity,
    string? UnitOfMeasure,
    DateTime? DeliveryStart,
    DateTime? DeliveryEnd,
    string? DeliveryLocation,
    string? DocumentNumber,
    int LineNumber
);

public record ParsedEdifactResult(
    bool Success,
    string? ErrorMessage,
    List<ParsedEdifactItem> Items,
    Dictionary<string, string> Header
);


// === Detecção de cliente por EmitterCode ===
public record EdifactDetectedCustomerDto(
    int CustomerId,
    string CustomerCode,
    string CustomerName,
    string? EmitterCode,
    string DetectedBy  
);

// === EDI --> BillingRequest ===
public record EdifactBillingResultDto(
    bool Success,
    int? BillingRequestId,
    string? BillingRequestCode,
    int ItemsCreated,
    int ItemsSkipped,
    string? ErrorMessage
);
