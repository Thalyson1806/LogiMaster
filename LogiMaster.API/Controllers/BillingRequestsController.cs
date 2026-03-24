using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

using Microsoft.AspNetCore.Authorization;

namespace LogiMaster.API.Controllers;

[Authorize(Policy = "Module.Faturamento")]
[ApiController]
[Route("api/[controller]")]
public class BillingRequestsController : ControllerBase
{
    private readonly IBillingRequestService _billingRequestService;

    public BillingRequestsController(IBillingRequestService billingRequestService)
    {
        _billingRequestService = billingRequestService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<BillingRequestSummaryDto>>> GetAll(CancellationToken cancellationToken)
    {
        var requests = await _billingRequestService.GetAllAsync(cancellationToken);
        return Ok(requests);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<BillingRequestDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var request = await _billingRequestService.GetByIdAsync(id, cancellationToken);
        return request is null ? NotFound() : Ok(request);
    }

   [HttpGet("pending-summary")]
public async Task<ActionResult<IEnumerable<CustomerPendingSummaryDto>>> GetPendingSummary(
    [FromQuery] int? billingRequestId,
    [FromQuery] DateTime? startDate,
    [FromQuery] DateTime? endDate,
    CancellationToken cancellationToken)
{
    var summaries = await _billingRequestService.GetPendingSummaryByCustomerAsync(
        billingRequestId, startDate, endDate, cancellationToken);
    return Ok(summaries);
}


    [HttpGet("pending-items/{customerId:int}")]
    public async Task<ActionResult<IEnumerable<BillingRequestItemDto>>> GetPendingItemsByCustomer(
        int customerId, CancellationToken cancellationToken)
    {
        var items = await _billingRequestService.GetPendingItemsByCustomerAsync(customerId, cancellationToken);
        return Ok(items);
    }

    /// <summary>
    /// Pré-valida um arquivo antes de importar - retorna produtos e clientes não cadastrados
    /// </summary>
    [HttpPost("pre-validate")]
    public async Task<ActionResult<PreValidateImportResultDto>> PreValidate(
        IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "Arquivo é obrigatório" });

        using var stream = file.OpenReadStream();
        var result = await _billingRequestService.PreValidateImportAsync(stream, file.FileName, cancellationToken);

        return result.CanImport ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Importa o arquivo com confirmação - cria produtos/clientes conforme solicitado
    /// </summary>
    [HttpPost("import-with-confirmation")]
    public async Task<ActionResult<ImportBillingRequestResultDto>> ImportWithConfirmation(
        [FromForm] IFormFile file,
        [FromForm] string productsToCreateJson,
        [FromForm] string customersToCreateJson,
        CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "Arquivo é obrigatório" });

        // Deserializar as listas de JSON
        var productsToCreate = string.IsNullOrEmpty(productsToCreateJson) 
            ? new List<ProductToCreateDto>() 
            : System.Text.Json.JsonSerializer.Deserialize<List<ProductToCreateDto>>(productsToCreateJson, 
                new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }) 
              ?? new List<ProductToCreateDto>();

        var customersToCreate = string.IsNullOrEmpty(customersToCreateJson) 
            ? new List<CustomerToCreateDto>() 
            : System.Text.Json.JsonSerializer.Deserialize<List<CustomerToCreateDto>>(customersToCreateJson,
                new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true }) 
              ?? new List<CustomerToCreateDto>();

        int? userId = int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var uid) ? uid : null;

        using var stream = file.OpenReadStream();
        var result = await _billingRequestService.ImportWithConfirmationAsync(
            stream, file.FileName, productsToCreate, customersToCreate, userId, cancellationToken);

        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Importa o arquivo automaticamente (comportamento antigo - cria tudo automaticamente)
    /// </summary>
    [HttpPost("import")]
    public async Task<ActionResult<ImportBillingRequestResultDto>> Import(
        IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "Arquivo é obrigatório" });

        int? userId = int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var uid2) ? uid2 : null;

        using var stream = file.OpenReadStream();
        var result = await _billingRequestService.ImportFromTxtAsync(stream, file.FileName, userId, cancellationToken);

        return result.Success ? Ok(result) : BadRequest(result);
    }
    [HttpDelete("{id:int}")]
public async Task<ActionResult> Delete(int id, CancellationToken cancellationToken)
{
    var deleted = await _billingRequestService.DeleteAsync(id, cancellationToken);
    return deleted ? NoContent() : NotFound();
}
}
