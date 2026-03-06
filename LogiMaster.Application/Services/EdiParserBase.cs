using LogiMaster.Application.Interfaces;
using OfficeOpenXml;

namespace LogiMaster.Application.Services.Parsers;

public abstract class EdiParserBase : IEdiSpreadsheetParser
{
    public abstract string ClientCode { get; }

    public virtual bool CanHandle(string clientCode)
    {
        return ClientCode.Equals(clientCode, StringComparison.OrdinalIgnoreCase);
    }

    public abstract Task<EdiParseResult> ParseAsync(
        Stream fileStream, 
        string fileName, 
        EdiParseOptions options, 
        CancellationToken cancellationToken = default);

    protected static List<DateTime> GetDeliveryDates(EdiParseOptions options, int count)
    {
        var dates = new List<DateTime>();
        var baseDate = options.StartDate ?? DateTime.Today;

        if (options.FrequencyDays.HasValue)
        {
            // Dias corridos
            for (int i = 0; i < count; i++)
            {
                dates.Add(baseDate.AddDays(i * options.FrequencyDays.Value));
            }
        }
        else if (!string.IsNullOrEmpty(options.DaysOfWeekJson))
        {
            // Dias específicos da semana
            var daysOfWeek = System.Text.Json.JsonSerializer.Deserialize<List<int>>(options.DaysOfWeekJson) ?? new List<int>();
            var currentDate = baseDate;
            
            while (dates.Count < count)
            {
                if (daysOfWeek.Contains((int)currentDate.DayOfWeek))
                {
                    dates.Add(currentDate);
                }
                currentDate = currentDate.AddDays(1);
            }
        }
        else
        {
            // Default: semanal
            for (int i = 0; i < count; i++)
            {
                dates.Add(baseDate.AddDays(i * 7));
            }
        }

        return dates;
    }

    protected static decimal ParseQuantity(object? value)
    {
        if (value == null) return 0;
        
        if (value is double d) return (decimal)d;
        if (value is decimal dec) return dec;
        if (value is int i) return i;

        var str = value.ToString()?.Replace(".", "").Replace(",", ".").Trim() ?? "0";
        return decimal.TryParse(str, System.Globalization.NumberStyles.Any, 
            System.Globalization.CultureInfo.InvariantCulture, out var result) ? result : 0;
    }
}
