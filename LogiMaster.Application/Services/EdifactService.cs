using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Enums;
using LogiMaster.Domain.Interfaces;
using Microsoft.Extensions.Logging;

namespace LogiMaster.Application.Services;

public class EdifactService : IEdifactService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IEnumerable<IEdifactParser> _parsers;
    private readonly ILogger<EdifactService> _logger;

    public EdifactService(
        IUnitOfWork unitOfWork,
        IEnumerable<IEdifactParser> parsers,
        ILogger<EdifactService> logger)
    {
        _unitOfWork = unitOfWork;
        _parsers = parsers;
        _logger = logger;
    }

    public async Task<IEnumerable<EdifactFileSummaryDto>> GetAllFilesAsync(CancellationToken ct = default)
    {
        var files = await _unitOfWork.EdifactFiles.GetAllAsync(ct);
        return files.Select(MapToSummary);
    }

    public async Task<IEnumerable<EdifactFileSummaryDto>> GetFilesByCustomerAsync(int customerId, CancellationToken ct = default)
    {
        var files = await _unitOfWork.EdifactFiles.GetByCustomerIdAsync(customerId, ct);
        return files.Select(MapToSummary);
    }

    public async Task<EdifactFileDetailDto?> GetFileByIdAsync(int id, CancellationToken ct = default)
    {
        var file = await _unitOfWork.EdifactFiles.GetByIdWithItemsAsync(id, ct);
        if (file == null) return null;

        return new EdifactFileDetailDto(
            file.Id,
            file.CustomerId,
            file.Customer?.Name ?? "N/A",
            file.FileName,
            file.OriginalFileName,
            file.MessageType,
            file.MessageType.ToString(),
            file.Status,
            file.Status.ToString(),
            file.ReceivedAt,
            file.ProcessedAt,
            file.ErrorMessage,
            file.TotalSegments,
            file.TotalItemsProcessed,
            file.TotalItemsWithError,
            file.Items.Select(MapItemToDto).ToList()
        );
    }

    public async Task<EdifactFileDto> UploadFileAsync(
        Stream fileStream,
        string fileName,
        int customerId,
        EdifactMessageType messageType,
        CancellationToken ct = default)
    {
        using var reader = new StreamReader(fileStream);
        var content = await reader.ReadToEndAsync(ct);

        var storedFileName = $"{DateTime.UtcNow:yyyyMMdd_HHmmss}_{fileName}";
        var edifactFile = new EdifactFile(customerId, storedFileName, fileName, messageType);
        edifactFile.SetRawContent(content);

        await _unitOfWork.EdifactFiles.AddAsync(edifactFile, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        _logger.LogInformation("Arquivo EDIFACT {FileName} recebido. ID: {Id}", fileName, edifactFile.Id);

        return new EdifactFileDto(
            edifactFile.Id,
            edifactFile.CustomerId,
            edifactFile.Customer?.Name ?? "N/A",
            edifactFile.FileName,
            edifactFile.OriginalFileName,
            edifactFile.MessageType,
            edifactFile.MessageType.ToString(),
            edifactFile.Status,
            edifactFile.Status.ToString(),
            edifactFile.ReceivedAt,
            edifactFile.ProcessedAt,
            edifactFile.ErrorMessage,
            edifactFile.TotalSegments,
            edifactFile.TotalItemsProcessed,
            edifactFile.TotalItemsWithError,
            edifactFile.IsActive,
            edifactFile.CreatedAt
        );
    }

    public async Task<EdifactProcessingResultDto> ProcessFileAsync(int fileId, CancellationToken ct = default)
    {
        var errors = new List<string>();
        var warnings = new List<string>();

        var file = await _unitOfWork.EdifactFiles.GetByIdAsync(fileId, ct);
        if (file == null)
        {
            errors.Add("Arquivo nao encontrado");
            return new EdifactProcessingResultDto(fileId, false, 0, 0, errors, warnings);
        }

        if (file.Status != EdifactFileStatus.Pending)
        {
            errors.Add($"Arquivo ja processado. Status: {file.Status}");
            return new EdifactProcessingResultDto(fileId, false, 0, 0, errors, warnings);
        }

        file.StartProcessing();
        await _unitOfWork.SaveChangesAsync(ct);

        try
        {
            var parser = _parsers.FirstOrDefault(p => p.MessageType == file.MessageType);
            if (parser == null)
            {
                file.SetError($"Parser nao encontrado para tipo: {file.MessageType}");
                await _unitOfWork.SaveChangesAsync(ct);
                errors.Add($"Parser nao suportado: {file.MessageType}");
                return new EdifactProcessingResultDto(fileId, false, 0, 0, errors, warnings);
            }

            var parseResult = parser.Parse(file.RawContent ?? string.Empty);
            if (!parseResult.Success)
            {
                file.SetError(parseResult.ErrorMessage ?? "Erro de parsing");
                await _unitOfWork.SaveChangesAsync(ct);
                errors.Add(parseResult.ErrorMessage ?? "Erro de parsing");
                return new EdifactProcessingResultDto(fileId, false, 0, 0, errors, warnings);
            }

            var parsedItems = parseResult.Items;
            var processed = 0;
            var errorCount = 0;

            foreach (var parsedItem in parsedItems)
            {
                try
                {
                    var product = await FindProductAsync(parsedItem, file.CustomerId, ct);

                    var edifactItem = new EdifactItem(
                        file.Id,
                        parsedItem.ItemCode,
                        parsedItem.Quantity,
                        parsedItem.LineNumber
                    );

                    edifactItem.SetProductInfo(
                        parsedItem.BuyerItemCode,
                        parsedItem.SupplierItemCode,
                        parsedItem.Description,
                        parsedItem.UnitOfMeasure
                    );

                    edifactItem.SetDeliveryInfo(
                        parsedItem.DeliveryStart,
                        parsedItem.DeliveryEnd,
                        parsedItem.DeliveryLocation,
                        parsedItem.DocumentNumber
                    );

                    if (product != null)
                    {
                        edifactItem.LinkToProduct(product.Id);
                    }
                    else
                    {
                        warnings.Add($"Produto nao encontrado: {parsedItem.ItemCode}");
                    }

                    await _unitOfWork.EdifactItems.AddAsync(edifactItem, ct);
                    processed++;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Erro ao processar item {ItemCode}", parsedItem.ItemCode);
                    errors.Add($"Erro no item {parsedItem.ItemCode}: {ex.Message}");
                    errorCount++;
                }
            }

            file.CompleteProcessing(processed, errorCount);
            // Salva status Completed + todos os EdifactItems adicionados
            await _unitOfWork.SaveChangesAsync(ct);

            // Gerar BillingRequest automaticamente a partir dos itens processados
            if (processed > 0)
            {
                var billingResult = await CreateBillingRequestFromFileAsync(fileId, ct);
                if (billingResult.Success && billingResult.ItemsCreated > 0)
                    _logger.LogInformation("BillingRequest {Code} criado com {Count} itens do EDI {Id}",
                        billingResult.BillingRequestCode, billingResult.ItemsCreated, fileId);
                else if (!billingResult.Success)
                    _logger.LogWarning("Falha ao criar BillingRequest do EDI {Id}: {Error}", fileId, billingResult.ErrorMessage);
            }

            _logger.LogInformation(
                "Arquivo {Id} processado. Total: {Total}, OK: {Processed}, Erros: {Errors}",
                fileId, parsedItems.Count, processed, errorCount);

            return new EdifactProcessingResultDto(
                fileId,
                errorCount == 0,
                processed,
                errorCount,
                errors,
                warnings
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao processar arquivo {Id}", fileId);
            file.SetError(ex.Message);
            await _unitOfWork.SaveChangesAsync(ct);
            errors.Add(ex.Message);
            return new EdifactProcessingResultDto(fileId, false, 0, 0, errors, warnings);
        }
    }

    public async Task ProcessPendingFilesAsync(CancellationToken ct = default)
    {
        var pendingFiles = await _unitOfWork.EdifactFiles.GetPendingFilesAsync(10, ct);

        foreach (var file in pendingFiles)
        {
            if (ct.IsCancellationRequested) break;

            _logger.LogInformation("Processando arquivo pendente: {Id} - {FileName}", file.Id, file.FileName);
            await ProcessFileAsync(file.Id, ct);
        }
    }

    public async Task<IEnumerable<EdifactItemDto>> GetItemsByDateRangeAsync(
        DateTime start,
        DateTime end,
        CancellationToken ct = default)
    {
        var items = await _unitOfWork.EdifactItems.GetByDateRangeAsync(start, end, ct);
        return items.Select(MapItemToDto);
    }

    public async Task<EdifactDetectedCustomerDto?> DetectCustomerFromFileAsync(Stream fileStream, EdifactMessageType messageType, CancellationToken ct = default)
    {
        using var reader = new StreamReader(fileStream);
        var content = await reader.ReadToEndAsync(ct);

        var parser = _parsers.FirstOrDefault(p => p.MessageType == messageType);
        if (parser == null) return null;

        var result = parser.Parse(content);
        if (!result.Success) return null;

        // Tenta match nos campos do header em ordem de prioridade
        var candidates = new[]
        {
            ("BuyerCode",   result.Header.GetValueOrDefault("BuyerCode")),
            ("Sender",      result.Header.GetValueOrDefault("Sender")),
            ("SenderName",  result.Header.GetValueOrDefault("SenderName")),
        };

        foreach (var (field, code) in candidates)
        {
            if (string.IsNullOrWhiteSpace(code)) continue;

            var customer = await _unitOfWork.Customers.FindByEmitterCodeAsync(code, ct);
            if (customer != null)
            {
                return new EdifactDetectedCustomerDto(
                    customer.Id, customer.Code, customer.Name, customer.EmitterCode, field);
            }
        }

        return null;
    }

    private async Task<Product?> FindProductAsync(ParsedEdifactItem parsedItem, int customerId, CancellationToken ct)
    {
        // Tenta encontrar por SupplierItemCode (nosso codigo interno)
        if (!string.IsNullOrEmpty(parsedItem.SupplierItemCode))
        {
            var product = await _unitOfWork.Products.GetByReferenceAsync(parsedItem.SupplierItemCode, ct);
            if (product != null) return product;
        }

        // Tenta encontrar por BuyerItemCode (código do cliente)
        if (!string.IsNullOrEmpty(parsedItem.BuyerItemCode))
        {
            var product = await _unitOfWork.Products.GetByReferenceAsync(parsedItem.BuyerItemCode, ct);
            if (product != null) return product;

            // Tenta pelo vínculo CustomerProduct filtrado pelo cliente do arquivo
            var cp = await _unitOfWork.CustomerProducts.FindByCustomerCodeAsync(parsedItem.BuyerItemCode, customerId, ct);
            if (cp?.Product != null) return cp.Product;
        }

        // Tenta encontrar por ItemCode generico
        if (!string.IsNullOrEmpty(parsedItem.ItemCode))
        {
            var product = await _unitOfWork.Products.GetByReferenceAsync(parsedItem.ItemCode, ct);
            if (product != null) return product;

            // Tenta pelo vínculo CustomerProduct filtrado pelo cliente do arquivo
            var cp = await _unitOfWork.CustomerProducts.FindByCustomerCodeAsync(parsedItem.ItemCode, customerId, ct);
            if (cp?.Product != null) return cp.Product;
        }

        return null;
    }

    private static EdifactFileSummaryDto MapToSummary(EdifactFile file)
    {
        return new EdifactFileSummaryDto(
            file.Id,
            file.Customer?.Name ?? "N/A",
            file.OriginalFileName,
            file.MessageType.ToString(),
            file.Status.ToString(),
            file.ReceivedAt,
            file.TotalItemsProcessed,
            file.TotalItemsWithError
        );
    }

    private static EdifactItemDto MapItemToDto(EdifactItem item)
    {
        return new EdifactItemDto(
            item.Id,
            item.EdifactFileId,
            item.ProductId,
            item.Product?.Reference,
            item.ItemCode,
            item.BuyerItemCode,
            item.SupplierItemCode,
            item.Description,
            item.Quantity,
            item.UnitOfMeasure,
            item.DeliveryStart,
            item.DeliveryEnd,
            item.DeliveryLocation,
            item.DocumentNumber,
            item.LineNumber,
            item.IsProcessed,
            item.ErrorMessage
        );
    }
    public async Task<EdifactBillingResultDto> CreateBillingRequestFromFileAsync(int fileId, CancellationToken ct = default)
{
    var file = await _unitOfWork.EdifactFiles.GetByIdWithItemsAsync(fileId, ct);
    if (file == null)
        return new EdifactBillingResultDto(false, null, null, 0, 0, "Arquivo não encontrado");

    var unlinkedItems = file.Items
        .Where(i => i.ProductId.HasValue && i.BillingRequestItemId == null)
        .ToList();

    if (!unlinkedItems.Any())
        return new EdifactBillingResultDto(true, null, null, 0, file.Items.Count,
            "Nenhum item com produto vinculado disponível");

    try
    {
        // Pré-carregar preços dos produtos cadastrados
        var productIds = unlinkedItems
            .Where(i => i.ProductId.HasValue)
            .Select(i => i.ProductId!.Value)
            .Distinct()
            .ToList();

        var productPrices = new Dictionary<int, decimal>();
        foreach (var pid in productIds)
        {
            var prod = await _unitOfWork.Products.GetByIdWithPackagingAsync(pid, ct);
            if (prod != null)
                productPrices[pid] = prod.UnitPrice ?? 0m;
        }

        var billingRequest = new BillingRequest(file.OriginalFileName, null);
        await _unitOfWork.BillingRequests.AddAsync(billingRequest, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        var created = 0;
        var skipped = 0;
        var pairs = new List<(EdifactItem EdiItem, BillingRequestItem BrItem)>();

        foreach (var ediItem in unlinkedItems)
        {
            if (!ediItem.ProductId.HasValue)
            {
                skipped++;
                continue;
            }

            var unitPrice = productPrices.GetValueOrDefault(ediItem.ProductId.Value, 0m);

            var brItem = new BillingRequestItem(
                billingRequest.Id,
                customerCode: null,
                customerName: null,
                productReference: ediItem.ItemCode,
                productDescription: ediItem.Description,
                quantity: (int)Math.Round(ediItem.Quantity),
                unitPrice: unitPrice,
                isCustomerTotal: false,
                deliveryDate: ediItem.DeliveryStart,
                expectedDeliveryDate: ediItem.DeliveryStart
            );

            brItem.LinkCustomer(file.CustomerId);
            brItem.LinkProduct(ediItem.ProductId.Value);

            billingRequest.AddItem(brItem);
            pairs.Add((ediItem, brItem));
            created++;
        }

        await _unitOfWork.SaveChangesAsync(ct);

        foreach (var (ediItem, brItem) in pairs)
            ediItem.LinkToBillingRequest(brItem.Id);

        await _unitOfWork.SaveChangesAsync(ct);

        _logger.LogInformation("BillingRequest {Code} criado do EDI {FileId}: {Created} itens, {Skipped} sem produto",
            billingRequest.Code, fileId, created, skipped);

        return new EdifactBillingResultDto(true, billingRequest.Id, billingRequest.Code, created, skipped, null);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Erro ao criar BillingRequest do EDI {FileId}", fileId);
        return new EdifactBillingResultDto(false, null, null, 0, 0, ex.Message);
    }
}

}
