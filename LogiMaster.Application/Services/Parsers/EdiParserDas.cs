using LogiMaster.Application.Interfaces;
using OfficeOpenXml;

namespace LogiMaster.Application.Services.Parsers;

/// <summary>
/// Parser DAS: Excel com blocos FIRME/PREVISÃO
/// - Coluna A: Código do produto
/// - Bloco FIRME (coluna G): quantidades confirmadas
/// - Bloco PREVISÃO (colunas H+): quantidades previstas por mês
/// - Regras: dia limite 25, não entrega últimos 2 dias do mês
/// </summary>
public class EdiParserDas : EdiParserBase
{
    public override string ClientCode => "DAS";

    private const int DIA_LIMITE = 25;
    private const int DIAS_EXCLUIR_FIM_MES = 2;

    public EdiParserDas()
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
            var colCount = worksheet.Dimension?.Columns ?? 0;

            if (rowCount == 0)
            {
                return new EdiParseResult(false, lines, warnings, "Planilha vazia");
            }

            // Detectar estrutura dos blocos na primeira linha
            var blocos = DetectarBlocos(worksheet, colCount);
            
            if (blocos.Count == 0)
            {
                warnings.Add("Nenhum bloco FIRME/PREVISÃO encontrado, usando colunas padrão");
                blocos.Add(new BlocoMes("FIRME", 7, DateTime.Today)); // Coluna G default
            }

            // Calcular datas de entrega baseado no roteiro
            var datasEntrega = CalcularDatasEntrega(options);

            // Processar produtos (começa na linha 2)
            for (int row = 2; row <= rowCount; row++)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var codigo = worksheet.Cells[row, 1].Value?.ToString()?.Trim(); // Coluna A
                if (string.IsNullOrWhiteSpace(codigo)) continue;

                // Somar quantidades de todos os blocos
                decimal totalQuantidade = 0;
                foreach (var bloco in blocos)
                {
                    var qtd = ParseQuantity(worksheet.Cells[row, bloco.Coluna].Value);
                    totalQuantidade += qtd;
                }

                if (totalQuantidade <= 0) continue;

