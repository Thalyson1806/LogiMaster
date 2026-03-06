using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

using Microsoft.AspNetCore.Authorization;

namespace LogiMaster.API.Controllers;

[Authorize(Policy = "Module.Clientes")]
[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;

    public CustomersController(ICustomerService customerService)
    {
        _customerService = customerService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CustomerDto>>> GetAll(CancellationToken cancellationToken)
    {
        var customers = await _customerService.GetAllAsync(cancellationToken);
        return Ok(customers);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CustomerDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var customer = await _customerService.GetByIdAsync(id, cancellationToken);
        return customer is null ? NotFound() : Ok(customer);
    }

    [HttpGet("code/{code}")]
    public async Task<ActionResult<CustomerDto>> GetByCode(string code, CancellationToken cancellationToken)
    {
        var customer = await _customerService.GetByCodeAsync(code, cancellationToken);
        return customer is null ? NotFound() : Ok(customer);
    }

    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<CustomerDto>>> Search([FromQuery] string term, CancellationToken cancellationToken)
    {
        var customers = await _customerService.SearchAsync(term, cancellationToken);
        return Ok(customers);
    }

    [HttpPost]
    public async Task<ActionResult<CustomerDto>> Create([FromBody] CreateCustomerDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var customer = await _customerService.CreateAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = customer.Id }, customer);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<CustomerDto>> Update(int id, [FromBody] UpdateCustomerDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var customer = await _customerService.UpdateAsync(id, dto, cancellationToken);
            return Ok(customer);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Deactivate(int id, CancellationToken cancellationToken)
    {
        var result = await _customerService.DeactivateAsync(id, cancellationToken);
        return result ? NoContent() : NotFound();
    }

    [HttpPost("{id:int}/activate")]
    public async Task<ActionResult> Activate(int id, CancellationToken cancellationToken)
    {
        var result = await _customerService.ActivateAsync(id, cancellationToken);
        return result ? NoContent() : NotFound();
    }
}
