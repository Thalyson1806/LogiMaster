namespace LogiMaster.Domain.Entities;

using LogiMaster.Domain.Enums;

public class EdifactFile : BaseEntity
{
    public int CustomerId { get; private set; }
    public string FileName { get; private set; } = string.Empty;
    public string OriginalFileName { get; private set; } = string.Empty;
    public EdifactMessageType MessageType { get; private set; }
    public EdifactFileStatus Status { get; private set; }
    public DateTime ReceivedAt { get; private set; }
    public DateTime? ProcessedAt { get; private set; }
    public string? ErrorMessage { get; private set; }
    public int TotalSegments { get; private set; }
    public int TotalItemsProcessed { get; private set; }
    public int TotalItemsWithError { get; private set; }
    public string? RawContent { get; private set; }

    // Navigation
    public virtual Customer Customer { get; private set; } = null!;
    public virtual ICollection<EdifactItem> Items { get; private set; } = new List<EdifactItem>();

    protected EdifactFile() { }

    public EdifactFile(int customerId, string fileName, string originalFileName, EdifactMessageType messageType)
    {
        if (customerId <= 0)
            throw new ArgumentException("CustomerId is required", nameof(customerId));
        if (string.IsNullOrWhiteSpace(fileName))
            throw new ArgumentException("FileName is required", nameof(fileName));

        CustomerId = customerId;
        FileName = fileName;
        OriginalFileName = originalFileName;
        MessageType = messageType;
        Status = EdifactFileStatus.Pending;
        ReceivedAt = DateTime.UtcNow;
    }

    public void SetRawContent(string content)
    {
        RawContent = content;
        TotalSegments = content.Split('\'').Length;
    }

    public void StartProcessing()
    {
        Status = EdifactFileStatus.Processing;
        MarkUpdated();
    }

    public void CompleteProcessing(int itemsProcessed, int itemsWithError)
    {
        TotalItemsProcessed = itemsProcessed;
        TotalItemsWithError = itemsWithError;
        ProcessedAt = DateTime.UtcNow;
        Status = itemsWithError > 0 ? EdifactFileStatus.PartialError : EdifactFileStatus.Completed;
        MarkUpdated();
    }

    public void SetError(string errorMessage)
    {
        Status = EdifactFileStatus.Error;
        ErrorMessage = errorMessage;
        ProcessedAt = DateTime.UtcNow;
        MarkUpdated();
    }

    public void AddItem(EdifactItem item)
    {
        Items.Add(item);
    }
}
