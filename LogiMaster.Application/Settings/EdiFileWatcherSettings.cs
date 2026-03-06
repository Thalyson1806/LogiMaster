namespace LogiMaster.Application.Settings;

public class EdiFileWatcherSettings
{
    
    public string WatchFolder { get; set; } = @"C:\EDI\Entrada";
    public string ProcessedFolder { get; set; } = @"C:\EDI\Processados";
    public string ErrorFolder { get; set; } = @"C:\EDI\Erros";
    public int DefaultCustomerId { get; set; } = 1;
    public int PollingIntervalSeconds { get; set; } = 30;
    public bool Enabled { get; set; } = true;
}