namespace LogiMaster.Application.Interfaces;



public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string body, byte[]? attachment = null, string? attachmentName = null, CancellationToken ct = default);
    Task<IEnumerable<EmailMessage>> GetUnreadEmailsAsync(CancellationToken ct = default);
    Task<IEnumerable<EmailMessage>> GetEmailsWithAttachmentsAsync(string? subjectFilter = null, CancellationToken ct = default);
}

public record EmailMessage(
    string From,
    string Subject,
    string Body,
    DateTime Date,
    List<EmailAttachment> Attachments
);

public record EmailAttachment(
    string FileName,
    byte[] Content,
    string ContentType
);
