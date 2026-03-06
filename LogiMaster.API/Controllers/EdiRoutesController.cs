using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

using Microsoft.AspNetCore.Authorization;

namespace LogiMaster.API.Controllers;

[Authorize(Policy = "Module.Edi")]
[ApiController]
[Route("api/edi/routes")]
public class EdiRoutesController : ControllerBase
{
    private readonly IEdiRouteService _service;

    public EdiRoutesController(IEdiRouteService service)
    {
        _service = service;
    }

       [HttpGet("client/{clientId:int}")]
    public async Task<ActionResult<IEnumerable<EdiRouteDto>>> GetByClientId(int clientId, CancellationToken cancellationToken)
    {
        var routes = await _service.GetByClientIdAsync(clientId, cancellationToken);
        return Ok(routes);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<EdiRouteDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var route = await _service.GetByIdAsync(id, cancellationToken);
        if (route == null) return NotFound();
        return Ok(route);
    }

    [HttpPost]
    public async Task<ActionResult<EdiRouteDto>> Create([FromBody] CreateEdiRouteDto dto, CancellationToken cancellationToken)
    {
        var route = await _service.CreateAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = route.Id }, route);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<EdiRouteDto>> Update(int id, [FromBody] UpdateEdiRouteDto dto, CancellationToken cancellationToken)

    {
        var route = await _service.UpdateAsync(id, dto, cancellationToken);
        if (route == null) return NotFound();
        return Ok(route);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)

    {
        var result = await _service.DeleteAsync(id, cancellationToken);
        if (!result) return NotFound();
        return NoContent();
    }
}    