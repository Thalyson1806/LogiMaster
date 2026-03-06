using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using LogiMaster.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace LogiMaster.Infrastructure.Edifact;

/// <summary>
/// Parser para formato RND/ANFAVEA (padrão brasileiro automotivo).
/// Registros de largura fixa:
///   ITP - Header do arquivo (remetente, destinatário, data)
///   PE1 - Header do item (código produto, unidade, casas decimais)
///   PE2 - Última entrega
///   PE3 - Programação de entregas (7 pares data+quantidade por linha)
///   PE4 - Totais
///   PE5 - Referências (correspondem às datas do PE3)
///   TE1 - Trailer do item
///   FTP - Trailer do arquivo
///
/// Suporta dois layouts de PE1:
///   Padrão (ex: BENTELER): buyer code em 3..15 (12 chars alfanumérico)
///   Estendido (ex: Polimetri): 3..15 é numérico (Fab/Loc+seq),
///     buyer code real em 36..66, seller code em 66..96
/// </summary>
public class RndParser : IEdifactParser
{
    private readonly ILogger<RndParser> _logger;

    public EdifactMessageType MessageType => EdifactMessageType.RND;

    public RndParser(ILogger<RndParser> logger)
    {
        _logger = logger;
    }

    public ParsedEdifactResult Parse(string content)
    {
        var items = new List<ParsedEdifactItem>();
        var header = new Dictionary<string, string>();

        try
        {
            var lines = content.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);

            _logger.LogInformation("Parsing RND/ANFAVEA with {LineCount} lines", lines.Length);

            string? currentProductCode = null;
            string? currentSellerCode = null;
            int decimalPlaces = 0;
            string? unitOfMeasure = null;
            string? documentNumber = null;
            string? senderName = null;
            int lineNumber = 0;
            var deliveryEntries = new List<(DateTime Date, decimal Qty)>();

            foreach (var rawLine in lines)
            {
                var line = rawLine.TrimEnd();
                if (line.Length < 3) continue;

                var recordType = line[..3];

                switch (recordType)
                {
                    case "ITP":
                        ParseItp(line, header);
                        documentNumber = header.GetValueOrDefault("DocumentNumber");
                        senderName = header.GetValueOrDefault("SenderName");
                        break;

                    case "PE1":
                        FlushItem(ref currentProductCode, ref currentSellerCode, deliveryEntries, items,
                            unitOfMeasure, senderName, documentNumber, ref lineNumber);

                        (currentProductCode, currentSellerCode) = ParsePe1ProductCodes(line);
                        (unitOfMeasure, decimalPlaces) = ParsePe1UnitInfo(line);

                        _logger.LogDebug("PE1: BuyerCode={Buyer}, SellerCode={Seller}, Unit={Unit}, Dec={Dec}",
                            currentProductCode, currentSellerCode, unitOfMeasure, decimalPlaces);
                        break;

                    case "PE3":
                        var entries = ParsePe3(line, decimalPlaces);
                        deliveryEntries.AddRange(entries);
                        break;

                    case "TE1":
                        FlushItem(ref currentProductCode, ref currentSellerCode, deliveryEntries, items,
                            unitOfMeasure, senderName, documentNumber, ref lineNumber);
                        break;

                    case "FTP":
                        FlushItem(ref currentProductCode, ref currentSellerCode, deliveryEntries, items,
                            unitOfMeasure, senderName, documentNumber, ref lineNumber);
                        break;

                    // PE2, PE4, PE5 - não precisamos processar
                }
            }

            // Segurança: flush final
            FlushItem(ref currentProductCode, ref currentSellerCode, deliveryEntries, items,
                unitOfMeasure, senderName, documentNumber, ref lineNumber);

            _logger.LogInformation("Parsed {ItemCount} delivery entries from RND", items.Count);

            return new ParsedEdifactResult(true, null, items, header);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing RND content");
            return new ParsedEdifactResult(false, ex.Message, items, header);
        }
    }

    /// <summary>
    /// Salva todas as entregas do item atual como ParsedEdifactItem.
    /// Cada par data+quantidade vira um item separado.
    /// </summary>
    private static void FlushItem(
        ref string? productCode,
        ref string? sellerCode,
        List<(DateTime Date, decimal Qty)> deliveryEntries,
        List<ParsedEdifactItem> items,
        string? unit, string? location, string? docNumber,
        ref int lineNumber)
    {
        if (productCode == null || deliveryEntries.Count == 0) return;

        foreach (var entry in deliveryEntries)
        {
            if (entry.Qty <= 0) continue;

            lineNumber++;
            items.Add(new ParsedEdifactItem(
                ItemCode: productCode,
                BuyerItemCode: productCode,
                SupplierItemCode: sellerCode,
                Description: null,
                Quantity: entry.Qty,
                UnitOfMeasure: unit,
                DeliveryStart: entry.Date,
                DeliveryEnd: entry.Date,
                DeliveryLocation: location,
                DocumentNumber: docNumber,
                LineNumber: lineNumber
            ));
        }

        productCode = null;
        sellerCode = null;
        deliveryEntries.Clear();
    }

    /// <summary>
    /// Extrai informações do header ITP.
    /// ITP contém: versão, nº documento, data, hora, CNPJs, nomes das empresas.
    /// Os nomes ficam nos últimos ~59 chars: remetente(25) + destinatário(25) + padding(9).
    /// </summary>
    private void ParseItp(string line, Dictionary<string, string> header)
    {
        try
        {
            // Versão: pos 4-6
            if (line.Length >= 6)
                header["Version"] = line[3..6];

            // Número do documento: pos 7-13
            if (line.Length >= 13)
                header["DocumentNumber"] = line[6..13].Trim();

            // Data: pos 14-19 (YYMMDD)
            if (line.Length >= 19)
            {
                var dateStr = line[13..19];
                if (DateTime.TryParseExact("20" + dateStr, "yyyyMMdd", null,
                    System.Globalization.DateTimeStyles.None, out var dt))
                {
                    header["DocumentDate"] = dt.ToString("yyyy-MM-dd");
                }
            }

            // Hora: pos 20-23 (HHMM)
            if (line.Length >= 23)
                header["DocumentTime"] = line[19..23];

            // Nomes das empresas (últimos chars da linha)
            // Remetente: 25 chars, Destinatário: 25 chars, depois padding
            if (line.Length >= 80)
            {
                var trimmed = line.TrimEnd();
                if (trimmed.Length >= 50)
                {
                    var namesBlock = trimmed[^50..];
                    var senderName = namesBlock[..25].Trim();
                    var receiverName = namesBlock[25..].Trim();

                    if (!string.IsNullOrEmpty(senderName))
                        header["SenderName"] = senderName;
                    if (!string.IsNullOrEmpty(receiverName))
                        header["ReceiverName"] = receiverName;

                    _logger.LogDebug("ITP: Remetente={Sender}, Destinatário={Receiver}",
                        senderName, receiverName);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Erro ao parsear ITP");
        }
    }

    /// <summary>
    /// Detecta o layout do PE1 e extrai buyer code e seller code.
    ///BENTELER
    /// Formato padrão (ex: ): campo 3..15 é alfanumérico.
    ///   buyer code = line[3..15], seller code = line[15..27]
    ///
    /// Formato estendido (ex: Polimetri): campo 3..15 é puramente numérico
    ///   (contém Fab/Loc + sequência, não é o código real do produto).
    ///   buyer code real = line[36..66], seller code = line[66..96]
    /// </summary>
    private static (string BuyerCode, string? SellerCode) ParsePe1ProductCodes(string line)
    {
        if (line.Length < 15) return (line[3..].Trim(), null);

        var shortCode = line[3..15].Trim();

        // Formato estendido: campo 3-14 é puramente numérico → Polimetri-style
        if (!string.IsNullOrEmpty(shortCode) && shortCode.All(char.IsDigit))
        {
            var buyerCode = line.Length >= 66 ? line[36..66].Trim() : shortCode;
            string? sellerCode = null;
            if (line.Length >= 96)
            {
                var raw = line[66..96].Trim();
                if (!string.IsNullOrEmpty(raw)) sellerCode = raw;
            }
            if (string.IsNullOrEmpty(buyerCode)) buyerCode = shortCode;
            return (buyerCode, sellerCode);
        }

        // Formato padrão: buyer em 3..15, seller em 15..27
        string? stdSeller = null;
        if (line.Length >= 27)
        {
            var raw = line[15..27].Trim();
            if (!string.IsNullOrEmpty(raw)) stdSeller = raw;
        }
        return (shortCode, stdSeller);
    }

    /// <summary>
    /// Extrai unidade de medida e casas decimais do PE1.
    /// Últimos 4 caracteres: Unidade(2) + CasasDecimais(1) + Tipo(1).
    /// Exemplos: "PC0P" = peças sem decimais, "UN3P" = unidades com 3 decimais.
    /// </summary>
    private static (string? Unit, int Decimals) ParsePe1UnitInfo(string line)
    {
        var trimmed = line.TrimEnd();
        if (trimmed.Length < 4) return (null, 0);

        var unitInfo = trimmed[^4..];
        var unit = unitInfo[..2];
        var decChar = unitInfo[2];

        int decimals = char.IsDigit(decChar) ? decChar - '0' : 0;

        return (unit, decimals);
    }

    /// <summary>
    /// Parseia registro PE3 com programação de entregas.
    /// Após "PE3" (3 chars), há 7 blocos de 17 chars cada:
    ///   - 6 chars: data (YYMMDD), "000000" = sem data
    ///   - 11 chars: quantidade (inteiro com casas decimais implícitas)
    /// </summary>
    private List<(DateTime Date, decimal Qty)> ParsePe3(string line, int decimalPlaces)
    {
        var entries = new List<(DateTime, decimal)>();
        var data = line.Length > 3 ? line[3..] : "";

        const int entrySize = 17;
        const int maxEntries = 7;

        for (int i = 0; i < maxEntries; i++)
        {
            int offset = i * entrySize;
            if (offset + entrySize > data.Length) break;

            var dateStr = data.Substring(offset, 6);
            var qtyStr = data.Substring(offset + 6, 11);

            if (dateStr == "000000" || string.IsNullOrWhiteSpace(dateStr))
                continue;

            if (!DateTime.TryParseExact("20" + dateStr, "yyyyMMdd", null,
                System.Globalization.DateTimeStyles.None, out var dateRaw))
                continue;
            var date = DateTime.SpecifyKind(dateRaw.Date.AddHours(12), DateTimeKind.Utc);

            if (!long.TryParse(qtyStr.Trim(), out var rawQty))
                continue;

            decimal qty = decimalPlaces > 0
                ? rawQty / (decimal)Math.Pow(10, decimalPlaces)
                : rawQty;

            if (qty > 0)
                entries.Add((date, qty));
        }

        return entries;
    }
}
