using LogiMaster.Application.DTOs;
using LogiMaster.Domain.Enums;

namespace LogiMaster.Application.Interfaces;

public interface IPackingListService
{
    Task<PackingListDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<PackingListDto?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);
    Task<IEnumerable<PackingListSummaryDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<PackingListSummaryDto>> GetByStatusAsync(PackingListStatus status, CancellationToken cancellationToken = default);
    Task<IEnumerable<PackingListSummaryDto>> GetByCustomerAsync(int customerId, CancellationToken cancellationToken = default);
    Task<IEnumerable<PackingListSummaryDto>> GetPendingForShippingAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<PackingListSummaryDto>> GetPendingForInvoicingAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<PackingListSummaryDto>> GetForDeliveryAsync(CancellationToken cancellationToken = default);
    Task<DashboardSummaryDto> GetDashboardSummaryAsync(CancellationToken cancellationToken = default);

    Task<PackingListDto> CreateAsync(CreatePackingListDto dto, int userId, CancellationToken cancellationToken = default);
    Task<PackingListDto> StartSeparationAsync(int id, int userId, CancellationToken cancellationToken = default);
    Task<PackingListDto> CompleteSeparationAsync(int id, CancellationToken cancellationToken = default);
    Task<PackingListDto> StartConferenceAsync(int id, int userId, CancellationToken cancellationToken = default);
    Task<PackingListDto> ConferenceItemAsync(int packingListId, ConferenceItemDto dto, CancellationToken cancellationToken = default);
    Task<PackingListDto> CompleteConferenceAsync(int id, CancellationToken cancellationToken = default);
    Task<PackingListDto> InvoiceAsync(int id, InvoicePackingListDto dto, int userId, CancellationToken cancellationToken = default);
    Task<PackingListDto> DispatchAsync(int id, DispatchPackingListDto dto, CancellationToken cancellationToken = default);
    Task<PackingListDto> DeliverAsync(int id, DeliverPackingListDto dto, string signaturesFolder, CancellationToken cancellationToken = default);
    Task AttachInvoicePdfAsync(int id, string relativePath, CancellationToken cancellationToken = default);
    Task SetCanhotoAsync(int id, string canhotoPath, CancellationToken cancellationToken = default);
    Task<bool> CancelAsync(int id, CancellationToken cancellationToken = default);

    Task<IEnumerable<NfPdfDto>> GetNfPdfsAsync(int id, CancellationToken ct = default);
    Task<NfPdfDto> AttachNfPdfAsync(int id, string nfNumber, string pdfPath, CancellationToken ct = default);
    Task SetNfPdfCanhotoAsync(int nfPdfId, string canhotoPath, CancellationToken ct = default);

    Task<IEnumerable<PendingLabelItemDto>> GetPendingLabelsAsync(int conferencedById, CancellationToken cancellationToken = default);
    Task MarkLabelPrintedAsync(int itemId, CancellationToken cancellationToken = default);
}
