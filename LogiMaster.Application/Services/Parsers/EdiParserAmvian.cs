using LogiMaster.Application.Interfaces;
using OfficeOpenXml;

namespace LogiMaster.Application.Services.Parsers;

/// <summary>
/// Parser AMVIAN: Excel simples
/// - Coluna A: Código do produto
/// - Coluna B: Quantidade
/// - Entrega: todas as sextas-feiras
/// </summary>
public class EdiParserAmvian : EdiParserBase
{
    public override string ClientCode => "AMVIAN";

    public EdiParserAmvian()
    {
        ExcelPackage.License.SetNonCommercialPersonal("LogiMaster");
    }

    public override async Task<EdiParseResult> ParseAsync(
        Stream fileStream,
        string fileName,
        EdiParseOptions options,
        CancellationToken cancellationToken = default)
    {
        var lines = new List<EdiParsedLine>();
        var warnings = new List<string>();

        try
        {
            using var package = new ExcelPackage(fileStream);
            var worksheet = package.Workbook.Worksheets.FirstOrDefault();

            if (worksheet == null)
            {
                return new EdiParseResult(false, lines, warnings, "Planilha não encontrada");
            }

            var rowCount = worksheet.Dimension?.Rows ?? 0;
            if (rowCount == 0)
            {
                return new EdiParseResult(false, lines, warnings, "Planilha vazia");
            }

            // Calcular datas de entrega (sextas-feiras do mês)
            var deliveryDates = GetFridaysOfMonth(options.StartDate ?? DateTime.Today, options.EndDate);

            // Ler produtos (começa na linha 2, assumindo cabeçalho)
            for (int row = 2; row <= rowCount; row++)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var codigo = worksheet.Cells[row, 1].Value?.ToString()?.Trim(); // Coluna A
                var quantidade = ParseQuantity(worksheet.Cells[row, 2].Value);   // Coluna B

                if (string.IsNullOrWhiteSpace(codigo) || quantidade <= 0)
                    continue;

                // Dividir quantidade pelas sextas-feiras
                var qtdPorEntrega = deliveryDates.Count > 0 
                    ? Math.Round(quantidade / deliveryDates.Count, 2) 
                    : quantidade;

                foreach (var date in deliveryDates)
                {
                    lines.Add(new EdiParsedLine(
                        ProductCode: codigo,
                        ProductDescription: null,
                        Quantity: qtdPorEntrega,
                        DeliveryDate: date,
                        Reference: null,
                        UnitValue: null
                    ));
                }
            }

            if (lines.Count == 0)
            {
                warnings.Add("Nenhum produto válido encontrado na planilha");
            }

            return new EdiParseResult(true, lines, warnings, null);
        }
        catch (Exception ex)
        {
            return new EdiParseResult(false, lines, warnings, $"Erro ao processar: {ex.Message}");
        }
    }

    private static List<DateTime> GetFridaysOfMonth(DateTime startDate, DateTime? endDate)
    {
        var fridays = new List<DateTime>();
        var end = endDate ?? new DateTime(startDate.Year, startDate.Month, DateTime.DaysInMonth(startDate.Year, startDate.Month));

        var current = startDate;
        while (current <= end)
        {
            if (current.DayOfWeek == DayOfWeek.Friday)
            {
                fridays.Add(current);
            }
            current = current.AddDays(1);
        }

        return fridays;
    }
}
