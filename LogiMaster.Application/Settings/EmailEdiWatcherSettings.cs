namespace LogiMaster.Application.Settings;

public class EmailEdiWatcherSettings
{
    public bool Enabled { get; set; } = false;
    public int PollingIntervalMinutes { get; set; } = 5;
    public string SpreadsheetFolder { get; set; } = @"C:\EDI\Planilhas";
    public bool DeleteAfterDownload { get; set; } = false;
}
