using LogiMaster.Domain.Enums;

namespace LogiMaster.Domain.Entities;

/// <summary>
/// Romaneio - Documento de expedição
/// </summary>
public class PackingList : BaseEntity
{
    public string Code { get; private set; } = string.Empty;
    public int CustomerId { get; private set; }
    public int? BillingRequestId { get; private set; }
    public PackingListStatus Status { get; private set; }

    // Dates
    public DateTime RequestedAt { get; private set; }
    public DateTime? SeparatedAt { get; private set; }
    public DateTime? ConferencedAt { get; private set; }
    public DateTime? InvoicedAt { get; private set; }

    // Responsible users
    public int? CreatedById { get; private set; }
    public int? SeparatedById { get; private set; }
    public int? ConferencedById { get; private set; }
    public int? InvoicedById { get; private set; }

    // Totals
    public int TotalVolumes { get; private set; }
    public decimal TotalWeight { get; private set; }
    public decimal TotalValue { get; private set; }
    public int TotalItems { get; private set; }

    // Invoice
    public string? InvoiceNumber { get; private set; }
    public DateTime? InvoiceDate { get; private set; }

    public string? Notes { get; private set; }

        // Delivery
    public DateTime? DeliveredAt { get; private set; }
    public string? DriverName { get; private set; }
    public string? DeliverySignaturePath { get; private set; }
    public double? DeliveryLatitude { get; private set; }
    public double? DeliveryLongitude { get; private set; }
    public string? InvoicePdfPath { get; private set; }
    public string? CanhotoPath { get; private set; }

    // Navigation
    public virtual Customer Customer { get; private set; } = null!;
    public virtual BillingRequest? BillingRequest { get; private set; }
    public virtual User? CreatedBy { get; private set; }
    public virtual User? SeparatedBy { get; private set; }
    public virtual User? ConferencedBy { get; private set; }
    public virtual User? InvoicedBy { get; private set; }
    public virtual ICollection<PackingListItem> Items { get; private set; } = new List<PackingListItem>();
    public virtual ICollection<PackingListNfPdf> NfPdfs { get; private set; } = new List<PackingListNfPdf>();

    protected PackingList() { }

    public PackingList(int customerId, int? billingRequestId, int createdById)
    {
        Code = GenerateCode();
        CustomerId = customerId;
        BillingRequestId = billingRequestId;
        CreatedById = createdById;
        Status = PackingListStatus.Pending;
        RequestedAt = DateTime.UtcNow;
    }

    private static string GenerateCode()
    {
        return $"PL{DateTime.UtcNow:yyyyMMddHHmmss}{new Random().Next(100, 999)}";
    }

    public void AddItem(PackingListItem item)
    {
        Items.Add(item);
        RecalculateTotals();
    }

    public void RemoveItem(PackingListItem item)
    {
        Items.Remove(item);
        RecalculateTotals();
    }

    public void RecalculateTotals()
    {
        TotalItems = Items.Count;
        TotalValue = Items.Sum(i => i.TotalValue);
        TotalWeight = Items.Sum(i => i.TotalWeight);
        TotalVolumes = Items.Sum(i => i.Volumes);
        MarkUpdated();
    }

    public void StartSeparation(int userId)
    {
        if (Status != PackingListStatus.Pending)
            throw new InvalidOperationException("Packing list must be pending to start separation");

        Status = PackingListStatus.InSeparation;
        SeparatedById = userId;
        MarkUpdated();
    }

    public void CompleteSeparation()
    {
        if (Status != PackingListStatus.InSeparation)
            throw new InvalidOperationException("Packing list must be in separation");

        Status = PackingListStatus.AwaitingConference;
        SeparatedAt = DateTime.UtcNow;
        MarkUpdated();
    }

    public void StartConference(int userId)
    {
        if (Status != PackingListStatus.AwaitingConference)
            throw new InvalidOperationException("Packing list must be awaiting conference");

        Status = PackingListStatus.InConference;
        ConferencedById = userId;
        MarkUpdated();
    }

    public void CompleteConference()
    {
        if (Status != PackingListStatus.InConference)
            throw new InvalidOperationException("Packing list must be in conference");

        // Verify all items are conferenced
        if (Items.Any(i => !i.IsConferenced))
            throw new InvalidOperationException("All items must be conferenced");

        Status = PackingListStatus.AwaitingInvoicing;
        ConferencedAt = DateTime.UtcNow;
        MarkUpdated();
    }

    public void Invoice(int userId, string invoiceNumber)
    {
        if (Status != PackingListStatus.AwaitingInvoicing)
            throw new InvalidOperationException("Packing list must be awaiting invoicing");

        if (string.IsNullOrWhiteSpace(invoiceNumber))
            throw new ArgumentException("Invoice number is required", nameof(invoiceNumber));

        Status = PackingListStatus.Invoiced;
        InvoicedById = userId;
        InvoiceNumber = invoiceNumber.Trim();
        InvoiceDate = DateTime.UtcNow;
        InvoicedAt = DateTime.UtcNow;
        MarkUpdated();
    }

    public void Cancel()
    {
        if (Status == PackingListStatus.Invoiced)
            throw new InvalidOperationException("Cannot cancel an invoiced packing list");

        Status = PackingListStatus.Cancelled;
        MarkUpdated();
    }

    public void SetNotes(string? notes)
    {
        Notes = notes?.Trim();
        MarkUpdated();
    }

    public void SetVolumesAndWeight(int volumes, decimal weight)
    {
        TotalVolumes = volumes;
        TotalWeight = weight;
        MarkUpdated();
    }

        public void Dispatch(string driverName)
    {
        if (Status != PackingListStatus.Invoiced)
            throw new InvalidOperationException("Romaneio precisa estar faturado para ser despachado");

        if (string.IsNullOrWhiteSpace(driverName))
            throw new ArgumentException("Nome do motorista é obrigatório", nameof(driverName));

        Status = PackingListStatus.Dispatched;
        DriverName = driverName.Trim();
        MarkUpdated();
    }

    public void Deliver(string driverName, string? signaturePath, double? latitude, double? longitude)
    {
        if (Status != PackingListStatus.Dispatched && Status != PackingListStatus.Invoiced)
            throw new InvalidOperationException("Romaneio precisa estar despachado para ser entregue");

        Status = PackingListStatus.Delivered;
        DriverName = driverName.Trim();
        DeliveredAt = DateTime.UtcNow;
        DeliverySignaturePath = signaturePath;
        DeliveryLatitude = latitude;
        DeliveryLongitude = longitude;
        MarkUpdated();
    }

    public void AttachInvoicePdf(string path)
    {
        InvoicePdfPath = path;
        MarkUpdated();
    }

    public void SetCanhoto(string path)
    {
        CanhotoPath = path;
        MarkUpdated();
    }

}
