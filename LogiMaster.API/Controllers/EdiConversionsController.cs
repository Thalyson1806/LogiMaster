using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

using Microsoft.AspNetCore.Authorization;

namespace LogiMaster.API.Controllers;

[Authorize(Policy = "Module.Edi")]
[ApiController]
[Route("api/edi/conversions")]
public class EdiConversionsController : ControllerBase
{
    private readonly IEdiConversionService _service;

    public EdiConversionsController(IEdiConversionService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EdiConversionDto>>> GetAll(CancellationToken cancellationToken)
    {
        var conversions = await _service.GetAllAsync(cancellationToken);
        return Ok(conversions);
    }

    [HttpGet("client/{clientId:int}")]
    public async Task<ActionResult<IEnumerable<EdiConversionDto>>> GetByClientId(int clientId, CancellationToken cancellationToken)
    {
        var conversions = await _service.GetByClientIdAsync(clientId, cancellationToken);
        return Ok(conversions);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<EdiConversionDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var conversion = await _service.GetByIdAsync(id, cancellationToken);
        if (conversion == null) return NotFound();
        return Ok(conversion);
    }

    [HttpPost("convert")]
    public async Task<ActionResult<EdiConversionResultDto>> Convert(
        [FromQuery] int clientId,
        [FromQuery] int routeId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        IFormFile file,
        CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
            return BadRequest("Arquivo não enviado");

        using var stream = file.OpenReadStream();
        var result = await _service.ConvertAsync(
            stream, file.FileName, clientId, routeId, 
            startDate, endDate, null, cancellationToken);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

    [HttpGet("{id:int}/download")]
    public async Task<IActionResult> Download(int id, CancellationToken cancellationToken)
    {
        try
        {
            var (content, fileName) = await _service.DownloadAsync(id, cancellationToken);
            return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ex.Message);
        }
        catch (NotImplementedException)
        {
            return StatusCode(501, "Download ainda não implementado");
        }
    }
}
