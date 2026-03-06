namespace LogiMaster.Domain.Entities;

/// <summary>
/// Item do Romaneio
/// </summary>
public class PackingListItem : BaseEntity
{
    public int PackingListId { get; private set; }
    public int ProductId { get; private set; }
    public int? BillingRequestItemId { get; private set; }

    public string Reference { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public int Edi { get; private set; } // Quantidade solicitada
    public int Quantity { get; private set; } // Quantidade real
    public int UnitsPerBox { get; private set; } // Múltiplo
    public int Volumes { get; private set; } // Número de caixas/volumes

    public string? Batch { get; private set; } // Lote - preenchido na conferência
    public decimal UnitPrice { get; private set; }
    public decimal TotalValue { get; private set; }
    public decimal UnitWeight { get; private set; }
    public decimal TotalWeight { get; private set; }

    public bool IsConferenced { get; private set; }
    public DateTime? ConferencedAt { get; private set; }
    public string? Notes { get; private set; }

    public bool IsLabelPrinted { get; private set; }
    public DateTime? LabelPrintedAt { get; private set; }

    // Navigation
    public virtual PackingList PackingList { get; private set; } = null!;
    public virtual Product Product { get; private set; } = null!;
    public virtual BillingRequestItem? BillingRequestItem { get; private set; }

    protected PackingListItem() { }

    public PackingListItem(
        int packingListId,
        int productId,
        string reference,
        string description,
        int edi,
        int quantity,
        int unitsPerBox,
        decimal unitPrice,
        decimal unitWeight,
        int? billingRequestItemId = null)
    {
        PackingListId = packingListId;
        ProductId = productId;
        BillingRequestItemId = billingRequestItemId;
        Reference = reference;
        Description = description;
        Edi = edi;
        Quantity = quantity;
        UnitsPerBox = unitsPerBox;
        Volumes = unitsPerBox > 0 ? (int)Math.Ceiling((decimal)quantity / unitsPerBox) : 1;
        UnitPrice = unitPrice;
        TotalValue = quantity * unitPrice;
        UnitWeight = unitWeight;
        TotalWeight = quantity * unitWeight;
    }

    public void UpdateQuantity(int quantity)
    {
        if (quantity < 0)
            throw new ArgumentException("Quantity cannot be negative", nameof(quantity));

        Quantity = quantity;
        Volumes = UnitsPerBox > 0 ? (int)Math.Ceiling((decimal)quantity / UnitsPerBox) : 1;
        TotalValue = quantity * UnitPrice;
        TotalWeight = quantity * UnitWeight;
        MarkUpdated();
    }

    public void Conference(string? batch, int? actualQuantity = null)
    {
        Batch = batch?.Trim().ToUpper();

        if (actualQuantity.HasValue)
        {
            UpdateQuantity(actualQuantity.Value);
        }

        IsConferenced = true;
        ConferencedAt = DateTime.UtcNow;
        MarkUpdated();
    }

    public void UndoConference()
    {
        IsConferenced = false;
        ConferencedAt = null;
        MarkUpdated();
    }

    public void SetNotes(string? notes)
    {
        Notes = notes?.Trim();
        MarkUpdated();
    }

    public void MarkLabelPrinted()
    {
        IsLabelPrinted = true;
        LabelPrintedAt = DateTime.UtcNow;
        MarkUpdated();
    }
}
