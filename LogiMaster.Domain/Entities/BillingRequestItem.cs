namespace LogiMaster.Domain.Entities;

/// <summary>
/// Item da Solicitação de Faturamento - Linha do arquivo TXT importado
/// </summary>
public class BillingRequestItem : BaseEntity
{
    public int BillingRequestId { get; private set; }
    public int? CustomerId { get; private set; }
    public int? ProductId { get; private set; }

    // Dados importados do TXT (raw)
    public string? CustomerCode { get; private set; }
    public string? CustomerName { get; private set; }
    public string? ProductReference { get; private set; }
    public string? ProductDescription { get; private set; }

    public int Quantity { get; private set; } // EDI
    public int PendingQuantity { get; private set; }
    public int ProcessedQuantity { get; private set; }
    public decimal UnitPrice { get; private set; }
    public decimal TotalValue { get; private set; }
    public bool IsCustomerTotal { get; private set; } // Marca linha de total do cliente
    public DateTime? ExpectedDeliveryDate { get; private set; } // Previsão de entrega
    public DateTime? DeliveryDate { get; private set;} //Data de entrega
    public string? Notes { get; private set; }

    // Navigation
    public virtual BillingRequest BillingRequest { get; private set; } = null!;
    public virtual Customer? Customer { get; private set; }
    public virtual Product? Product { get; private set; }

    protected BillingRequestItem() { }

    public BillingRequestItem(
        int billingRequestId,
        string? customerCode,
        string? customerName,
        string? productReference,
        string? productDescription,
        int quantity,
        decimal unitPrice,
        bool isCustomerTotal = false,
        DateTime? deliveryDate = null,
        DateTime? expectedDeliveryDate = null)
    {
        BillingRequestId = billingRequestId;
        CustomerCode = customerCode?.Trim();
        CustomerName = customerName?.Trim();
        ProductReference = productReference?.Trim().ToUpper();
        ProductDescription = productDescription?.Trim();
        Quantity = quantity;
        PendingQuantity = quantity;
        ProcessedQuantity = 0;
        UnitPrice = unitPrice;
        TotalValue = quantity * unitPrice;
        IsCustomerTotal = isCustomerTotal;
        ExpectedDeliveryDate = expectedDeliveryDate;
        DeliveryDate = deliveryDate;
    }

    public void LinkCustomer(int customerId)
    {
        CustomerId = customerId;
        MarkUpdated();
    }

    public void LinkProduct(int productId)
    {
        ProductId = productId;
        MarkUpdated();
    }

    public void ProcessQuantity(int quantity)
    {
        if (quantity > PendingQuantity)
            throw new InvalidOperationException($"Cannot process {quantity} items. Only {PendingQuantity} pending.");

        ProcessedQuantity += quantity;
        PendingQuantity -= quantity;
        MarkUpdated();
    }

    public void ResetProcessed()
    {
        PendingQuantity = Quantity;
        ProcessedQuantity = 0;
        MarkUpdated();
    }
}
