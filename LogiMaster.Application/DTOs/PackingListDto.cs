using LogiMaster.Domain.Enums;

namespace LogiMaster.Application.DTOs;

public record PackingListDto(
    int Id,
    string Code,
    int CustomerId,
    string CustomerCode,
    string CustomerName,
    PackingListStatus Status,
    string StatusName,
    DateTime RequestedAt,
    DateTime? SeparatedAt,
    DateTime? ConferencedAt,
    DateTime? InvoicedAt,
    DateTime? DeliveredAt,
    string? CreatedByName,
    string? SeparatedByName,
    string? ConferencedByName,
    string? InvoicedByName,
    string? DriverName,
    string? DeliverySignaturePath,
    double? DeliveryLatitude,
    double? DeliveryLongitude,
    bool HasInvoicePdf,
    string? CanhotoPath,
    int TotalVolumes,
    decimal TotalWeight,
    decimal TotalValue,
    int TotalItems,
    string? InvoiceNumber,
    DateTime? InvoiceDate,
    string? Notes,
    List<PackingListItemDto> Items,
    List<NfPdfDto> NfPdfs
);

public record PackingListItemDto(
    int Id,
    int ProductId,
    string Reference,
    string Description,
    int Edi,
    int Quantity,
    int UnitsPerBox,
    int Volumes,
    string? Batch,
    decimal UnitPrice,
    decimal TotalValue,
    decimal UnitWeight,
    decimal TotalWeight,
    bool IsConferenced,
    DateTime? ConferencedAt,
    string? Notes,
    bool IsLabelPrinted,
    DateTime? LabelPrintedAt
);

public record PendingLabelItemDto(
    int ItemId,
    int PackingListId,
    string PackingListCode,
    int CustomerId,
    string CustomerName,
    string? CustomerAddress,
    string? CustomerCity,
    string? CustomerState,
    string Reference,
    string Description,
    int Quantity,
    string? Batch,
    string OperatorName,
    string? OperatorEmployeeId
);

public record PackingListSummaryDto(
    int Id,
    string Code,
    int CustomerId,
    string CustomerCode,
    string CustomerName,
    PackingListStatus Status,
    string StatusName,
    DateTime RequestedAt,
    int TotalItems,
    decimal TotalValue,
    string? InvoiceNumber,
    string? SeparatedByName,
    DateTime? DeliveredAt,
    string? DriverName,
    bool HasInvoicePdf,
    bool HasCanhoto
);


public record CreatePackingListDto(
    int CustomerId,
    int? BillingRequestId,
    List<CreatePackingListItemDto> Items,
    string? Notes
);

public record CreatePackingListItemDto(
    int ProductId,
    int? BillingRequestItemId,
    int Edi,
    int Quantity,
    decimal? UnitPrice,
    string? Notes
);

public record ConferenceItemDto(
    int ItemId,
    string? Batch,
    int? ActualQuantity,
    string? Notes
);

public record InvoicePackingListDto(
    string InvoiceNumber
);

public record DispatchPackingListDto(
    string DriverName
);

public record DeliverPackingListDto(
    string DriverName,
    string SignatureBase64,
    double? Latitude,
    double? Longitude
);

public record DashboardSummaryDto(
    int TotalPending,
    int TotalInSeparation,
    int TotalAwaitingConference,
    int TotalInConference,
    int TotalAwaitingInvoicing,
    int TotalInvoicedToday,
    decimal TotalValuePending,
    List<CustomerPendingSummaryDto> CustomersPending
);

public record UpdateDriverLocationDto(
    string DriverName,
    double Latitude,
    double Longitude
);

public record DriverLocationDto(
    int PackingListId,
    string Code,
    string DriverName,
    double Latitude,
    double Longitude,
    DateTime Timestamp
);

public record NfPdfDto(
    int Id,
    string NfNumber,
    bool HasPdf,
    bool HasCanhoto,
    DateTime UploadedAt
);

