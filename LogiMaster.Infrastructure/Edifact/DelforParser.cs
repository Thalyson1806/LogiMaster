using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using LogiMaster.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace LogiMaster.Infrastructure.Edifact;

/// <summary>
/// Parser para mensagens EDIFACT DELFOR (Delivery Forecast)
/// Estrutura básica DELFOR:
/// UNB - Interchange Header
/// UNH - Message Header
/// BGM - Beginning of Message
/// DTM - Date/Time
/// NAD - Name and Address
/// LIN - Line Item
/// PIA - Additional Product Id
/// QTY - Quantity
/// DTM - Delivery Date
/// UNT - Message Trailer
/// UNZ - Interchange Trailer
/// </summary>
public class DelforParser : IEdifactParser
{
    private readonly ILogger<DelforParser> _logger;
    
    public EdifactMessageType MessageType => EdifactMessageType.DELFOR;

    public DelforParser(ILogger<DelforParser> logger)
    {
        _logger = logger;
    }

    public ParsedEdifactResult Parse(string content)
    {
        var items = new List<ParsedEdifactItem>();
        var header = new Dictionary<string, string>();
        var errors = new List<string>();

        try
        {
            // Normalizar quebras de linha e remover espaços extras
            content = content.Replace("\r\n", "").Replace("\n", "").Replace("\r", "");
            
            // Separar segmentos por apóstrofo (')
            var segments = content.Split('\'', StringSplitOptions.RemoveEmptyEntries);
            
            _logger.LogInformation("Parsing DELFOR with {SegmentCount} segments", segments.Length);

            // Variáveis de contexto para o item atual
            string? currentItemCode = null;
            string? currentBuyerCode = null;
            string? currentSupplierCode = null;
            string? currentDescription = null;
            decimal currentQuantity = 0;
            string? currentUnit = null;
            DateTime? currentDeliveryStart = null;
            DateTime? currentDeliveryEnd = null;
            string? currentLocation = null;
            string? currentDocNumber = null;
            int lineNumber = 0;
            bool inLineItem = false;

            foreach (var segment in segments)
            {
                var trimmed = segment.Trim();
                if (string.IsNullOrEmpty(trimmed)) continue;

                // Separar elementos do segmento por '+'
                var elements = trimmed.Split('+');
                var segmentType = elements[0];

                switch (segmentType)
                {
                    case "UNB": // Interchange Header
                        if (elements.Length > 2)
                            header["Sender"] = GetSubElement(elements[2], 0);
                        if (elements.Length > 3)
                            header["Recipient"] = GetSubElement(elements[3], 0);
                        if (elements.Length > 4)
                            header["Date"] = elements[4];
                        break;

                    case "UNH": // Message Header
                        if (elements.Length > 1)
                            header["MessageRef"] = elements[1];
                        if (elements.Length > 2)
                            header["MessageType"] = GetSubElement(elements[2], 0);
                        break;

                    case "BGM": // Beginning of Message
                        if (elements.Length > 2)
                            currentDocNumber = elements[2];
                        header["DocumentNumber"] = currentDocNumber ?? "";
                        break;

                    case "DTM": // Date/Time
                        if (elements.Length > 1)
                        {
                            var dtmParts = elements[1].Split(':');
                            if (dtmParts.Length >= 2)
                            {
                                var qualifier = dtmParts[0];
                                var dateValue = dtmParts[1];
                                var format = dtmParts.Length > 2 ? dtmParts[2] : "102";

                                var parsedDate = ParseEdifactDate(dateValue, format);

                                // Qualificadores comuns:
                                // 2 = Delivery date/time, requested
                                // 64 = Delivery date/time, earliest
                                // 63 = Delivery date/time, latest
                                // 137 = Document date
                                if (inLineItem && parsedDate.HasValue)
                                {
                                    if (qualifier == "64" || qualifier == "2")
                                        currentDeliveryStart = parsedDate;
                                    else if (qualifier == "63")
                                        currentDeliveryEnd = parsedDate;
                                    else if (currentDeliveryStart == null)
                                        currentDeliveryStart = parsedDate;
                                }
                                else if (qualifier == "137" && parsedDate.HasValue)
                                {
                                    header["DocumentDate"] = parsedDate.Value.ToString("yyyy-MM-dd");
                                }
                            }
                        }
                        break;

                    case "NAD": // Name and Address
                        if (elements.Length > 1)
                        {
                            var nadQualifier = elements[1];
                            // BY = Buyer, SU = Supplier, DP = Delivery Party
                            if (nadQualifier == "DP" && elements.Length > 2)
                            {
                                currentLocation = GetSubElement(elements[2], 0);
                            }
                            else if (nadQualifier == "BY" && elements.Length > 2)
                            {
                                header["BuyerCode"] = GetSubElement(elements[2], 0);
                            }
                        }
                        break;

                    case "LIN": // Line Item
                        // Se já tinha um item em andamento, salvar
                        if (inLineItem && !string.IsNullOrEmpty(currentItemCode))
                        {
                            items.Add(CreateParsedItem(
                                currentItemCode, currentBuyerCode, currentSupplierCode,
                                currentDescription, currentQuantity, currentUnit,
                                currentDeliveryStart, currentDeliveryEnd, currentLocation,
                                currentDocNumber, lineNumber));
                        }

                        // Iniciar novo item
                        lineNumber++;
                        inLineItem = true;
                        currentItemCode = null;
                        currentBuyerCode = null;
                        currentSupplierCode = null;
                        currentDescription = null;
                        currentQuantity = 0;
                        currentUnit = null;
                        currentDeliveryStart = null;
                        currentDeliveryEnd = null;

                        if (elements.Length > 3)
                        {
                            currentItemCode = GetSubElement(elements[3], 0);
                        }
                        break;

                    case "PIA": // Additional Product Identification
                        if (elements.Length > 2)
                        {
                            var piaQualifier = elements[1];
                            var piaCode = GetSubElement(elements[2], 0);
                            var piaType = GetSubElement(elements[2], 1);

                            // IN = Buyer's item number, SA = Supplier's article number
                            if (piaType == "IN" || piaQualifier == "1")
                                currentBuyerCode = piaCode;
                            else if (piaType == "SA" || piaQualifier == "5")
                                currentSupplierCode = piaCode;
                            else if (string.IsNullOrEmpty(currentItemCode))
                                currentItemCode = piaCode;
                        }
                        break;

                    case "IMD": // Item Description
                        if (elements.Length > 3)
                        {
                            currentDescription = GetSubElement(elements[3], 3);
                            if (string.IsNullOrEmpty(currentDescription))
                                currentDescription = GetSubElement(elements[3], 0);
                        }
                        break;

                    case "QTY": // Quantity
                        if (elements.Length > 1)
                        {
                            var qtyParts = elements[1].Split(':');
                            if (qtyParts.Length >= 2)
                            {
                                // Qualificador 113 = Quantity ordered
                                if (decimal.TryParse(qtyParts[1], 
                                    System.Globalization.NumberStyles.Any,
                                    System.Globalization.CultureInfo.InvariantCulture, 
                                    out var qty))
                                {
                                    currentQuantity = qty;
                                }
                                if (qtyParts.Length > 2)
                                    currentUnit = qtyParts[2];
                            }
                        }
                        break;

                    case "UNT": // Message Trailer
                    case "UNZ": // Interchange Trailer
                        // Salvar último item se existir
                        if (inLineItem && !string.IsNullOrEmpty(currentItemCode))
                        {
                            items.Add(CreateParsedItem(
                                currentItemCode, currentBuyerCode, currentSupplierCode,
                                currentDescription, currentQuantity, currentUnit,
                                currentDeliveryStart, currentDeliveryEnd, currentLocation,
                                currentDocNumber, lineNumber));
                        }
                        inLineItem = false;
                        break;
                }
            }

            _logger.LogInformation("Parsed {ItemCount} items from DELFOR", items.Count);

            return new ParsedEdifactResult(
                Success: true,
                ErrorMessage: null,
                Items: items,
                Header: header
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing DELFOR content");
            return new ParsedEdifactResult(
                Success: false,
                ErrorMessage: ex.Message,
                Items: items,
                Header: header
            );
        }
    }

    private static ParsedEdifactItem CreateParsedItem(
        string itemCode, string? buyerCode, string? supplierCode,
        string? description, decimal quantity, string? unit,
        DateTime? deliveryStart, DateTime? deliveryEnd, string? location,
        string? docNumber, int lineNumber)
    {
        return new ParsedEdifactItem(
            ItemCode: itemCode,
            BuyerItemCode: buyerCode,
            SupplierItemCode: supplierCode,
            Description: description,
            Quantity: quantity,
            UnitOfMeasure: unit,
            DeliveryStart: deliveryStart,
            DeliveryEnd: deliveryEnd ?? deliveryStart,
            DeliveryLocation: location,
            DocumentNumber: docNumber,
            LineNumber: lineNumber
        );
    }

    private static string GetSubElement(string element, int index)
    {
        var parts = element.Split(':');
        return parts.Length > index ? parts[index] : string.Empty;
    }

    private static DateTime? ParseEdifactDate(string value, string format)
    {
        try
        {
            DateTime? dt = format switch
            {
                "102" => DateTime.ParseExact(value, "yyyyMMdd", null), // CCYYMMDD
                "203" => DateTime.ParseExact(value, "yyyyMMddHHmm", null), // CCYYMMDDHHMM
                "204" => DateTime.ParseExact(value, "yyyyMMddHHmmss", null), // CCYYMMDDHHMMSS
                "718" => ParseWeekDate(value), // CCYYMMDD-CCYYMMDD (range)
                _ => DateTime.TryParse(value, out var parsed) ? parsed : null
            };
            return dt.HasValue ? DateTime.SpecifyKind(dt.Value.Date.AddHours(12), DateTimeKind.Utc) : null;
        }
        catch
        {
            return null;
        }
    }

    private static DateTime? ParseWeekDate(string value)
    {
        // Formato: YYYYMMDD-YYYYMMDD ou YYYYWW
        if (value.Contains('-'))
        {
            var parts = value.Split('-');
            if (parts.Length > 0 && DateTime.TryParseExact(parts[0], "yyyyMMdd", null,
                System.Globalization.DateTimeStyles.None, out var dt))
                return DateTime.SpecifyKind(dt, DateTimeKind.Utc);
        }
        return null;
    }
}
