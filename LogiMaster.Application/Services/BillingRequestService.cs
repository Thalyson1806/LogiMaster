using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Interfaces;
using LogiMaster.Domain.Enums;

namespace LogiMaster.Application.Services;

public class BillingRequestService : IBillingRequestService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IEnumerable<IFileParserService> _fileParsers;

    public BillingRequestService(IUnitOfWork unitOfWork, IEnumerable<IFileParserService> fileParsers)
    {
        _unitOfWork = unitOfWork;
        _fileParsers = fileParsers;
    }

    public async Task<BillingRequestDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var request = await _unitOfWork.BillingRequests.GetWithItemsAsync(id, cancellationToken);
        return request is null ? null : MapToDto(request);
    }

    public async Task<IEnumerable<BillingRequestSummaryDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var requests = await _unitOfWork.BillingRequests.GetAllAsync(cancellationToken);
        return requests.Select(r => new BillingRequestSummaryDto(
            r.Id,
            r.Code,
            r.ImportedAt,
            r.FileName,
            r.TotalItems,
            r.TotalCustomers,
            r.TotalValue,
            r.IsProcessed
        ));
    }
public async Task<IEnumerable<CustomerPendingSummaryDto>> GetPendingSummaryByCustomerAsync(
    int? billingRequestId = null, 
    DateTime? startDate = null, 
    DateTime? endDate = null,
    CancellationToken cancellationToken = default)
{
    var summaries = await _unitOfWork.BillingRequests.GetPendingSummaryByCustomerAsync(
        billingRequestId, startDate, endDate, cancellationToken);
    return summaries.Select(s => new CustomerPendingSummaryDto(
        s.CustomerId,
        s.CustomerCode,
        s.CustomerName,
        s.TotalItems,
        s.TotalPendingQuantity,
        s.TotalPendingValue
    ));
}

    public async Task<IEnumerable<BillingRequestItemDto>> GetPendingItemsByCustomerAsync(
        int customerId, CancellationToken cancellationToken = default)
    {
        var items = await _unitOfWork.BillingRequests.GetPendingItemsByCustomerAsync(customerId, cancellationToken);
        return items.Select(MapItemToDto);
    }

    public async Task<PreValidateImportResultDto> PreValidateImportAsync(
        Stream fileStream, string fileName, CancellationToken cancellationToken = default)
    {
        var warnings = new List<string>();

        // Verificar se já existe pedido com este nome (será substituído)
        var existingRequest = await _unitOfWork.BillingRequests
            .FirstOrDefaultAsync(b => b.FileName == fileName && b.IsActive, cancellationToken);
        if (existingRequest != null)
        {
            warnings.Add($"Pedido existente '{existingRequest.Code}' será substituído ao importar");
        }

        // Encontrar parser apropriado
        var parser = _fileParsers.FirstOrDefault(p => p.CanHandle(fileName));
        if (parser == null)
        {
            return new PreValidateImportResultDto(
                false,
                $"Tipo de arquivo não suportado: {Path.GetExtension(fileName)}. Use .txt ou .pdf",
                0, 0, 0,
                new List<UnregisteredProductDto>(),
                new List<UnregisteredCustomerDto>(),
                new List<string>()
            );
        }

         // Parse the file
        var parseResult = await parser.ParseAsync(fileStream, fileName, cancellationToken);

        if (!parseResult.Success)
        {
            return new PreValidateImportResultDto(
                false,
                parseResult.ErrorMessage,
                0, 0, 0,
                new List<UnregisteredProductDto>(),
                new List<UnregisteredCustomerDto>(),
                parseResult.Warnings
            );
        }

        warnings.AddRange(parseResult.Warnings);

        // Coletar produtos e clientes únicos do arquivo
        var productRefs = parseResult.Items
            .Where(i => !i.IsCustomerTotal && !string.IsNullOrWhiteSpace(i.ProductReference))
            .GroupBy(i => i.ProductReference!.ToUpper())
            .Select(g => new { 
                Reference = g.Key, 
                Description = g.First().ProductDescription,
                Count = g.Count() 
            })
            .ToList();

        var customerCodes = parseResult.Items
            .Where(i => !i.IsCustomerTotal && !string.IsNullOrWhiteSpace(i.CustomerCode))
            .GroupBy(i => i.CustomerCode!.ToUpper())
            .Select(g => new { 
                Code = g.Key, 
                Name = g.First().CustomerName,
                Count = g.Count() 
            })
            .ToList();

        // Verificar quais produtos não estão cadastrados
        var unregisteredProducts = new List<UnregisteredProductDto>();
        foreach (var prod in productRefs)
        {
            var exists = await _unitOfWork.Products.ReferenceExistsAsync(prod.Reference, cancellationToken: cancellationToken);
            if (!exists)
            {
                unregisteredProducts.Add(new UnregisteredProductDto(
                    prod.Reference,
                    prod.Description,
                    prod.Count,
                    true // Por padrão, sugere criar
                ));
            }
        }

        // Verificar quais clientes não estão cadastrados
        var unregisteredCustomers = new List<UnregisteredCustomerDto>();
        foreach (var cust in customerCodes)
        {
            var customer = await _unitOfWork.Customers.GetByCodeAsync(cust.Code, cancellationToken);
            if (customer == null)
            {
                unregisteredCustomers.Add(new UnregisteredCustomerDto(
                    cust.Code,
                    cust.Name,
                    cust.Count,
                    true // Por padrão, sugere criar
                ));
            }
        }

        return new PreValidateImportResultDto(
            true,
            null,
            parseResult.Items.Count,
            productRefs.Count,
            customerCodes.Count,
            unregisteredProducts,
            unregisteredCustomers,
            warnings
        );
    }

    public async Task<ImportBillingRequestResultDto> ImportWithConfirmationAsync(
        Stream fileStream,
        string fileName,
        List<ProductToCreateDto> productsToCreate,
        List<CustomerToCreateDto> customersToCreate,
        int? userId,
        CancellationToken cancellationToken = default)
    {
        var warnings = new List<string>();
        var newCustomersCreated = 0;
        var newProductsCreated = 0;

        // Encontrar parser apropriado
        var parser = _fileParsers.FirstOrDefault(p => p.CanHandle(fileName));
        if (parser == null)
        {
            return new ImportBillingRequestResultDto(
                false,
                $"Tipo de arquivo não suportado: {Path.GetExtension(fileName)}",
                0, 0, 0, 0, 0,
                new List<string>()
            );
        }

        // Parse the file
        var parseResult = await parser.ParseAsync(fileStream, fileName, cancellationToken);

        if (!parseResult.Success)
        {
            return new ImportBillingRequestResultDto(
                false,
                parseResult.ErrorMessage,
                0, 0, 0, 0, 0,
                parseResult.Warnings
            );
        }

        warnings.AddRange(parseResult.Warnings);

        await _unitOfWork.BeginTransactionAsync(cancellationToken);

        try
        {
            // SOBRESCREVER: Excluir TODOS os pedidos e items anteriores
            await _unitOfWork.BillingRequests.DeleteAllAsync(cancellationToken);
            warnings.Add("Pedidos anteriores excluídos");

            // 1. Criar os produtos que o usuário confirmou
            var productsDict = new Dictionary<string, Product>();
            foreach (var prodToCreate in productsToCreate)
            {
                var product = new Product(prodToCreate.Reference, prodToCreate.Description);
                if (prodToCreate.DefaultPackagingId.HasValue)
                {
                    product.SetDefaultPackaging(prodToCreate.DefaultPackagingId.Value);
                }
                await _unitOfWork.Products.AddAsync(product, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                productsDict[prodToCreate.Reference.ToUpper()] = product;
                newProductsCreated++;
            }

            // 2. Criar os clientes que o usuário confirmou
            var customersDict = new Dictionary<string, Customer>();
            foreach (var custToCreate in customersToCreate)
            {
                var customer = new Customer(custToCreate.Code, custToCreate.Name);
                await _unitOfWork.Customers.AddAsync(customer, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                customersDict[custToCreate.Code.ToUpper()] = customer;
                newCustomersCreated++;
            }

            // 3. Criar billing request
            var billingRequest = new BillingRequest(fileName, userId);
            await _unitOfWork.BillingRequests.AddAsync(billingRequest, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // 4. Processar cada item
            foreach (var parsedItem in parseResult.Items.Where(i => !i.IsCustomerTotal))
            {
                // Buscar cliente (pode ser novo ou existente)
                Customer? customer = null;
                if (!string.IsNullOrWhiteSpace(parsedItem.CustomerCode))
                {
                    var code = parsedItem.CustomerCode.ToUpper();
                    if (customersDict.TryGetValue(code, out var newCustomer))
                    {
                        customer = newCustomer;
                    }
                    else
                    {
                        customer = await _unitOfWork.Customers.GetByCodeAsync(code, cancellationToken);
                    }
                }

                // Buscar produto (pode ser novo ou existente)
                Product? product = null;
                if (!string.IsNullOrWhiteSpace(parsedItem.ProductReference))
                {
                    var reference = parsedItem.ProductReference.ToUpper();
                    if (productsDict.TryGetValue(reference, out var newProduct))
                    {
                        product = newProduct;
                    }
                    else
                    {
                        product = await _unitOfWork.Products.GetByReferenceAsync(reference, cancellationToken);
                    }

                    // Se produto não existe e não foi criado, pular item
                    if (product == null)
                    {
                        warnings.Add($"Produto '{parsedItem.ProductReference}' não cadastrado - item ignorado");
                        continue;
                    }
                }

                // Criar billing request item
                var item = new BillingRequestItem(
                    billingRequest.Id,
                    parsedItem.CustomerCode,
                    parsedItem.CustomerName,
                    parsedItem.ProductReference,
                    parsedItem.ProductDescription,
                    parsedItem.Quantity,
                    parsedItem.UnitPrice,
                    parsedItem.IsCustomerTotal
                );

                if (customer != null)
                    item.LinkCustomer(customer.Id);
                if (product != null)
                    item.LinkProduct(product.Id);

                billingRequest.AddItem(item);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            return new ImportBillingRequestResultDto(
                true,
                null,
                parseResult.Items.Count,
                billingRequest.TotalItems,
                billingRequest.TotalCustomers,
                newCustomersCreated,
                newProductsCreated,
                warnings
            );
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);

            var errorMessage = ex.Message;
            if (ex.InnerException != null)
            {
                errorMessage += " | Inner: " + ex.InnerException.Message;
            }

            return new ImportBillingRequestResultDto(
                false,
                $"Erro ao importar arquivo: {errorMessage}",
                parseResult.Items.Count,
                0, 0, 0, 0,
                warnings
            );
        }
    }

    public async Task<ImportBillingRequestResultDto> ImportFromTxtAsync(
        Stream fileStream, string fileName, int? userId, CancellationToken cancellationToken = default)
    {
        var warnings = new List<string>();
        var newCustomersCreated = 0;
        var newProductsCreated = 0;

        // Encontrar parser apropriado
        var parser = _fileParsers.FirstOrDefault(p => p.CanHandle(fileName));
        if (parser == null)
        {
            return new ImportBillingRequestResultDto(
                false,
                $"Tipo de arquivo não suportado: {Path.GetExtension(fileName)}. Use .txt ou .pdf",
                0, 0, 0, 0, 0,
                new List<string>()
            );
        }

        // Parse the file
        var parseResult = await parser.ParseAsync(fileStream, fileName, cancellationToken);

        if (!parseResult.Success)
        {
            return new ImportBillingRequestResultDto(
                false,
                parseResult.ErrorMessage,
                0, 0, 0, 0, 0,
                parseResult.Warnings
            );
        }

        warnings.AddRange(parseResult.Warnings);

        await _unitOfWork.BeginTransactionAsync(cancellationToken);

        try
        {
            // SOBRESCREVER: Excluir TODOS os pedidos e items anteriores
            await _unitOfWork.BillingRequests.DeleteAllAsync(cancellationToken);
            warnings.Add("Pedidos anteriores excluídos");

            // Create billing request
            var billingRequest = new BillingRequest(fileName, userId);
            await _unitOfWork.BillingRequests.AddAsync(billingRequest, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Process each parsed item
            foreach (var parsedItem in parseResult.Items.Where(i => !i.IsCustomerTotal))
            {
                // Find or create customer
                Customer? customer = null;
                if (!string.IsNullOrWhiteSpace(parsedItem.CustomerCode))
                {
                    customer = await _unitOfWork.Customers.GetByCodeAsync(parsedItem.CustomerCode, cancellationToken);
                    if (customer is null)
                    {
                        customer = new Customer(parsedItem.CustomerCode, parsedItem.CustomerName ?? parsedItem.CustomerCode);
                        await _unitOfWork.Customers.AddAsync(customer, cancellationToken);
                        await _unitOfWork.SaveChangesAsync(cancellationToken);
                        newCustomersCreated++;
                    }
                }

                // Find or create product
                Product? product = null;
                if (!string.IsNullOrWhiteSpace(parsedItem.ProductReference))
                {
                    product = await _unitOfWork.Products.GetByReferenceAsync(parsedItem.ProductReference, cancellationToken);
                    if (product is null)
                    {
                        product = new Product(parsedItem.ProductReference, parsedItem.ProductDescription ?? parsedItem.ProductReference);
                        await _unitOfWork.Products.AddAsync(product, cancellationToken);
                        await _unitOfWork.SaveChangesAsync(cancellationToken);
                        newProductsCreated++;
                    }
                }

                // Create billing request item
                var item = new BillingRequestItem(
                    billingRequest.Id,
                    parsedItem.CustomerCode,
                    parsedItem.CustomerName,
                    parsedItem.ProductReference,
                    parsedItem.ProductDescription,
                    parsedItem.Quantity,
                    parsedItem.UnitPrice,
                    parsedItem.IsCustomerTotal
                );

                if (customer != null)
                    item.LinkCustomer(customer.Id);
                if (product != null)
                    item.LinkProduct(product.Id);

                billingRequest.AddItem(item);
            }
            
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            return new ImportBillingRequestResultDto(
                true,
                null,
                parseResult.Items.Count,
                billingRequest.TotalItems,
                billingRequest.TotalCustomers,
                newCustomersCreated,
                newProductsCreated,
                warnings
            );
        }
        catch (Exception ex)
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);

            var errorMessage = ex.Message;
            if (ex.InnerException != null)
            {
                errorMessage += " | Inner: " + ex.InnerException.Message;
                if (ex.InnerException.InnerException != null)
                {
                    errorMessage += " | Root: " + ex.InnerException.InnerException.Message;
                }
            }

            return new ImportBillingRequestResultDto(
                false,
                $"Erro ao importar arquivo: {errorMessage}",
                parseResult.Items.Count,
                0, 0, 0, 0,
                warnings
            );
        }
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var billingRequest = await _unitOfWork.BillingRequests.GetWithItemsAsync(id, cancellationToken);
        if (billingRequest == null)
            return false;

        // Limpar items para garantir exclusão
        billingRequest.Items.Clear();
        _unitOfWork.BillingRequests.Remove(billingRequest);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    private static BillingRequestDto MapToDto(BillingRequest request) => new(
        request.Id,
        request.Code,
        request.ImportedAt,
        request.FileName,
        request.TotalItems,
        request.TotalCustomers,
        request.TotalValue,
        request.TotalQuantity,
        request.ImportedBy?.Name,
        request.Notes,
        request.IsProcessed,
        request.Items.Select(MapItemToDto).ToList()
    );

    private static BillingRequestItemDto MapItemToDto(BillingRequestItem item) => new(
        item.Id,
        item.CustomerId,
        item.CustomerCode,
        item.CustomerName,
        item.ProductId,
        item.ProductReference,
        item.ProductDescription,
        item.Quantity,
        item.PendingQuantity,
        item.ProcessedQuantity,
        item.UnitPrice,
        item.TotalValue,
        item.IsCustomerTotal,
        item.Notes
    );
     
    public async Task<IEnumerable<BillingRequestDto>> GetByDeliveryDateAsync(DateTime deliveryDate, CancellationToken cancellationToken = default)
    {
        var requests = await _unitOfWork.BillingRequests.GetByDeliveryDateAsync(deliveryDate, cancellationToken);
        return requests.Select(MapToDto);
    }
}
