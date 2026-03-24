using iText.IO.Font.Constants;
using iText.IO.Image;
using iText.Kernel.Font;
using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Canvas;
using LogiMaster.API.Hubs;
using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using LogiMaster.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace LogiMaster.API.Controllers;

[Authorize(Policy = "Module.Romaneios")]
[ApiController]
[Route("api/[controller]")]
public class PackingListsController : ControllerBase
{
    private readonly IPackingListService _packingListService;
    private readonly IHubContext<PackingListHub> _hubContext;
    private readonly IWebHostEnvironment _env;

    public PackingListsController(
        IPackingListService packingListService,
        IHubContext<PackingListHub> hubContext,
        IWebHostEnvironment env)
    {
        _packingListService = packingListService;
        _hubContext = hubContext;
        _env = env;
    }

    private async Task NotifyStatusChange(PackingListDto packingList)
    {
        await _hubContext.Clients.All.SendAsync("PackingListUpdated", new
        {
            id = packingList.Id,
            code = packingList.Code,
            status = packingList.Status.ToString(),
            customerName = packingList.CustomerName
        });
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PackingListSummaryDto>>> GetAll(CancellationToken cancellationToken)
    {
        var packingLists = await _packingListService.GetAllAsync(cancellationToken);
        return Ok(packingLists);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PackingListDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var packingList = await _packingListService.GetByIdAsync(id, cancellationToken);
        return packingList is null ? NotFound() : Ok(packingList);
    }

    [HttpGet("code/{code}")]
    public async Task<ActionResult<PackingListDto>> GetByCode(string code, CancellationToken cancellationToken)
    {
        var packingList = await _packingListService.GetByCodeAsync(code, cancellationToken);
        return packingList is null ? NotFound() : Ok(packingList);
    }

    [HttpGet("status/{status}")]
    public async Task<ActionResult<IEnumerable<PackingListSummaryDto>>> GetByStatus(
        PackingListStatus status, CancellationToken cancellationToken)
    {
        var packingLists = await _packingListService.GetByStatusAsync(status, cancellationToken);
        return Ok(packingLists);
    }

    [HttpGet("customer/{customerId:int}")]
    public async Task<ActionResult<IEnumerable<PackingListSummaryDto>>> GetByCustomer(
        int customerId, CancellationToken cancellationToken)
    {
        var packingLists = await _packingListService.GetByCustomerAsync(customerId, cancellationToken);
        return Ok(packingLists);
    }

    [HttpGet("pending-shipping")]
    public async Task<ActionResult<IEnumerable<PackingListSummaryDto>>> GetPendingForShipping(CancellationToken cancellationToken)
    {
        var packingLists = await _packingListService.GetPendingForShippingAsync(cancellationToken);
        return Ok(packingLists);
    }

    [HttpGet("pending-invoicing")]
    public async Task<ActionResult<IEnumerable<PackingListSummaryDto>>> GetPendingForInvoicing(CancellationToken cancellationToken)
    {
        var packingLists = await _packingListService.GetPendingForInvoicingAsync(cancellationToken);
        return Ok(packingLists);
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardSummaryDto>> GetDashboard(CancellationToken cancellationToken)
    {
        var dashboard = await _packingListService.GetDashboardSummaryAsync(cancellationToken);
        return Ok(dashboard);
    }

    [HttpGet("for-delivery")]
    public async Task<ActionResult<IEnumerable<PackingListSummaryDto>>> GetForDelivery(CancellationToken cancellationToken)
    {
        var result = await _packingListService.GetForDeliveryAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("pending-labels")]
    public async Task<ActionResult<IEnumerable<PendingLabelItemDto>>> GetPendingLabels(
        [FromQuery] int userId, CancellationToken cancellationToken)
    {
        if (userId <= 0) return BadRequest(new { message = "userId inválido" });
        var items = await _packingListService.GetPendingLabelsAsync(userId, cancellationToken);
        return Ok(items);
    }

    [HttpPost("items/{itemId:int}/mark-label-printed")]
    public async Task<IActionResult> MarkLabelPrinted(int itemId, CancellationToken cancellationToken)
    {
        try
        {
            await _packingListService.MarkLabelPrintedAsync(itemId, cancellationToken);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<PackingListDto>> Create(
        [FromBody] CreatePackingListDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var userId = 1;
            var packingList = await _packingListService.CreateAsync(dto, userId, cancellationToken);
            await NotifyStatusChange(packingList);
            return CreatedAtAction(nameof(GetById), new { id = packingList.Id }, packingList);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/start-separation")]
    public async Task<ActionResult<PackingListDto>> StartSeparation(int id, CancellationToken cancellationToken)
    {
        try
        {
            var packingList = await _packingListService.StartSeparationAsync(id, 1, cancellationToken);
            await NotifyStatusChange(packingList);
            return Ok(packingList);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/complete-separation")]
    public async Task<ActionResult<PackingListDto>> CompleteSeparation(int id, CancellationToken cancellationToken)
    {
        try
        {
            var packingList = await _packingListService.CompleteSeparationAsync(id, cancellationToken);
            await NotifyStatusChange(packingList);
            return Ok(packingList);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/start-conference")]
    public async Task<ActionResult<PackingListDto>> StartConference(int id, CancellationToken cancellationToken)
    {
        try
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized();
            var packingList = await _packingListService.StartConferenceAsync(id, userId, cancellationToken);
            await NotifyStatusChange(packingList);
            return Ok(packingList);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/conference-item")]
    public async Task<ActionResult<PackingListDto>> ConferenceItem(
        int id, [FromBody] ConferenceItemDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var packingList = await _packingListService.ConferenceItemAsync(id, dto, cancellationToken);
            await NotifyStatusChange(packingList);
            return Ok(packingList);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/complete-conference")]
    public async Task<ActionResult<PackingListDto>> CompleteConference(int id, CancellationToken cancellationToken)
    {
        try
        {
            var packingList = await _packingListService.CompleteConferenceAsync(id, cancellationToken);
            await NotifyStatusChange(packingList);
            return Ok(packingList);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/invoice")]
    public async Task<ActionResult<PackingListDto>> Invoice(
        int id, [FromBody] InvoicePackingListDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var packingList = await _packingListService.InvoiceAsync(id, dto, 1, cancellationToken);
            await NotifyStatusChange(packingList);
            return Ok(packingList);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/cancel")]
    public async Task<ActionResult> Cancel(int id, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _packingListService.CancelAsync(id, cancellationToken);
            if (result)
                await _hubContext.Clients.All.SendAsync("PackingListUpdated", new { id, status = "Cancelled" });
            return result ? NoContent() : NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/dispatch")]
    public async Task<ActionResult<PackingListDto>> Dispatch(int id, [FromBody] DispatchPackingListDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _packingListService.DispatchAsync(id, dto, cancellationToken);
            await NotifyStatusChange(result);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/deliver")]
    public async Task<ActionResult<PackingListDto>> Deliver(int id, [FromBody] DeliverPackingListDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var wwwroot = _env.WebRootPath ?? "wwwroot";
            var signaturesFolder = Path.Combine(wwwroot, "deliveries", "signatures");
            var result = await _packingListService.DeliverAsync(id, dto, signaturesFolder, cancellationToken);

            PackingListHub.ActiveDrivers.TryRemove(id, out _);

            // Gera canhoto para cada NF PDF anexada
            if (result.DeliverySignaturePath != null && result.NfPdfs.Any(n => n.HasPdf))
            {
                foreach (var nfPdf in result.NfPdfs.Where(n => n.HasPdf && !n.HasCanhoto))
                {
                    try
                    {
                        var canhotoRelPath = await GenerateNfCanhotoAsync(
                            id, nfPdf.Id, nfPdf.NfNumber, result.Code, result.CustomerName,
                            result.DeliverySignaturePath, result.DeliveredAt ?? DateTime.UtcNow, wwwroot);
                        await _packingListService.SetNfPdfCanhotoAsync(nfPdf.Id, canhotoRelPath, cancellationToken);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[Canhoto NF {nfPdf.NfNumber}] Erro ao gerar: {ex.Message}");
                    }
                }
                result = (await _packingListService.GetByIdAsync(id, cancellationToken))!;
            }
            else if (result.HasInvoicePdf && result.DeliverySignaturePath != null)
            {
                // Fallback: canhoto legado (NF única via InvoicePdfPath)
                try
                {
                    var canhotoRelPath = await GenerateCanhotoAsync(id, result.Code, result.CustomerName,
                        result.DeliverySignaturePath, result.DeliveredAt ?? DateTime.UtcNow, wwwroot);
                    await _packingListService.SetCanhotoAsync(id, canhotoRelPath, cancellationToken);
                    result = (await _packingListService.GetByIdAsync(id, cancellationToken))!;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Canhoto] Erro ao gerar: {ex.Message}");
                }
            }

            await NotifyStatusChange(result);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ── Endpoints: múltiplas NFs por romaneio ────────────────────────────────

    [HttpPost("{id}/nf-pdfs")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadNfPdf(int id, IFormFile file, [FromQuery] string nfNumber, CancellationToken cancellationToken)
    {
        if (file == null || !file.ContentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Arquivo PDF é obrigatório" });

        if (string.IsNullOrWhiteSpace(nfNumber))
            return BadRequest(new { message = "Número da NF é obrigatório" });

        var wwwroot = _env.WebRootPath ?? "wwwroot";
        var invoicesFolder = Path.Combine(wwwroot, "deliveries", "invoices");
        Directory.CreateDirectory(invoicesFolder);

        var safeNf = string.Concat(nfNumber.Trim().Split(Path.GetInvalidFileNameChars()));
        var fileName = $"{id}_{safeNf}_{DateTime.UtcNow:yyyyMMddHHmmss}.pdf";
        var fullPath = Path.Combine(invoicesFolder, fileName);

        using (var stream = System.IO.File.Create(fullPath))
            await file.CopyToAsync(stream, cancellationToken);

        var relativePath = $"deliveries/invoices/{fileName}";
        var dto = await _packingListService.AttachNfPdfAsync(id, nfNumber.Trim(), relativePath, cancellationToken);

        return Ok(dto);
    }

    [HttpGet("{id}/nf-pdfs")]
    public async Task<IActionResult> GetNfPdfs(int id, CancellationToken cancellationToken)
    {
        var nfPdfs = await _packingListService.GetNfPdfsAsync(id, cancellationToken);
        return Ok(nfPdfs);
    }

    [HttpGet("{id}/nf-pdfs/{nfPdfId:int}/file")]
    public async Task<IActionResult> GetNfPdfFile(int id, int nfPdfId, CancellationToken cancellationToken)
    {
        var pl = await _packingListService.GetByIdAsync(id, cancellationToken);
        if (pl is null) return NotFound();

        var nfPdf = pl.NfPdfs.FirstOrDefault(n => n.Id == nfPdfId);
        if (nfPdf is null || !nfPdf.HasPdf) return NotFound();

        var wwwroot = _env.WebRootPath ?? "wwwroot";
        // PdfPath é relativo; precisamos buscá-lo via repositório
        var nfPdfs = await _packingListService.GetNfPdfsAsync(id, cancellationToken);
        var nfDto = nfPdfs.FirstOrDefault(n => n.Id == nfPdfId);
        if (nfDto is null) return NotFound();

        // Reconstruímos o path pelo padrão {id}_{nfNumber}_*.pdf
        var invoicesFolder = Path.Combine(wwwroot, "deliveries", "invoices");
        var safeNf = string.Concat(nfDto.NfNumber.Split(Path.GetInvalidFileNameChars()));
        var file = Directory.GetFiles(invoicesFolder, $"{id}_{safeNf}_*.pdf").OrderByDescending(f => f).FirstOrDefault();
        if (file is null || !System.IO.File.Exists(file)) return NotFound();

        var downloadName = $"NF {nfDto.NfNumber} - {pl.CustomerName}.pdf";
        return PhysicalFile(file, "application/pdf", downloadName);
    }

    [HttpGet("{id}/nf-pdfs/{nfPdfId:int}/canhoto")]
    public async Task<IActionResult> GetNfCanhoto(int id, int nfPdfId, CancellationToken cancellationToken)
    {
        var pl = await _packingListService.GetByIdAsync(id, cancellationToken);
        if (pl is null) return NotFound();

        var nfPdf = pl.NfPdfs.FirstOrDefault(n => n.Id == nfPdfId);
        if (nfPdf is null || !nfPdf.HasCanhoto) return NotFound();

        // Buscamos o CanhotoPath pelo padrão de nome
        var wwwroot = _env.WebRootPath ?? "wwwroot";
        var safeCustomer = string.Concat(pl.CustomerName.Split(Path.GetInvalidFileNameChars()));
        var canhotoFileName = $"NF - {nfPdf.NfNumber} ({safeCustomer}).pdf";
        var fullPath = Path.Combine(wwwroot, "deliveries", "canhotos", canhotoFileName);

        if (!System.IO.File.Exists(fullPath)) return NotFound();

        return PhysicalFile(fullPath, "application/pdf", canhotoFileName);
    }

    [HttpPost("{id}/nf-pdfs/{nfPdfId:int}/generate-canhoto")]
    public async Task<IActionResult> GenerateNfCanhoto(int id, int nfPdfId, CancellationToken cancellationToken)
    {
        try
        {
            var pl = await _packingListService.GetByIdAsync(id, cancellationToken);
            if (pl is null) return NotFound();

            var nfPdf = pl.NfPdfs.FirstOrDefault(n => n.Id == nfPdfId);
            if (nfPdf is null || !nfPdf.HasPdf)
                return BadRequest(new { message = "PDF da NF não encontrado." });
            if (pl.DeliverySignaturePath is null)
                return BadRequest(new { message = "Romaneio ainda não foi entregue (sem assinatura)." });

            var wwwroot = _env.WebRootPath ?? "wwwroot";
            var canhotoRelPath = await GenerateNfCanhotoAsync(
                id, nfPdf.Id, nfPdf.NfNumber, pl.Code, pl.CustomerName,
                pl.DeliverySignaturePath, pl.DeliveredAt ?? DateTime.UtcNow, wwwroot);
            await _packingListService.SetNfPdfCanhotoAsync(nfPdfId, canhotoRelPath, cancellationToken);

            return Ok(new { path = canhotoRelPath });
        }
        catch (FileNotFoundException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/invoice-pdf")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadInvoicePdf(int id, IFormFile file, CancellationToken cancellationToken)
    {
        if (file == null || !file.ContentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Arquivo PDF é obrigatório" });

        var wwwroot = _env.WebRootPath ?? "wwwroot";
        var invoicesFolder = Path.Combine(wwwroot, "deliveries", "invoices");
        Directory.CreateDirectory(invoicesFolder);

        var fileName = $"{id}_{DateTime.UtcNow:yyyyMMddHHmmss}.pdf";
        var fullPath = Path.Combine(invoicesFolder, fileName);

       using (var stream = System.IO.File.Create(fullPath))
        await file.CopyToAsync(stream, cancellationToken);


        var relativePath = $"deliveries/invoices/{fileName}";
        await _packingListService.AttachInvoicePdfAsync(id, relativePath, cancellationToken);

        return Ok(new { path = relativePath });
    }

    [HttpGet("{id}/invoice-pdf")]
    public async Task<IActionResult> GetInvoicePdf(int id, CancellationToken cancellationToken)
    {
        var pl = await _packingListService.GetByIdAsync(id, cancellationToken);
        if (pl?.HasInvoicePdf != true) return NotFound();

        // Busca o path real da entidade — GetByIdAsync retorna o DTO que tem InvoicePdfPath via CanhotoPath
        // Vamos construir o path a partir do padrão known
        var wwwroot = _env.WebRootPath ?? "wwwroot";

        // Precisa do InvoicePdfPath — vamos adicionar ao DTO se necessário, mas por ora
        // buscamos todos os arquivos do padrão
        var folder = Path.Combine(wwwroot, "deliveries", "invoices");
        var file = Directory.GetFiles(folder, $"{id}_*.pdf").OrderByDescending(f => f).FirstOrDefault();
        if (file == null || !System.IO.File.Exists(file)) return NotFound();

        return PhysicalFile(file, "application/pdf");
    }

    [HttpGet("{id}/canhoto")]
    public async Task<IActionResult> GetCanhoto(int id, CancellationToken cancellationToken)
    {
        var pl = await _packingListService.GetByIdAsync(id, cancellationToken);
        if (pl?.CanhotoPath == null) return NotFound();

        var wwwroot = _env.WebRootPath ?? "wwwroot";
        var fullPath = Path.Combine(wwwroot, pl.CanhotoPath);
        if (!System.IO.File.Exists(fullPath)) return NotFound();

        return PhysicalFile(fullPath, "application/pdf", $"canhoto_{pl.Code}.pdf");
    }

    [HttpPost("{id}/generate-canhoto")]
    public async Task<IActionResult> GenerateCanhoto(int id, CancellationToken cancellationToken)
    {
        try
        {
            var pl = await _packingListService.GetByIdAsync(id, cancellationToken);
            if (pl is null) return NotFound();
            if (!pl.HasInvoicePdf) return BadRequest(new { message = "Nenhum PDF de NF anexado a este romaneio." });
            if (pl.DeliverySignaturePath is null) return BadRequest(new { message = "Romaneio ainda não foi entregue (sem assinatura)." });

            var wwwroot = _env.WebRootPath ?? "wwwroot";
            var canhotoRelPath = await GenerateCanhotoAsync(id, pl.Code, pl.CustomerName,
            pl.DeliverySignaturePath, pl.DeliveredAt ?? DateTime.UtcNow, wwwroot);
            await _packingListService.SetCanhotoAsync(id, canhotoRelPath, cancellationToken);

            return Ok(new { path = canhotoRelPath });
        }
        catch (FileNotFoundException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/location")]
    public async Task<IActionResult> UpdateDriverLocation(int id, [FromBody] UpdateDriverLocationDto dto, CancellationToken cancellationToken)
    {
        var packingList = await _packingListService.GetByIdAsync(id, cancellationToken);
        if (packingList is null) return NotFound();

        var location = new DriverLocationDto(id, packingList.Code, dto.DriverName, dto.Latitude, dto.Longitude, DateTime.UtcNow);
        PackingListHub.ActiveDrivers[id] = location;

        await _hubContext.Clients.All.SendAsync("DriverLocationUpdated", location);
        return Ok();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private async Task<string> GenerateCanhotoAsync(
    int id, string code, string customerName,
    string signatureRelPath, DateTime deliveryDate, string wwwroot)
{
    const float SigX = 160f, SigY = 764f, SigW = 260f, SigH = 62f;
    // "Data do Recebimento" fica à esquerda da assinatura no canhoto do DANFE
    const float DateX = 63f, DateY = 790f;

    var invoicesFolder = Path.Combine(wwwroot, "deliveries", "invoices");
    var nfFile = Directory.GetFiles(invoicesFolder, $"{id}_*.pdf").OrderByDescending(f => f).FirstOrDefault()
        ?? throw new FileNotFoundException("PDF da NF não encontrado");

    var canhotosDir = Path.Combine(wwwroot, "deliveries", "canhotos");
    Directory.CreateDirectory(canhotosDir);

    // Nome do arquivo: "NF - 5432 (Nome do Cliente).pdf"
    var safeCustomer = string.Concat(customerName.Split(Path.GetInvalidFileNameChars()));
    var canhotoFileName = $"NF - {code} ({safeCustomer}).pdf";
    var canhotoAbsPath = Path.Combine(canhotosDir, canhotoFileName);
    var sigAbsPath = Path.Combine(wwwroot, signatureRelPath);

    using var reader = new PdfReader(nfFile);
    using var writer = new PdfWriter(canhotoAbsPath);
    using var pdfDoc = new PdfDocument(reader, writer);

    var page = pdfDoc.GetFirstPage();
    var canvas = new PdfCanvas(page, true);
    var font = PdfFontFactory.CreateFont(StandardFonts.HELVETICA);

    // Assinatura
    var imageData = ImageDataFactory.Create(sigAbsPath);
    canvas.AddImageFittedIntoRectangle(imageData, new iText.Kernel.Geom.Rectangle(SigX, SigY, SigW, SigH), false);

    // Data de recebimento no campo "Data do Recebimento" do canhoto
    canvas.BeginText()
        .SetFontAndSize(font, 8f)
        .MoveText(DateX, DateY)
        .ShowText(deliveryDate.ToLocalTime().ToString("dd/MM/yyyy"))
        .EndText();

    // Hora e nome do arquivo (rodapé da célula de assinatura)
    canvas.BeginText()
        .SetFontAndSize(font, 7f)
        .MoveText(SigX + 2, SigY + 3)
        .ShowText(deliveryDate.ToLocalTime().ToString("dd/MM/yyyy HH:mm"))
        .EndText();

    canvas.Release();

    return $"deliveries/canhotos/{canhotoFileName}";
 }

    private async Task<string> GenerateNfCanhotoAsync(
        int packingListId, int nfPdfId, string nfNumber, string code, string customerName,
        string signatureRelPath, DateTime deliveryDate, string wwwroot)
    {
        const float SigX = 160f, SigY = 764f, SigW = 260f, SigH = 62f;
        const float DateX = 63f, DateY = 790f;

        var invoicesFolder = Path.Combine(wwwroot, "deliveries", "invoices");
        var safeNf = string.Concat(nfNumber.Split(Path.GetInvalidFileNameChars()));
        var nfFile = Directory.GetFiles(invoicesFolder, $"{packingListId}_{safeNf}_*.pdf")
                              .OrderByDescending(f => f)
                              .FirstOrDefault()
            ?? throw new FileNotFoundException($"PDF da NF {nfNumber} não encontrado");

        var canhotosDir = Path.Combine(wwwroot, "deliveries", "canhotos");
        Directory.CreateDirectory(canhotosDir);

        var safeCustomer = string.Concat(customerName.Split(Path.GetInvalidFileNameChars()));
        var canhotoFileName = $"NF - {nfNumber} ({safeCustomer}).pdf";
        var canhotoAbsPath = Path.Combine(canhotosDir, canhotoFileName);
        var sigAbsPath = Path.Combine(wwwroot, signatureRelPath);

        using var reader = new PdfReader(nfFile);
        using var writer = new PdfWriter(canhotoAbsPath);
        using var pdfDoc = new PdfDocument(reader, writer);

        var page = pdfDoc.GetFirstPage();
        var canvas = new PdfCanvas(page, true);
        var font = PdfFontFactory.CreateFont(StandardFonts.HELVETICA);

        var imageData = ImageDataFactory.Create(sigAbsPath);
        canvas.AddImageFittedIntoRectangle(imageData, new iText.Kernel.Geom.Rectangle(SigX, SigY, SigW, SigH), false);

        canvas.BeginText()
            .SetFontAndSize(font, 8f)
            .MoveText(DateX, DateY)
            .ShowText(deliveryDate.ToLocalTime().ToString("dd/MM/yyyy"))
            .EndText();

        canvas.BeginText()
            .SetFontAndSize(font, 7f)
            .MoveText(SigX + 2, SigY + 3)
            .ShowText(deliveryDate.ToLocalTime().ToString("dd/MM/yyyy HH:mm"))
            .EndText();

        canvas.Release();

        return $"deliveries/canhotos/{canhotoFileName}";
    }
}
// o código acima é o controller de PackingLists, que expõe endpoints para criar, consultar e atualizar romaneios. Ele também lida com upload de PDFs de NF, geração de canhotos com assinatura e localização de motoristas via SignalR.