using LogiMaster.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LogiMaster.API.Controllers;

[Authorize(Roles = "Administrator")]
[ApiController]
[Route("api/audit")]
public class AuditController : ControllerBase
{
    private readonly IAuditService _service;

    public AuditController(IAuditService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetLogs(
        [FromQuery] int? userId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] string? action,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var result = await _service.GetLogsAsync(userId, from, to, action, page, pageSize, ct);
        return Ok(result);
    }
}
