using MailKit.Net.Smtp;
using MailKit.Net.Pop3;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Options;
using LogiMaster.Application.Interfaces;
using LogiMaster.Application.Settings;

namespace LogiMaster.Application.Services;

public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;

    public EmailService(IOptions<EmailSettings> settings)
    {
        _settings = settings.Value;
    }

    public async Task SendEmailAsync(string to, string subject, string body, byte[]? attachment = null, string? attachmentName = null, CancellationToken ct = default)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_settings.FromName, _settings.FromEmail));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;

        var builder = new BodyBuilder { HtmlBody = body };

        if (attachment != null && !string.IsNullOrEmpty(attachmentName))
        {
            builder.Attachments.Add(attachmentName, attachment);
        }

        message.Body = builder.ToMessageBody();

        using var client = new SmtpClient();
        
        var secureOption = _settings.SmtpUseSsl 
            ? SecureSocketOptions.SslOnConnect 
            : SecureSocketOptions.StartTls;
            
        await client.ConnectAsync(_settings.SmtpHost, _settings.SmtpPort, secureOption, ct);
        await client.AuthenticateAsync(_settings.SmtpUser, _settings.SmtpPassword, ct);
        await client.SendAsync(message, ct);
        await client.DisconnectAsync(true, ct);
    }

    public async Task<IEnumerable<EmailMessage>> GetUnreadEmailsAsync(CancellationToken ct = default)
    {
        var messages = new List<EmailMessage>();

        using var client = new Pop3Client();
        
        var secureOption = _settings.Pop3UseSsl 
            ? SecureSocketOptions.SslOnConnect 
            : SecureSocketOptions.Auto;
            
        await client.ConnectAsync(_settings.Pop3Host, _settings.Pop3Port, secureOption, ct);
        await client.AuthenticateAsync(_settings.Pop3User, _settings.Pop3Password, ct);

        var count = client.Count;
        
        // Pega os últimos 10 emails
        var start = Math.Max(0, count - 10);
        for (int i = start; i < count; i++)
        {
            var message = await client.GetMessageAsync(i, ct);
            var attachments = new List<EmailAttachment>();

            foreach (var att in message.Attachments)
            {
                if (att is MimePart part)
                {
                    using var ms = new MemoryStream();
                    await part.Content.DecodeToAsync(ms, ct);
                    attachments.Add(new EmailAttachment(
                        part.FileName ?? "attachment",
                        ms.ToArray(),
                        part.ContentType.MimeType
                    ));
                }
            }

            messages.Add(new EmailMessage(
                message.From.ToString(),
                message.Subject ?? "(sem assunto)",
                message.TextBody ?? message.HtmlBody ?? "",
                message.Date.DateTime,
                attachments
            ));
        }

        await client.DisconnectAsync(true, ct);
        return messages;
    }

    public async Task<IEnumerable<EmailMessage>> GetEmailsWithAttachmentsAsync(string? subjectFilter = null, CancellationToken ct = default)
    {
        var allEmails = await GetUnreadEmailsAsync(ct);
        
        return allEmails.Where(e => 
            e.Attachments.Count > 0 && 
            (string.IsNullOrEmpty(subjectFilter) || e.Subject.Contains(subjectFilter, StringComparison.OrdinalIgnoreCase))
        );
    }
}
