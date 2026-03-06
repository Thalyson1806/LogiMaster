using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

using Microsoft.AspNetCore.Authorization;

namespace LogiMaster.API.Controllers;

[Authorize(Policy = "Module.Produtos")]
[ApiController]
[Route("api/customer-products")]
public class CustomerProductsController : ControllerBase
{
    private readonly ICustomerProductService _service;

    public CustomerProductsController(ICustomerProductService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CustomerProductDto>>> GetAll(CancellationToken ct)
    {
        var result = await _service.GetAllAsync(ct);
        return Ok(result);
    }

    [HttpGet("customer/{customerId}")]
    public async Task<ActionResult<IEnumerable<CustomerProductDto>>> GetByCustomer(int customerId, CancellationToken ct)
    {
        var result = await _service.GetByCustomerAsync(customerId, ct);
        return Ok(result);
    }

    [HttpGet("product/{productId}")]
    public async Task<ActionResult<IEnumerable<CustomerProductDto>>> GetByProduct(int productId, CancellationToken ct)
    {
        var result = await _service.GetByProductAsync(productId, ct);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CustomerProductDto>> GetById(int id, CancellationToken ct)
    {
        var result = await _service.GetByIdAsync(id, ct);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<CustomerProductDto>> Create([FromBody] CustomerProductInput input, CancellationToken ct)
    {
        try
        {
            var result = await _service.CreateAsync(input, ct);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CustomerProductDto>> Update(int id, [FromBody] CustomerProductInput input, CancellationToken ct)
    {
        try
        {
            var result = await _service.UpdateAsync(id, input, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        try
        {
            await _service.DeleteAsync(id, ct);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
