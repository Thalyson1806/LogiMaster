using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using LogiMaster.Domain.Entities;
using LogiMaster.Infrastructure.Data.Context;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using Microsoft.AspNetCore.Authorization;

namespace LogiMaster.API.Controllers;

[Authorize(Policy = "Module.Produtos")]
[ApiController]
[Route("api/[controller]")]
public class PackagingsController : ControllerBase
{
    private readonly IPackagingService _packagingService;
    private readonly LogiMasterDbContext _context;

    public PackagingsController(IPackagingService packagingService, LogiMasterDbContext context)
    {
        _packagingService = packagingService;
        _context = context;
    }

    // ===== TIPOS DE EMBALAGEM =====

    [HttpGet("types")]
    public async Task<ActionResult<IEnumerable<PackagingTypeDto>>> GetTypes(CancellationToken cancellationToken)
    {
        var types = await _context.PackagingTypes
            .Where(t => t.IsActive)
            .OrderBy(t => t.Name)
            .Select(t => new PackagingTypeDto(t.Id, t.Code, t.Name, t.Description))
            .ToListAsync(cancellationToken);

        return Ok(types);
    }

    [HttpPost("types")]
    public async Task<ActionResult<PackagingTypeDto>> CreateType([FromBody] CreatePackagingTypeDto dto, CancellationToken cancellationToken)
    {
        var code = dto.Code.Trim().ToUpper();
        var exists = await _context.PackagingTypes.AnyAsync(t => t.Code == code, cancellationToken);
        if (exists)
            return BadRequest(new { message = $"Tipo '{code}' já existe" });

        var type = new PackagingType(code, dto.Name.Trim());
        _context.PackagingTypes.Add(type);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new PackagingTypeDto(type.Id, type.Code, type.Name, type.Description));
    }

    // ===== EMBALAGENS =====

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PackagingDto>>> GetAll(CancellationToken cancellationToken)
    {
        var packagings = await _packagingService.GetAllAsync(cancellationToken);
        return Ok(packagings);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PackagingDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var packaging = await _packagingService.GetByIdAsync(id, cancellationToken);
        if (packaging is null) return NotFound();
        return Ok(packaging);
    }

    [HttpGet("code/{code}")]
    public async Task<ActionResult<PackagingDto>> GetByCode(string code, CancellationToken cancellationToken)
    {
        var packaging = await _packagingService.GetByCodeAsync(code, cancellationToken);
        if (packaging is null) return NotFound();
        return Ok(packaging);
    }

    [HttpGet("type/{typeId:int}")]
    public async Task<ActionResult<IEnumerable<PackagingDto>>> GetByType(int typeId, CancellationToken cancellationToken)
    {
        var packagings = await _packagingService.GetByTypeAsync(typeId, cancellationToken);
        return Ok(packagings);
    }

    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<PackagingDto>>> Search([FromQuery] string term, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(term)) return BadRequest("Termo de busca é obrigatório");
        var packagings = await _packagingService.SearchAsync(term, cancellationToken);
        return Ok(packagings);
    }

    [HttpPost]
    public async Task<ActionResult<PackagingDto>> Create([FromBody] CreatePackagingDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var packaging = await _packagingService.CreateAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = packaging.Id }, packaging);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<PackagingDto>> Update(int id, [FromBody] UpdatePackagingDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var packaging = await _packagingService.UpdateAsync(id, dto, cancellationToken);
            return Ok(packaging);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/deactivate")]
    public async Task<ActionResult> Deactivate(int id, CancellationToken cancellationToken)
    {
        var success = await _packagingService.DeactivateAsync(id, cancellationToken);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpPost("{id:int}/activate")]
    public async Task<ActionResult> Activate(int id, CancellationToken cancellationToken)
    {
        var success = await _packagingService.ActivateAsync(id, cancellationToken);
        if (!success) return NotFound();
        return NoContent();
    }

    // ===== IMPORTAR DA PLANILHA =====
    // Lê coluna C — detecta o tipo pelo primeiro bloco do nome (ex: "KLT 6421" → tipo "KLT")
    [HttpPost("import-spreadsheet")]
    public async Task<IActionResult> ImportFromSpreadsheet(IFormFile file, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Arquivo não enviado" });

        try
        {
            OfficeOpenXml.ExcelPackage.License.SetNonCommercialPersonal("LogiMaster");

            using var stream = file.OpenReadStream();
            using var package = new OfficeOpenXml.ExcelPackage(stream);
            var worksheet = package.Workbook.Worksheets[0];
            var rowCount = worksheet.Dimension?.Rows ?? 0;

            // Coleta valores únicos da coluna C
            var packagingTexts = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            for (int row = 2; row <= rowCount; row++)
            {
                var text = worksheet.Cells[row, 3].Text?.Trim();
                if (!string.IsNullOrEmpty(text))
                    packagingTexts.Add(text);
            }

            if (packagingTexts.Count == 0)
                return BadRequest(new { message = "Nenhum valor encontrado na coluna C" });

            var created = 0;
            var skipped = 0;

            foreach (var text in packagingTexts)
            {
                var code = text.ToUpper().Replace(" ", "");
                var name = text.ToUpper();

                // Detecta o tipo pelo primeiro bloco do nome: "KLT 6421" → "KLT", "RACK METALICO" → "RACK"
                var typeCode = text.ToUpper().Split(' ', StringSplitOptions.RemoveEmptyEntries)[0];

                var packType = await _context.PackagingTypes
                    .FirstOrDefaultAsync(t => t.Code == typeCode, cancellationToken);

                if (packType == null)
                {
                    packType = new PackagingType(typeCode, typeCode);
                    _context.PackagingTypes.Add(packType);
                    await _context.SaveChangesAsync(cancellationToken);
                }

                var existing = await _packagingService.GetByCodeAsync(code, cancellationToken);
                if (existing != null)
                {
                    skipped++;
                    continue;
                }

                await _packagingService.CreateAsync(new CreatePackagingDto(
                    Code: code,
                    Name: name,
                    PackagingTypeId: packType.Id
                ), cancellationToken);
                created++;
            }

            return Ok(new
            {
                message = $"{created} embalagens criadas, {skipped} já existiam",
                created,
                skipped
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Erro ao processar: {ex.Message}" });
        }
    }
}

public record PackagingTypeDto(int Id, string Code, string Name, string? Description);
public record CreatePackagingTypeDto(string Code, string Name, string? Description = null);
