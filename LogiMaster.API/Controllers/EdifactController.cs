using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using LogiMaster.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

using Microsoft.AspNetCore.Authorization;

namespace LogiMaster.API.Controllers;

[Authorize(Policy = "Module.Edi")]
[ApiController]
[Route("api/[controller]")]
public class EdifactController : ControllerBase
{
    private readonly IEdifactService _edifactService;

    public EdifactController(IEdifactService edifactService)
    {
        _edifactService = edifactService;
    }

    [HttpGet("files")]
    public async Task<ActionResult<IEnumerable<EdifactFileSummaryDto>>> GetAllFiles(CancellationToken ct)
    {
        var files = await _edifactService.GetAllFilesAsync(ct);
        return Ok(files);
    }

    [HttpGet("files/customer/{customerId:int}")]
    public async Task<ActionResult<IEnumerable<EdifactFileSummaryDto>>> GetFilesByCustomer(int customerId, CancellationToken ct)
    {
        var files = await _edifactService.GetFilesByCustomerAsync(customerId, ct);
        return Ok(files);
    }

    [HttpGet("files/{id:int}")]
    public async Task<ActionResult<EdifactFileDetailDto>> GetFileById(int id, CancellationToken ct)
    {
        var file = await _edifactService.GetFileByIdAsync(id, ct);
        if (file == null) return NotFound();
        return Ok(file);
    }

    [HttpPost("detect-customer")]
    public async Task<ActionResult<EdifactDetectedCustomerDto>> DetectCustomer(
        IFormFile file,
        [FromQuery] EdifactMessageType messageType = EdifactMessageType.DELFOR,
        CancellationToken ct = default)
    {
        if (file == null || file.Length == 0)
            return BadRequest("Arquivo não enviado");

        using var stream = file.OpenReadStream();
        var detected = await _edifactService.DetectCustomerFromFileAsync(stream, messageType, ct);
        if (detected == null)
            return NotFound("Nenhum cliente encontrado para o código do emitente no arquivo");

        return Ok(detected);
    }

    [HttpPost("upload")]
    public async Task<ActionResult<EdifactFileDto>> UploadFile(
        IFormFile file,
        [FromQuery] int customerId,
        [FromQuery] EdifactMessageType messageType = EdifactMessageType.DELFOR,
        CancellationToken ct = default)
    {
        if (file == null || file.Length == 0)
            return BadRequest("Arquivo não enviado");

        using var stream = file.OpenReadStream();
        var result = await _edifactService.UploadFileAsync(stream, file.FileName, customerId, messageType, ct);
        return Ok(result);
    }

    [HttpPost("files/{id:int}/process")]
    public async Task<ActionResult<EdifactProcessingResultDto>> ProcessFile(int id, CancellationToken ct)
    {
        var result = await _edifactService.ProcessFileAsync(id, ct);
        if (!result.Success)
            return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("items")]
    public async Task<ActionResult<IEnumerable<EdifactItemDto>>> GetItemsByDateRange(
        [FromQuery] DateTime start,
        [FromQuery] DateTime end,
        CancellationToken ct)
    {
        var items = await _edifactService.GetItemsByDateRangeAsync(start, end, ct);
        return Ok(items);
    }
}