                // Dividir quantidade pelas datas de entrega
                if (datasEntrega.Count > 0)
                {
                    var qtdPorEntrega = Math.Round(totalQuantidade / datasEntrega.Count, 2);

                    foreach (var data in datasEntrega)
                    {
                        lines.Add(new EdiParsedLine(
                            ProductCode: codigo,
                            ProductDescription: null,
                            Quantity: qtdPorEntrega,
                            DeliveryDate: data,
                            Reference: null,
                            UnitValue: null
                        ));
                    }
                }
                else
                {
                    // Se não há datas calculadas, usar data base
                    lines.Add(new EdiParsedLine(
                        ProductCode: codigo,
                        ProductDescription: null,
                        Quantity: totalQuantidade,
                        DeliveryDate: options.StartDate ?? DateTime.Today.AddDays(7),
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

    private static List<BlocoMes> DetectarBlocos(ExcelWorksheet worksheet, int colCount)
    {
        var blocos = new List<BlocoMes>();

        // Procurar na primeira linha por marcadores FIRME e PREVISÃO
        for (int col = 1; col <= colCount; col++)
        {
            var header = worksheet.Cells[1, col].Value?.ToString()?.ToUpper().Trim();
            if (string.IsNullOrEmpty(header)) continue;

            if (header.Contains("FIRME"))
            {
                blocos.Add(new BlocoMes("FIRME", col, DateTime.Today));
            }
            else if (header.Contains("PREVIS") || header.Contains("PREV"))
            {
                // Tentar extrair mês do cabeçalho
                var mes = ExtrairMesDoHeader(header);
                blocos.Add(new BlocoMes("PREVISAO", col, mes));
            }
            // Detectar nomes de meses
            else if (TryParseMes(header, out var mesData))
            {
                blocos.Add(new BlocoMes(header, col, mesData));
            }
        }

        return blocos;
    }

    private static bool TryParseMes(string header, out DateTime mesData)
    {
        mesData = DateTime.Today;
        var meses = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
        {
            { "JAN", 1 }, { "JANEIRO", 1 },
            { "FEV", 2 }, { "FEVEREIRO", 2 },
            { "MAR", 3 }, { "MARCO", 3 }, { "MARÇO", 3 },
            { "ABR", 4 }, { "ABRIL", 4 },
            { "MAI", 5 }, { "MAIO", 5 },
            { "JUN", 6 }, { "JUNHO", 6 },
            { "JUL", 7 }, { "JULHO", 7 },
            { "AGO", 8 }, { "AGOSTO", 8 },
            { "SET", 9 }, { "SETEMBRO", 9 },
            { "OUT", 10 }, { "OUTUBRO", 10 },
            { "NOV", 11 }, { "NOVEMBRO", 11 },
            { "DEZ", 12 }, { "DEZEMBRO", 12 }
        };

        foreach (var kvp in meses)
        {
            if (header.Contains(kvp.Key))
            {
                var ano = DateTime.Today.Year;
                if (kvp.Value < DateTime.Today.Month)
                    ano++; // Próximo ano se mês já passou
                
                mesData = new DateTime(ano, kvp.Value, 1);
                return true;
            }
        }

        return false;
    }

    private static DateTime ExtrairMesDoHeader(string header)
    {
        if (TryParseMes(header, out var mes))
            return mes;
        
        return DateTime.Today.AddMonths(1); // Default: próximo mês
    }

    private List<DateTime> CalcularDatasEntrega(EdiParseOptions options)
    {
        var datas = new List<DateTime>();
        var inicio = options.StartDate ?? DateTime.Today;
        var fim = options.EndDate ?? new DateTime(inicio.Year, inicio.Month, 
            DateTime.DaysInMonth(inicio.Year, inicio.Month));

        // Aplicar regra: excluir últimos X dias do mês
        var ultimoDiaPermitido = new DateTime(fim.Year, fim.Month, 
            Math.Max(1, DateTime.DaysInMonth(fim.Year, fim.Month) - DIAS_EXCLUIR_FIM_MES));

        if (fim > ultimoDiaPermitido)
            fim = ultimoDiaPermitido;

        // Aplicar regra: dia limite
        if (inicio.Day > DIA_LIMITE)
        {
            // Começar no próximo mês
            inicio = new DateTime(inicio.Year, inicio.Month, 1).AddMonths(1);
        }

        // Calcular datas baseado na frequência
        if (options.FrequencyPerWeek.HasValue && options.FrequencyPerWeek.Value > 0)
        {
            // X dias por semana
            var diasPorSemana = options.FrequencyPerWeek.Value;
            var current = inicio;
            var diasNaSemana = 0;

            while (current <= fim)
            {
                // Dias úteis (Seg-Sex)
                if (current.DayOfWeek >= DayOfWeek.Monday && current.DayOfWeek <= DayOfWeek.Friday)
                {
                    if (diasNaSemana < diasPorSemana)
                    {
                        datas.Add(current);
                        diasNaSemana++;
                    }
                }

                // Reset contador na segunda
                if (current.DayOfWeek == DayOfWeek.Sunday)
                    diasNaSemana = 0;

                current = current.AddDays(1);
            }
        }
        else if (!string.IsNullOrEmpty(options.DaysOfWeekJson))
        {
            // Dias específicos da semana
            var diasSemana = System.Text.Json.JsonSerializer.Deserialize<List<int>>(options.DaysOfWeekJson) ?? new();
            var current = inicio;

            while (current <= fim)
            {
                if (diasSemana.Contains((int)current.DayOfWeek))
                {
                    datas.Add(current);
                }
                current = current.AddDays(1);
            }
        }
        else if (options.FrequencyDays.HasValue)
        {
            // A cada X dias
            var current = inicio;
            while (current <= fim)
            {
                datas.Add(current);
                current = current.AddDays(options.FrequencyDays.Value);
            }
        }
        else
        {
            // Default: todos os dias úteis
            var current = inicio;
            while (current <= fim)
            {
                if (current.DayOfWeek >= DayOfWeek.Monday && current.DayOfWeek <= DayOfWeek.Friday)
                {
                    datas.Add(current);
                }
                current = current.AddDays(1);
            }
        }

        return datas;
    }

    private record BlocoMes(string Nome, int Coluna, DateTime Mes);
}
