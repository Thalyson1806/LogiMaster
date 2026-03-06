using LogiMaster.Application.Interfaces;
using System.Text.RegularExpressions;

namespace LogiMaster.Application.Services.Parsers;

/// <summary>
/// Parser COPO: Arquivo TXT
/// - Código: sequência de 6 dígitos
/// - Palavra "De" indica início das datas
/// - Formato data: dd/MM/yy
/// - Quantidade ao lado da data
/// - Entrega: terça e sexta
/// </summary>
public class EdiParserCopo : EdiParserBase
{
    public override string ClientCode => "COPO";

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
            using var reader = new StreamReader(fileStream);
            var content = await reader.ReadToEndAsync(cancellationToken);
            var linhas = content.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);

            string? codigoProdutoAtual = null;
            var quantidadesPorSemana = new Dictionary<string, decimal>();

            foreach (var linha in linhas)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var linhaLimpa = linha.Trim();
                if (string.IsNullOrEmpty(linhaLimpa)) continue;

                // Procurar código do produto (6 dígitos)
                var matchCodigo = Regex.Match(linhaLimpa, @"\b(\d{6})\b");
                if (matchCodigo.Success)
                {
                    // Salvar produto anterior se houver
                    if (codigoProdutoAtual != null && quantidadesPorSemana.Count > 0)
                    {
                        ProcessarProduto(codigoProdutoAtual, quantidadesPorSemana, lines, options);
                        quantidadesPorSemana.Clear();
                    }

                    codigoProdutoAtual = matchCodigo.Groups[1].Value;
                    continue;
                }

                // Procurar datas e quantidades (formato: dd/MM/yy seguido de número)
                var matchDatas = Regex.Matches(linhaLimpa, @"(\d{2}/\d{2}/\d{2})\s+(\d+[,.]?\d*)");
                foreach (Match match in matchDatas)
                {
                    if (DateTime.TryParseExact(match.Groups[1].Value, "dd/MM/yy",
                        System.Globalization.CultureInfo.InvariantCulture,
                        System.Globalization.DateTimeStyles.None, out var data))
                    {
                        var qtd = ParseQuantity(match.Groups[2].Value);
                        var weekKey = GetWeekKey(data);
                        
                        if (!quantidadesPorSemana.ContainsKey(weekKey))
                            quantidadesPorSemana[weekKey] = 0;
                        
                        quantidadesPorSemana[weekKey] += qtd;
                    }
                }
            }

            // Processar último produto
            if (codigoProdutoAtual != null && quantidadesPorSemana.Count > 0)
            {
                ProcessarProduto(codigoProdutoAtual, quantidadesPorSemana, lines, options);
            }

            if (lines.Count == 0)
            {
                warnings.Add("Nenhum produto válido encontrado no arquivo TXT");
            }

            return new EdiParseResult(true, lines, warnings, null);
        }
        catch (Exception ex)
        {
            return new EdiParseResult(false, lines, warnings, $"Erro ao processar TXT: {ex.Message}");
        }
    }

    private static void ProcessarProduto(
        string codigo,
        Dictionary<string, decimal> quantidadesPorSemana,
        List<EdiParsedLine> lines,
        EdiParseOptions options)
    {
        foreach (var kvp in quantidadesPorSemana)
        {
            var weekDates = ParseWeekKey(kvp.Key);
            var qtdPorEntrega = Math.Round(kvp.Value / 2, 2); // Divide por 2 (terça e sexta)

            // Terça
            var terca = GetNextDayOfWeek(weekDates.startOfWeek, DayOfWeek.Tuesday);
            lines.Add(new EdiParsedLine(codigo, null, qtdPorEntrega, terca, null, null));

            // Sexta
            var sexta = GetNextDayOfWeek(weekDates.startOfWeek, DayOfWeek.Friday);
            lines.Add(new EdiParsedLine(codigo, null, qtdPorEntrega, sexta, null, null));
        }
    }

    private static string GetWeekKey(DateTime date)
    {
        var startOfWeek = date.AddDays(-(int)date.DayOfWeek + 1); // Segunda
        return $"{startOfWeek:yyyy-MM-dd}";
    }

    private static (DateTime startOfWeek, int weekNum) ParseWeekKey(string key)
    {
        var date = DateTime.Parse(key);
        return (date, 0);
    }

    private static DateTime GetNextDayOfWeek(DateTime startOfWeek, DayOfWeek dayOfWeek)
    {
        var daysToAdd = ((int)dayOfWeek - (int)startOfWeek.DayOfWeek + 7) % 7;
        return startOfWeek.AddDays(daysToAdd);
    }
}
