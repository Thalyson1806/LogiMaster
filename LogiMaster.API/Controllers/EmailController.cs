using Microsoft.AspNetCore.Mvc;
using LogiMaster.Application.Interfaces;

using Microsoft.AspNetCore.Authorization;

namespace LogiMaster.API.Controllers;

[Authorize(Policy = "Module.Email")]
[ApiController]
[Route("api/[controller]")]
public class EmailController : ControllerBase
{
    private readonly IEmailService _emailService;

    public EmailController(IEmailService emailService)
    {
        _emailService = emailService;
    }

    [HttpPost("send")]
    public async Task<IActionResult> SendEmail(
        [FromForm] string to,
        [FromForm] string subject,
        [FromForm] string body,
        CancellationToken ct)
    {
        try
        {
            await _emailService.SendEmailAsync(to, subject, body, ct: ct);
            return Ok(new { message = "Email enviado com sucesso!" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("send-with-attachment")]
    public async Task<IActionResult> SendEmailWithAttachment(
        [FromForm] string to,
        [FromForm] string subject,
        [FromForm] string body,
        [FromForm] IFormFile? attachment,
        CancellationToken ct)
    {
        try
        {
            byte[]? fileBytes = null;
            string? fileName = null;

            if (attachment != null)
            {
                using var ms = new MemoryStream();
                await attachment.CopyToAsync(ms, ct);
                fileBytes = ms.ToArray();
                fileName = attachment.FileName;
            }

            await _emailService.SendEmailAsync(to, subject, body, fileBytes, fileName, ct);
            return Ok(new { message = "Email enviado com sucesso!" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("inbox")]
    public async Task<IActionResult> GetInbox(CancellationToken ct)
    {
        try
        {
            var emails = await _emailService.GetUnreadEmailsAsync(ct);
            return Ok(emails.Select(e => new
            {
                e.From,
                e.Subject,
                e.Date,
                BodyPreview = e.Body.Length > 200 ? e.Body[..200] + "..." : e.Body,
                AttachmentCount = e.Attachments.Count,
                Attachments = e.Attachments.Select(a => new { a.FileName, a.ContentType })
            }));
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("inbox/edi")]
    public async Task<IActionResult> GetEdiEmails([FromQuery] string? subjectFilter, CancellationToken ct)
    {
        try
        {
            var emails = await _emailService.GetEmailsWithAttachmentsAsync(subjectFilter, ct);
            return Ok(emails.Select(e => new
            {
                e.From,
                e.Subject,
                e.Date,
                Attachments = e.Attachments.Select(a => new 
                { 
                    a.FileName, 
                    a.ContentType,
                    SizeKB = a.Content.Length / 1024
                })
            }));
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
