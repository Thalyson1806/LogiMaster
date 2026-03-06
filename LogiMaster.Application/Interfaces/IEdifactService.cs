using LogiMaster.Application.DTOs;
using LogiMaster.Domain.Enums;

namespace LogiMaster.Application.Interfaces;

public interface IEdifactService
{
    // Files
    Task<IEnumerable<EdifactFileSummaryDto>> GetAllFilesAsync(CancellationToken ct = default);
    Task<IEnumerable<EdifactFileSummaryDto>> GetFilesByCustomerAsync(int customerId, CancellationToken ct = default);
    Task<EdifactFileDetailDto?> GetFileByIdAsync(int id, CancellationToken ct = default);
    Task<EdifactFileDto> UploadFileAsync(Stream fileStream, string fileName, int customerId, EdifactMessageType messageType, CancellationToken ct = default);
    
    // Processing
    Task<EdifactProcessingResultDto> ProcessFileAsync(int fileId, CancellationToken ct = default);
    Task ProcessPendingFilesAsync(CancellationToken ct = default);
    
    // Items
    Task<IEnumerable<EdifactItemDto>> GetItemsByDateRangeAsync(DateTime start, DateTime end, CancellationToken ct = default);
   
    /// <summary>
    /// Converte os itens de um arquivo EDI processado em BillingRequest automaticamente.
    /// </summary>
    Task<EdifactBillingResultDto> CreateBillingRequestFromFileAsync(int fileId, CancellationToken ct = default);

    /// <summary>
    /// Detecta o cliente pelo código do emitente (EmitterCode) contido no header do arquivo EDI.
    /// </summary>
    Task<EdifactDetectedCustomerDto?> DetectCustomerFromFileAsync(Stream fileStream, EdifactMessageType messageType, CancellationToken ct = default);


}
