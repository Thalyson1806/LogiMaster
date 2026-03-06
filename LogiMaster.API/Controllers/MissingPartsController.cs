using LogiMaster.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

using Microsoft.AspNetCore.Authorization;

namespace LogiMaster.API.Controllers;

[Authorize(Policy = "Module.Estoque")]
[ApiController]
[Route("api/missing-parts")]
public class MissingPartsController : ControllerBase
{
    private readonly IMissingPartsService _service;

    public MissingPartsController(IMissingPartsService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var result = await _service.GetMissingPartsAsync(ct);
        return Ok(result);
    }

    [HttpGet("{productId:int}")]
    public async Task<IActionResult> GetByProduct(int productId, CancellationToken ct)
    {
        var result = await _service.GetByProductAsync(productId, ct);
        if (result == null) return NotFound();
        return Ok(result);
    }
}
