using LogiMaster.Application.DTOs;
using LogiMaster.Domain.Entities;

namespace LogiMaster.Application.Interfaces;

public interface IBillingRequestService
{
    Task<BillingRequestDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<BillingRequestDto>> GetByDeliveryDateAsync(DateTime deliveryDate, CancellationToken cancellationToken = default);
    Task<IEnumerable<BillingRequestSummaryDto>> GetAllAsync(CancellationToken cancellationToken = default);
    
    Task<IEnumerable<CustomerPendingSummaryDto>> GetPendingSummaryByCustomerAsync(
        int? billingRequestId = null, 
        DateTime? startDate = null, 
        DateTime? endDate = null,
        CancellationToken cancellationToken = default);
    
    Task<IEnumerable<BillingRequestItemDto>> GetPendingItemsByCustomerAsync(int customerId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Exclui uma solicitação de faturamento e todos os seus itens
    /// </summary>
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Pré-valida um arquivo antes de importar - identifica produtos e clientes não cadastrados
    /// </summary>
    Task<PreValidateImportResultDto> PreValidateImportAsync(Stream fileStream, string fileName, CancellationToken cancellationToken = default);

    /// <summary>
    /// Importa o arquivo após confirmação do usuário, criando produtos/clientes conforme solicitado
    /// </summary>
    Task<ImportBillingRequestResultDto> ImportWithConfirmationAsync(
        Stream fileStream, 
        string fileName, 
        List<ProductToCreateDto> productsToCreate,
        List<CustomerToCreateDto> customersToCreate,
        int? userId, 
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Imports a file (TXT, PDF or Excel) and creates a new billing request with items
    /// Cria automaticamente produtos e clientes não cadastrados
    /// </summary>
    Task<ImportBillingRequestResultDto> ImportFromTxtAsync(Stream fileStream, string fileName, int? userId, CancellationToken cancellationToken = default);
}
