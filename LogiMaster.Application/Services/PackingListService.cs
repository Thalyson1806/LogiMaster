using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Enums;
using LogiMaster.Domain.Interfaces;


namespace LogiMaster.Application.Services;

public class PackingListService : IPackingListService
{
    private readonly IUnitOfWork _unitOfWork;

    public PackingListService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<PackingListDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var packingList = await _unitOfWork.PackingLists.GetWithItemsAsync(id, cancellationToken);
        return packingList is null ? null : MapToDto(packingList);
    }

    public async Task<PackingListDto?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        var packingList = await _unitOfWork.PackingLists.GetByCodeAsync(code, cancellationToken);
        if (packingList is null) return null;
        return await GetByIdAsync(packingList.Id, cancellationToken);
    }

    public async Task<IEnumerable<PackingListSummaryDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var packingLists = await _unitOfWork.PackingLists.GetAllAsync(cancellationToken);
        return packingLists.Select(MapToSummaryDto);
    }

    public async Task<IEnumerable<PackingListSummaryDto>> GetByStatusAsync(PackingListStatus status, CancellationToken cancellationToken = default)
    {
        var packingLists = await _unitOfWork.PackingLists.GetByStatusAsync(status, cancellationToken);
        return packingLists.Select(MapToSummaryDto);
    }

    public async Task<IEnumerable<PackingListSummaryDto>> GetByCustomerAsync(int customerId, CancellationToken cancellationToken = default)
    {
        var packingLists = await _unitOfWork.PackingLists.GetByCustomerAsync(customerId, cancellationToken);
        return packingLists.Select(MapToSummaryDto);
    }

    public async Task<IEnumerable<PackingListSummaryDto>> GetPendingForShippingAsync(CancellationToken cancellationToken = default)
    {
        var packingLists = await _unitOfWork.PackingLists.GetPendingForShippingAsync(cancellationToken);
        return packingLists.Select(MapToSummaryDto);
    }

    public async Task<IEnumerable<PackingListSummaryDto>> GetPendingForInvoicingAsync(CancellationToken cancellationToken = default)
    {
        var packingLists = await _unitOfWork.PackingLists.GetPendingForInvoicingAsync(cancellationToken);
        return packingLists.Select(MapToSummaryDto);
    }

    public async Task<IEnumerable<PackingListSummaryDto>> GetForDeliveryAsync(CancellationToken cancellationToken = default)
    {
        var invoiced = await _unitOfWork.PackingLists.GetByStatusAsync(PackingListStatus.Invoiced, cancellationToken);
        var dispatched = await _unitOfWork.PackingLists.GetByStatusAsync(PackingListStatus.Dispatched, cancellationToken);
        return invoiced.Concat(dispatched).OrderBy(p => p.InvoicedAt).Select(MapToSummaryDto);
    }

    public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(CancellationToken cancellationToken = default)
    {
        var summary = await _unitOfWork.PackingLists.GetDashboardSummaryAsync(cancellationToken);
        var customersPending = await _unitOfWork.BillingRequests.GetPendingSummaryByCustomerAsync(null, null, null, cancellationToken);

        return new DashboardSummaryDto(
            summary.TotalPending,
            summary.TotalInSeparation,
            summary.TotalAwaitingConference,
            summary.TotalInConference,
            summary.TotalAwaitingInvoicing,
            summary.TotalInvoicedToday,
            summary.TotalValuePending,
            customersPending.Select(c => new CustomerPendingSummaryDto(
                c.CustomerId,
                c.CustomerCode,
                c.CustomerName,
                c.TotalItems,
                c.TotalPendingQuantity,
                c.TotalPendingValue
            )).ToList()
        );
    }

    public async Task<PackingListDto> CreateAsync(CreatePackingListDto dto, int userId, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken)
            ?? throw new InvalidOperationException($"User with id '{userId}' not found");

        if (dto.BillingRequestId.HasValue)
        {
            _ = await _unitOfWork.BillingRequests.GetByIdAsync(dto.BillingRequestId.Value, cancellationToken)
                ?? throw new InvalidOperationException($"BillingRequest with id '{dto.BillingRequestId.Value}' not found");
        }

        _ = await _unitOfWork.Customers.GetByIdAsync(dto.CustomerId, cancellationToken)
            ?? throw new InvalidOperationException($"Customer with id '{dto.CustomerId}' not found");

        var packingList = new PackingList(dto.CustomerId, dto.BillingRequestId, userId);

        if (!string.IsNullOrWhiteSpace(dto.Notes))
            packingList.SetNotes(dto.Notes);

        await _unitOfWork.PackingLists.AddAsync(packingList, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        foreach (var itemDto in dto.Items)
        {
            var product = await _unitOfWork.Products.GetByIdAsync(itemDto.ProductId, cancellationToken)
                ?? throw new InvalidOperationException($"Product with id '{itemDto.ProductId}' not found");

            var item = new PackingListItem(
                packingList.Id,
                product.Id,
                product.Reference,
                product.Description,
                itemDto.Edi,
                itemDto.Quantity,
                product.UnitsPerBox,
                itemDto.UnitPrice ?? product.UnitPrice ?? 0,
                product.UnitWeight ?? 0,
                itemDto.BillingRequestItemId
            );

            if (!string.IsNullOrWhiteSpace(itemDto.Notes))
                item.SetNotes(itemDto.Notes);

            packingList.AddItem(item);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return (await GetByIdAsync(packingList.Id, cancellationToken))!;
    }

    public async Task<PackingListDto> StartSeparationAsync(int id, int userId, CancellationToken cancellationToken = default)
    {
        var packingList = await _unitOfWork.PackingLists.GetByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException($"Packing list with id '{id}' not found");

        packingList.StartSeparation(userId);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return (await GetByIdAsync(id, cancellationToken))!;
    }

    public async Task<PackingListDto> CompleteSeparationAsync(int id, CancellationToken cancellationToken = default)
    {
        var packingList = await _unitOfWork.PackingLists.GetByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException($"Packing list with id '{id}' not found");

        packingList.CompleteSeparation();
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return (await GetByIdAsync(id, cancellationToken))!;
    }

    public async Task<PackingListDto> StartConferenceAsync(int id, int userId, CancellationToken cancellationToken = default)
    {
        var packingList = await _unitOfWork.PackingLists.GetByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException($"Packing list with id '{id}' not found");

        packingList.StartConference(userId);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return (await GetByIdAsync(id, cancellationToken))!;
    }

    public async Task<PackingListDto> ConferenceItemAsync(int packingListId, ConferenceItemDto dto, CancellationToken cancellationToken = default)
    {
        var packingList = await _unitOfWork.PackingLists.GetWithItemsAsync(packingListId, cancellationToken)
            ?? throw new InvalidOperationException($"Packing list with id '{packingListId}' not found");

        var item = packingList.Items.FirstOrDefault(i => i.Id == dto.ItemId)
            ?? throw new InvalidOperationException($"Item with id '{dto.ItemId}' not found in packing list");

        item.Conference(dto.Batch, dto.ActualQuantity);

        if (!string.IsNullOrWhiteSpace(dto.Notes))
            item.SetNotes(dto.Notes);

        packingList.RecalculateTotals();
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return (await GetByIdAsync(packingListId, cancellationToken))!;
    }

    public async Task<PackingListDto> CompleteConferenceAsync(int id, CancellationToken cancellationToken = default)
    {
        var packingList = await _unitOfWork.PackingLists.GetWithItemsAsync(id, cancellationToken)
            ?? throw new InvalidOperationException($"Packing list with id '{id}' not found");

        packingList.CompleteConference();
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return (await GetByIdAsync(id, cancellationToken))!;
    }

   public async Task<PackingListDto> InvoiceAsync(int id, InvoicePackingListDto dto, int userId, CancellationToken cancellationToken = default)
{
    var packingList = await _unitOfWork.PackingLists.GetWithItemsAsync(id, cancellationToken)
        ?? throw new InvalidOperationException($"Packing list with id '{id}' not found");

    packingList.Invoice(userId, dto.InvoiceNumber);

    // Reduzir PendingQuantity nos BillingRequestItems — busca cada item diretamente pelo ID
    foreach (var plItem in packingList.Items)
    {
        if (!plItem.BillingRequestItemId.HasValue) continue;

        var brItem = await _unitOfWork.BillingRequests.GetItemByIdAsync(
            plItem.BillingRequestItemId.Value, cancellationToken);

        if (brItem == null) continue;

        var qtyToProcess = Math.Min(plItem.Quantity, brItem.PendingQuantity);
        if (qtyToProcess > 0)
            brItem.ProcessQuantity(qtyToProcess);
    }

    await _unitOfWork.SaveChangesAsync(cancellationToken);
    return (await GetByIdAsync(id, cancellationToken))!;
}


    public async Task<PackingListDto> DispatchAsync(int id, DispatchPackingListDto dto, CancellationToken cancellationToken = default)
    {
        var packingList = await _unitOfWork.PackingLists.GetByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException($"Packing list with id '{id}' not found");

        packingList.Dispatch(dto.DriverName);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return (await GetByIdAsync(id, cancellationToken))!;
    }

    public async Task<PackingListDto> DeliverAsync(int id, DeliverPackingListDto dto, string signaturesFolder, CancellationToken cancellationToken = default)
{
    var packingList = await _unitOfWork.PackingLists.GetByIdAsync(id, cancellationToken)
        ?? throw new InvalidOperationException($"Packing list with id '{id}' not found");

    string? signaturePath = null;

    if (!string.IsNullOrWhiteSpace(dto.SignatureBase64))
    {
        Directory.CreateDirectory(signaturesFolder);
        var fileName = $"{id}_{DateTime.UtcNow:yyyyMMddHHmmss}.png";
        var fullPath = Path.Combine(signaturesFolder, fileName);
        var imageBytes = Convert.FromBase64String(dto.SignatureBase64);
        await File.WriteAllBytesAsync(fullPath, imageBytes, cancellationToken);
        signaturePath = $"deliveries/signatures/{fileName}";
    }

    packingList.Deliver(dto.DriverName, signaturePath, dto.Latitude, dto.Longitude);
    await _unitOfWork.SaveChangesAsync(cancellationToken);
    return (await GetByIdAsync(id, cancellationToken))!;
}
public async Task AttachInvoicePdfAsync(int id, string relativePath, CancellationToken cancellationToken = default)
{
    var packingList = await _unitOfWork.PackingLists.GetByIdAsync(id, cancellationToken)
        ?? throw new InvalidOperationException("Romaneio não encontrado");
    packingList.AttachInvoicePdf(relativePath);
    await _unitOfWork.SaveChangesAsync(cancellationToken);
}

public async Task SetCanhotoAsync(int id, string canhotoPath, CancellationToken cancellationToken = default)
{
    var packingList = await _unitOfWork.PackingLists.GetByIdAsync(id, cancellationToken)
        ?? throw new InvalidOperationException("Romaneio não encontrado");
    packingList.SetCanhoto(canhotoPath);
    await _unitOfWork.SaveChangesAsync(cancellationToken);
}


    public async Task<bool> CancelAsync(int id, CancellationToken cancellationToken = default)
    {
        var packingList = await _unitOfWork.PackingLists.GetByIdAsync(id, cancellationToken);
        if (packingList is null) return false;

        packingList.Cancel();
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IEnumerable<NfPdfDto>> GetNfPdfsAsync(int id, CancellationToken ct = default)
    {
        var nfPdfs = await _unitOfWork.PackingLists.GetNfPdfsAsync(id, ct);
        return nfPdfs.Select(MapNfPdfToDto);
    }

    public async Task<NfPdfDto> AttachNfPdfAsync(int id, string nfNumber, string pdfPath, CancellationToken ct = default)
    {
        _ = await _unitOfWork.PackingLists.GetByIdAsync(id, ct)
            ?? throw new InvalidOperationException("Romaneio não encontrado");

        var nfPdf = new PackingListNfPdf(id, nfNumber, pdfPath);
        await _unitOfWork.PackingLists.AddNfPdfAsync(nfPdf, ct);
        await _unitOfWork.SaveChangesAsync(ct);
        return MapNfPdfToDto(nfPdf);
    }

    public async Task SetNfPdfCanhotoAsync(int nfPdfId, string canhotoPath, CancellationToken ct = default)
    {
        var nfPdf = await _unitOfWork.PackingLists.GetNfPdfByIdAsync(nfPdfId, ct)
            ?? throw new InvalidOperationException("PDF de NF não encontrado");

        nfPdf.SetCanhoto(canhotoPath);
        await _unitOfWork.SaveChangesAsync(ct);
    }

 private static PackingListDto MapToDto(PackingList pl) => new(
    pl.Id,
    pl.Code,
    pl.CustomerId,
    pl.Customer?.Code ?? "",
    pl.Customer?.Name ?? "",
    pl.Status,
    GetStatusName(pl.Status),
    pl.RequestedAt,
    pl.SeparatedAt,
    pl.ConferencedAt,
    pl.InvoicedAt,
    pl.DeliveredAt,
    pl.CreatedBy?.Name,
    pl.SeparatedBy?.Name,
    pl.ConferencedBy?.Name,
    pl.InvoicedBy?.Name,
    pl.DriverName,
    pl.DeliverySignaturePath,
    pl.DeliveryLatitude,
    pl.DeliveryLongitude,
    pl.InvoicePdfPath != null,   // HasInvoicePdf
    pl.CanhotoPath,              // CanhotoPath
    pl.TotalVolumes,
    pl.TotalWeight,
    pl.TotalValue,
    pl.TotalItems,
    pl.InvoiceNumber,
    pl.InvoiceDate,
    pl.Notes,
    pl.Items.Select(MapItemToDto).ToList(),
    pl.NfPdfs.Select(MapNfPdfToDto).ToList()
);

private static PackingListSummaryDto MapToSummaryDto(PackingList pl) => new(
    pl.Id,
    pl.Code,
    pl.CustomerId,
    pl.Customer?.Code ?? "",
    pl.Customer?.Name ?? "",
    pl.Status,
    GetStatusName(pl.Status),
    pl.RequestedAt,
    pl.TotalItems,
    pl.TotalValue,
    pl.InvoiceNumber,
    pl.SeparatedBy?.Name,
    pl.DeliveredAt,
    pl.DriverName,
    pl.InvoicePdfPath != null,   // HasInvoicePdf
    pl.CanhotoPath != null       // HasCanhoto
);



    private static NfPdfDto MapNfPdfToDto(PackingListNfPdf n) => new(
        n.Id,
        n.NfNumber,
        !string.IsNullOrEmpty(n.PdfPath),
        !string.IsNullOrEmpty(n.CanhotoPath),
        n.UploadedAt
    );

    private static PackingListItemDto MapItemToDto(PackingListItem item) => new(
        item.Id,
        item.ProductId,
        item.Reference,
        item.Description,
        item.Edi,
        item.Quantity,
        item.UnitsPerBox,
        item.Volumes,
        item.Batch,
        item.UnitPrice,
        item.TotalValue,
        item.UnitWeight,
        item.TotalWeight,
        item.IsConferenced,
        item.ConferencedAt,
        item.Notes,
        item.IsLabelPrinted,
        item.LabelPrintedAt
    );

    private static PendingLabelItemDto MapToPendingLabelDto(PackingListItem item) => new(
        item.Id,
        item.PackingListId,
        item.PackingList?.Code ?? "",
        item.PackingList?.CustomerId ?? 0,
        item.PackingList?.Customer?.Name ?? "",
        item.PackingList?.Customer?.Address,
        item.PackingList?.Customer?.City,
        item.PackingList?.Customer?.State,
        item.Reference,
        item.Description,
        item.Quantity,
        item.Batch,
        item.PackingList?.ConferencedBy?.Name ?? "",
        item.PackingList?.ConferencedBy?.EmployeeId
    );

    public async Task<IEnumerable<PendingLabelItemDto>> GetPendingLabelsAsync(int conferencedById, CancellationToken cancellationToken = default)
    {
        var items = await _unitOfWork.PackingLists.GetPendingLabelItemsAsync(conferencedById, cancellationToken);
        return items.Select(MapToPendingLabelDto);
    }

    public async Task MarkLabelPrintedAsync(int itemId, CancellationToken cancellationToken = default)
    {
        var item = await _unitOfWork.PackingLists.GetItemByIdAsync(itemId, cancellationToken)
            ?? throw new InvalidOperationException($"Item with id '{itemId}' not found");

        item.MarkLabelPrinted();
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static string GetStatusName(PackingListStatus status) => status switch
    {
        PackingListStatus.Pending => "Pendente",
        PackingListStatus.InSeparation => "Em Separação",
        PackingListStatus.AwaitingConference => "Aguardando Conferência",
        PackingListStatus.InConference => "Em Conferência",
        PackingListStatus.AwaitingInvoicing => "Aguardando Faturamento",
        PackingListStatus.Invoiced => "Faturado",
        PackingListStatus.Cancelled => "Cancelado",
        PackingListStatus.Dispatched => "Despachado",
        PackingListStatus.Delivered => "Entregue",
        _ => status.ToString()
    };
}
