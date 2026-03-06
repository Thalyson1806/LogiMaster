namespace LogiMaster.Application.Settings;

public class EmailSettings
{
    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public string SmtpUser { get; set; } = string.Empty;
    public string SmtpPassword { get; set; } = string.Empty;
    public bool SmtpUseSsl { get; set; } = false;
    
    public string Pop3Host { get; set; } = string.Empty;
    public int Pop3Port { get; set; } = 995;
    public string Pop3User { get; set; } = string.Empty;
    public string Pop3Password { get; set; } = string.Empty;
    public bool Pop3UseSsl { get; set; } = true;
    
    public string FromEmail { get; set; } = string.Empty;
    public string FromName { get; set; } = string.Empty;
}
