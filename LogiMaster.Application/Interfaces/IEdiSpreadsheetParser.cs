namespace LogiMaster.Application.Interfaces;

public interface IEdiSpreadsheetParser
{
    string ClientCode { get; }
    bool CanHandle(string clientCode);
    Task<EdiParseResult> ParseAsync(Stream fileStream, string fileName, EdiParseOptions options, CancellationToken cancellationToken = default);
}

public record EdiParseOptions(
    int ClientId,
    int RouteId,
    string RouteType,
    int? FrequencyDays,
    int? FrequencyPerWeek,
    string? DaysOfWeekJson,
    DateTime? StartDate,
    DateTime? EndDate
);

public record EdiParseResult(
    bool Success,
    List<EdiParsedLine> Lines,
    List<string> Warnings,
    string? ErrorMessage
);

public record EdiParsedLine(
    string ProductCode,
    string? ProductDescription,
    decimal Quantity,
    DateTime DeliveryDate,
    string? Reference,
    decimal? UnitValue
);