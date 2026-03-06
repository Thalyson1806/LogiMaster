using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

using Microsoft.AspNetCore.Authorization;

namespace LogiMaster.API.Controllers;

[Authorize(Policy = "Module.Estoque")]
[ApiController]
[Route("api/[controller]")]
public class WarehouseController : ControllerBase
{
    private readonly IWarehouseService _service;

    public WarehouseController(IWarehouseService service)
    {
        _service = service;
    }

    // === STREETS ===
    [HttpGet("streets")]
    public async Task<ActionResult<IEnumerable<WarehouseStreetDto>>> GetStreets(CancellationToken ct)
    {
        var result = await _service.GetAllStreetsAsync(ct);
        return Ok(result);
    }

    [HttpGet("streets/{id}")]
    public async Task<ActionResult<WarehouseStreetDto>> GetStreet(int id, CancellationToken ct)
    {
        var result = await _service.GetStreetByIdAsync(id, ct);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("streets")]
    public async Task<ActionResult<WarehouseStreetDto>> CreateStreet(CreateWarehouseStreetDto dto, CancellationToken ct)
    {
        try
        {
            var result = await _service.CreateStreetAsync(dto, ct);
            return CreatedAtAction(nameof(GetStreet), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("streets/{id}")]
    public async Task<ActionResult<WarehouseStreetDto>> UpdateStreet(int id, UpdateWarehouseStreetDto dto, CancellationToken ct)
    {
        try
        {
            var result = await _service.UpdateStreetAsync(id, dto, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("streets/{id}")]
    public async Task<ActionResult> DeleteStreet(int id, CancellationToken ct)
    {
        try
        {
            await _service.DeleteStreetAsync(id, ct);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // === LOCATIONS ===
    [HttpGet("locations")]
    public async Task<ActionResult<IEnumerable<WarehouseLocationDto>>> GetLocations(CancellationToken ct)
    {
        var result = await _service.GetAllLocationsAsync(ct);
        return Ok(result);
    }

    [HttpGet("locations/{id}")]
    public async Task<ActionResult<WarehouseLocationDto>> GetLocation(int id, CancellationToken ct)
    {
        var result = await _service.GetLocationByIdAsync(id, ct);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpGet("locations/street/{streetId}")]
    public async Task<ActionResult<IEnumerable<WarehouseLocationDto>>> GetLocationsByStreet(int streetId, CancellationToken ct)
    {
        var result = await _service.GetLocationsByStreetAsync(streetId, ct);
        return Ok(result);
    }

    [HttpGet("locations/code/{code}")]
    public async Task<ActionResult<WarehouseLocationDto>> GetLocationByCode(string code, CancellationToken ct)
    {
        var result = await _service.GetLocationByCodeAsync(code, ct);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("locations")]
    public async Task<ActionResult<WarehouseLocationDto>> CreateLocation(CreateWarehouseLocationDto dto, CancellationToken ct)
    {
        try
        {
            var result = await _service.CreateLocationAsync(dto, ct);
            return CreatedAtAction(nameof(GetLocation), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("locations/bulk")]
    public async Task<ActionResult<IEnumerable<WarehouseLocationDto>>> BulkCreateLocations(BulkCreateLocationsDto dto, CancellationToken ct)
    {
        try
        {
            var result = await _service.BulkCreateLocationsAsync(dto, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("locations/{id}")]
    public async Task<ActionResult> DeleteLocation(int id, CancellationToken ct)
    {
        try
        {
            await _service.DeleteLocationAsync(id, ct);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // === PRODUCT LOCATIONS ===
    [HttpGet("product-locations")]
    public async Task<ActionResult<IEnumerable<ProductLocationDto>>> GetProductLocations(
        [FromQuery] int? productId, [FromQuery] int? locationId, CancellationToken ct)
    {
        var result = await _service.GetProductLocationsAsync(productId, locationId, ct);
        return Ok(result);
    }

    [HttpPost("product-locations")]
    public async Task<ActionResult<ProductLocationDto>> AssignProductLocation(AssignProductLocationDto dto, CancellationToken ct)
    {
        try
        {
            var result = await _service.AssignProductLocationAsync(dto, ct);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("product-locations/{id}")]
    public async Task<ActionResult> DeleteProductLocation(int id, CancellationToken ct)
    {
        try
        {
            await _service.DeleteProductLocationAsync(id, ct);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // === MAP ===
    [HttpGet("map")]
    public async Task<ActionResult<WarehouseMapDto>> GetMap(CancellationToken ct)
    {
        var result = await _service.GetWarehouseMapAsync(ct);
        return Ok(result);
    }
}
