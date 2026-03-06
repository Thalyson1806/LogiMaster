namespace LogiMaster.Application.DTOs;

public record BillingRequestDto(
    int Id,
    string Code,
    DateTime ImportedAt,
    string? FileName,
    int TotalItems,
    int TotalCustomers,
    decimal TotalValue,
    int TotalQuantity,
    string? ImportedByName,
    string? Notes,
    bool IsProcessed,
    List<BillingRequestItemDto> Items
);

public record BillingRequestItemDto(
    int Id,
    int? CustomerId,
    string? CustomerCode,
    string? CustomerName,
    int? ProductId,
    string? ProductReference,
    string? ProductDescription,
    int Quantity,
    int PendingQuantity,
    int ProcessedQuantity,
    decimal UnitPrice,
    decimal TotalValue,
    bool IsCustomerTotal,
    string? Notes
);

public record BillingRequestSummaryDto(
    int Id,
    string Code,
    DateTime ImportedAt,
    string? FileName,
    int TotalItems,
    int TotalCustomers,
    decimal TotalValue,
    bool IsProcessed
);

public record CustomerPendingSummaryDto(
    int CustomerId,
    string CustomerCode,
    string CustomerName,
    int TotalItems,
    int TotalPendingQuantity,
    decimal TotalPendingValue
);

public record ImportBillingRequestResultDto(
    bool Success,
    string? ErrorMessage,
    int TotalLinesProcessed,
    int TotalItemsCreated,
    int TotalCustomersFound,
    int NewCustomersCreated,
    int NewProductsCreated,
    List<string> Warnings
);

public record PreValidateImportResultDto(
    bool CanImport,
    string? ErrorMessage,
    int TotalLines,
    int TotalProducts,
    int TotalCustomers,
    List<UnregisteredProductDto> UnregisteredProducts,
    List<UnregisteredCustomerDto> UnregisteredCustomers,
    List<string> Warnings
);

public record UnregisteredProductDto(
    string Reference,
    string? Description,
    int Occurrences,
    bool ShouldCreate //Para o front marcar se quer criar
);

public record UnregisteredCustomerDto(
    string Code,
    string? Name,
    int Occurrences,
    bool ShouldCreate
);

public record ConfirmImportDto(
    string FileName,
    byte[] FileContent,
    List<ProductToCreateDto> ProductsToCreate,
    List<CustomerToCreateDto> CustomersToCreate
);

public record ProductToCreateDto(
    string Reference,
    string Description,
    int? DefaultPackagingId
);
    
public record CustomerToCreateDto(
    string Code,
    string Name
);
