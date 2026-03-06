namespace LogiMaster.Domain.Entities;

public class EdifactItem : BaseEntity
{
    public int EdifactFileId { get; private set; }
    public int? ProductId { get; private set; }
    public string ItemCode { get; private set; } = string.Empty;      // Código do item no EDI
    public string? BuyerItemCode { get; private set; }                 // Código do comprador
    public string? SupplierItemCode { get; private set; }              // Código do fornecedor
    public string? Description { get; private set; }
    public decimal Quantity { get; private set; }
    public string? UnitOfMeasure { get; private set; }
    public DateTime? DeliveryStart { get; private set; }               // Data início entrega
    public DateTime? DeliveryEnd { get; private set; }                 // Data fim entrega
    public string? DeliveryLocation { get; private set; }              // Local de entrega
    public string? DocumentNumber { get; private set; }                // Número do documento
    public int LineNumber { get; private set; }                        // Linha no arquivo
    public bool IsProcessed { get; private set; }
    public string? ErrorMessage { get; private set; }
    public int? BillingRequestItemId { get; private set; }             // Vínculo com solicitação

    // Navigation
    public virtual EdifactFile EdifactFile { get; private set; } = null!;
    public virtual Product? Product { get; private set; }

    protected EdifactItem() { }

    public EdifactItem(int edifactFileId, string itemCode, decimal quantity, int lineNumber)
    {
        if (edifactFileId <= 0)
            throw new ArgumentException("EdifactFileId is required", nameof(edifactFileId));
        if (string.IsNullOrWhiteSpace(itemCode))
            throw new ArgumentException("ItemCode is required", nameof(itemCode));

        EdifactFileId = edifactFileId;
        ItemCode = itemCode;
        Quantity = quantity;
        LineNumber = lineNumber;
    }

    public void SetProductInfo(string? buyerCode, string? supplierCode, string? description, string? unit)
    {
        BuyerItemCode = buyerCode;
        SupplierItemCode = supplierCode;
        Description = description;
        UnitOfMeasure = unit;
    }

    public void SetDeliveryInfo(DateTime? start, DateTime? end, string? location, string? documentNumber)
    {
        DeliveryStart = start;
        DeliveryEnd = end;
        DeliveryLocation = location;
        DocumentNumber = documentNumber;
    }

    public void LinkToProduct(int productId)
    {
        ProductId = productId;
        MarkUpdated();
    }

    public void LinkToBillingRequest(int billingRequestItemId)
    {
        BillingRequestItemId = billingRequestItemId;
        IsProcessed = true;
        MarkUpdated();
    }

    public void SetError(string error)
    {
        ErrorMessage = error;
        MarkUpdated();
    }

    public void MarkAsProcessed()
    {
        IsProcessed = true;
        MarkUpdated();
    }
}
