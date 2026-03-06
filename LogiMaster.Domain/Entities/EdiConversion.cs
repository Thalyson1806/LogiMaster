using LogiMaster.Domain.Enums;

namespace LogiMaster.Domain.Entities;

public class EdiConversion : BaseEntity
{
    public int EdiClientId { get; private set; }
    public int EdiRouteId { get; private set; }
    public string Code { get; private set; } = string.Empty;
    public DateTime ConvertedAt { get; private set; }
    public int? ConvertedById { get; private set; }
    public string InputFileName { get; private set; } = string.Empty;
    public string? OutputFileName { get; private set; }
    public DateTime? StartDate { get; private set; }
    public DateTime? EndDate { get; private set; }
    public int TotalProductsProcessed { get; private set; }
    public int TotalLinesGenerated { get; private set; }
    public int ProductsNotFound { get; private set; }
    public EdiConversionStatus Status { get; private set; }
    public string? ErrorMessage { get; private set; }
    public string? Notes { get; private set; }

    // Navigation
    public virtual EdiClient Client { get; private set; } = null!;
    public virtual EdiRoute Route { get; private set; } = null!;
    public virtual User? ConvertedBy { get; private set; }

    protected EdiConversion() { }

    public EdiConversion(int ediClientId, int ediRouteId, string inputFileName, int? convertedById)
    {
        EdiClientId = ediClientId;
        EdiRouteId = ediRouteId;
        Code = GenerateCode();
        InputFileName = inputFileName;
        ConvertedById = convertedById;
        ConvertedAt = DateTime.UtcNow;
        Status = EdiConversionStatus.Pending;
    }

    private static string GenerateCode()
    {
        return $"EDI{DateTime.UtcNow:yyyyMMddHHmmss}{new Random().Next(100, 999)}";
    }

    public void SetDates(DateTime? startDate, DateTime? endDate)
    {
        StartDate = startDate;
        EndDate = endDate;
        MarkUpdated();
    }

    public void StartProcessing()
    {
        Status = EdiConversionStatus.Processing;
        MarkUpdated();
    }

    public void Complete(string outputFileName, int totalProcessed, int totalLines, int notFound)
    {
        OutputFileName = outputFileName;
        TotalProductsProcessed = totalProcessed;
        TotalLinesGenerated = totalLines;
        ProductsNotFound = notFound;
        Status = notFound > 0 ? EdiConversionStatus.CompletedWithWarnings : EdiConversionStatus.Completed;
        MarkUpdated();
    }

    public void SetError(string errorMessage)
    {
        ErrorMessage = errorMessage;
        Status = EdiConversionStatus.Error;
        MarkUpdated();
    }

    public void SetNotes(string? notes)
    {
        Notes = notes?.Trim();
        MarkUpdated();
    }
}
