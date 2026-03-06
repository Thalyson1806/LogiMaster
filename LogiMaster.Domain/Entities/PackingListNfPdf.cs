namespace LogiMaster.Domain.Entities;

public class PackingListNfPdf : BaseEntity
{
    public int PackingListId { get; private set; }
    public string NfNumber { get; private set; } = string.Empty;
    public string PdfPath { get; private set; } = string.Empty;
    public string? CanhotoPath { get; private set; }
    public DateTime UploadedAt { get; private set; }

    public virtual PackingList PackingList { get; private set; } = null!;

    protected PackingListNfPdf() { }

    public PackingListNfPdf(int packingListId, string nfNumber, string pdfPath)
    {
        PackingListId = packingListId;
        NfNumber = nfNumber.Trim();
        PdfPath = pdfPath;
        UploadedAt = DateTime.UtcNow;
    }

    public void SetCanhoto(string canhotoPath)
    {
        CanhotoPath = canhotoPath;
        MarkUpdated();
    }
}
