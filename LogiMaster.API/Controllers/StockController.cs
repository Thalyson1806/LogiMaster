using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

using Microsoft.AspNetCore.Authorization;

namespace LogiMaster.API.Controllers;

[Authorize(Policy = "Module.Estoque")]
[ApiController]
[Route("api/stock")]
public class StockController : ControllerBase
{
    private readonly IStockService _service;

    public StockController(IStockService service)
    {
        _service = service;
    }
  [HttpGet]
    public async Task<IActionResult> GetSummary([FromQuery] string? type, CancellationToken ct)
    {
    var result = await _service.GetStockSummaryAsync(type, ct);
    return Ok(result);
    }


    [HttpGet("{productId:int}/movements")]
    public async Task<IActionResult> GetMovements(int productId, CancellationToken ct)
    {
        var result = await _service.GetMovementsByProductAsync(productId, ct);
        return Ok(result);
    }

    [HttpPost("movement")]
    public async Task<IActionResult> RegisterMovement([FromBody] CreateStockMovementDto dto, CancellationToken ct)
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var result = await _service.RegisterMovementAsync(dto, userId, ct);
        return Ok(result);
    }

    [HttpDelete("movement/{id:int}")]
    public async Task<IActionResult> DeleteMovement(int id, CancellationToken ct)
    {
        var deleted = await _service.DeleteMovementAsync(id, ct);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("bulk")]
    public async Task<IActionResult> RegisterBulk([FromBody] BulkCreateStockMovementDto dto, CancellationToken ct)
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var result = await _service.RegisterBulkMovementsAsync(dto, userId, ct);
        return Ok(result);
    }
}
