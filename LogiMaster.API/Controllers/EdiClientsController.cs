using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

using Microsoft.AspNetCore.Authorization;

namespace LogiMaster.API.Controllers;

[Authorize(Policy = "Module.Edi")]
[ApiController]
[Route("api/edi/clients")]
public class EdiClientsController : ControllerBase
{
    private readonly IEdiClientService _service;

    public EdiClientsController(IEdiClientService service)
    {
        _service = service;

    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EdiClientDto>>> GetAll(CancellationToken cancellationToken)
    {
        var clients = await _service.GetAllAsync(cancellationToken);
        return Ok(clients);
    }

        [HttpGet("{id:int}")]
    public async Task<ActionResult<EdiClientDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var client = await _service.GetByIdAsync(id, cancellationToken);
        if (client == null) return NotFound();
        return Ok(client);
    }

    [HttpGet("code/{code}")]
    public async Task<ActionResult<EdiClientDto>> GetByCode(string code, CancellationToken cancellationToken)
    {
        var client = await _service.GetByCodeAsync(code, cancellationToken);
        if (client == null) return NotFound();
        return Ok(client);
    }

    [HttpPost]
    public async Task<ActionResult<EdiClientDto>> Create([FromBody] CreateEdiClientDto dto, CancellationToken cancellationToken)
    {
        var client = await _service.CreateAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = client.Id }, client);

    }

    [HttpPut("{id:int}")]
      public async Task<ActionResult<EdiClientDto>> Update(int id, [FromBody] UpdateEdiClientDto dto, CancellationToken cancellationToken)
      {
        var client = await _service.UpdateAsync(id, dto, cancellationToken);
        if (client == null) return NotFound();
        return Ok(client);
      }

      [HttpDelete("{id:int}")]
      public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
      {
        var result = await _service.DeleteAsync(id, cancellationToken);
        if (!result) return NotFound();
        return NoContent();
      }
}