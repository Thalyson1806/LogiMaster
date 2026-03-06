using LogiMaster.Application.Services;
using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

using Microsoft.AspNetCore.Authorization;

namespace LogiMaster.API.Controllers;

[Authorize(Policy = "Module.Edi")]
[ApiController]
[Route("api/edi/products")]
public class EdiProductsController : ControllerBase

{
    private readonly IEdiProductService _service;

    public EdiProductsController(IEdiProductService service)
    {
        _service = service;
    }

    [HttpGet("client/{clientId:int}")]
    public async Task<ActionResult<IEnumerable<EdiProductDto>>> GetByClientId(int clientId, CancellationToken cancellationToken)
    {
        var products = await _service.GetByClientIdAsync(clientId, cancellationToken);
        return Ok(products);
    }

       [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<EdiProductDto>>> Search([FromQuery] int clientId, [FromQuery] string term, CancellationToken cancellationToken)
    {
        var products = await _service.SearchAsync(clientId, term, cancellationToken);
        return Ok(products);
    }

[HttpGet("{id:int}")]
public async Task<ActionResult<EdiProductDto>> GetById(int id, CancellationToken cancellationToken)
{
    var product = await _service.GetByIdAsync(id, cancellationToken);
    if (product == null) return NotFound();
    return Ok(product);
}

[HttpPost]
public async Task<ActionResult<EdiProductDto>> Create([FromBody] CreateEdiProductDto dto, CancellationToken cancellationToken)
{
    var product = await _service.CreateAsync(dto, cancellationToken);
    return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
}

[HttpPut("{id:int}")]
    public async Task<ActionResult<EdiProductDto>> Update(int id, [FromBody] UpdateEdiProductDto dto, CancellationToken cancellationToken)
    {
        var product = await _service.UpdateAsync(id, dto, cancellationToken);
        if (product == null) return NotFound();
        return Ok(product);
    }

[HttpDelete("{id:int}")]
public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
{
    var result = await _service.DeleteAsync(id, cancellationToken);
    if (!result) return NotFound();
    return NoContent();
}

[HttpPost("import")]
public async Task<ActionResult> Import([FromQuery] int clientId, IFormFile file, CancellationToken cancellationToken)
{
    if (file == null || file.Length == 0)
    return BadRequest("Arquivo não enviado");

      using var stream = file.OpenReadStream();
        var count = await _service.ImportFromExcelAsync(clientId, stream, file.FileName, cancellationToken);
        return Ok(new { imported = count });
    }

        [HttpPost("migrate")]
    public async Task<ActionResult> Migrate([FromQuery] string sqlitePath, CancellationToken cancellationToken)
    {
        var migrationService = HttpContext.RequestServices.GetRequiredService<EdiMigrationService>();
        var result = await migrationService.MigrateFromSqliteAsync(sqlitePath, cancellationToken);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }

}
