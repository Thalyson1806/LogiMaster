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
        // userId = 1 por enquanto (sem auth middleware configurado nao esquecer de alterar quando for criar novos usuarios em painel)
        var result = await _service.RegisterMovementAsync(dto, userId: 1, ct);
        return Ok(result);
    }

    [HttpPost("bulk")]
    public async Task<IActionResult> RegisterBulk([FromBody] BulkCreateStockMovementDto dto, CancellationToken ct)
    {
        var result = await _service.RegisterBulkMovementsAsync(dto, userId: 1, ct);
        return Ok(result);
    }
}
