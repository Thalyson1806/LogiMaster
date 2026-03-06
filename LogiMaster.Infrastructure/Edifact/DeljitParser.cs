using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using LogiMaster.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace LogiMaster.Infrastructure.Edifact;

public class DeljitParser : IEdifactParser
{
    private readonly ILogger<DeljitParser> _logger;

    public EdifactMessageType MessageType => EdifactMessageType.DELJIT;

    public DeljitParser(ILogger<DeljitParser> logger)
    {
        _logger = logger;
    }

    public ParsedEdifactResult Parse(string content)
    {
        var items = new List<ParsedEdifactItem>();
        var header = new Dictionary<string, string>();

        try
        {
            content = content.Replace("\r\n", "").Replace("\n", "").Replace("\r", "");
            var segments = content.Split('\'', StringSplitOptions.RemoveEmptyEntries);

            _logger.LogInformation("Parsing DELJIT with {SegmentCount} segments", segments.Length);

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

                var elements = trimmed.Split('+');
                var segmentType = elements[0];

                switch (segmentType)
                {
                    case "UNB":
                        if (elements.Length > 2)
                            header["Sender"] = GetSubElement(elements[2], 0);
                        if (elements.Length > 3)
                            header["Recipient"] = GetSubElement(elements[3], 0);
                        if (elements.Length > 4)
                            header["Date"] = elements[4];
                        break;

                    case "UNH":
                        if (elements.Length > 1)
                            header["MessageRef"] = elements[1];
                        if (elements.Length > 2)
                            header["MessageType"] = GetSubElement(elements[2], 0);
                        break;

                    case "BGM":
                        if (elements.Length > 2)
                            currentDocNumber = elements[2];
                        header["DocumentNumber"] = currentDocNumber ?? "";
                        break;

                    case "DTM":
                        if (elements.Length > 1)
                        {
                            var dtmParts = elements[1].Split(':');
                            if (dtmParts.Length >= 2)
                            {
                                var qualifier = dtmParts[0];
                                var dateValue = dtmParts[1];
                                var format = dtmParts.Length > 2 ? dtmParts[2] : "102";
                                var parsedDate = ParseEdifactDate(dateValue, format);

                                if (inLineItem && parsedDate.HasValue)
                                {
                                    // DELJIT: 136=actual delivery, 64=earliest, 2=requested
                                    if (qualifier is "136" or "64" or "2")
                                        currentDeliveryStart = parsedDate;
                                    // DELJIT: 117=estimated, 63=latest
                                    else if (qualifier is "117" or "63")
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

                    case "NAD":
                        if (elements.Length > 1)
                        {
                            var nadQualifier = elements[1];
                            if ((nadQualifier == "DP" || nadQualifier == "CN") && elements.Length > 2)
                                currentLocation = GetSubElement(elements[2], 0);
                            else if (nadQualifier == "BY" && elements.Length > 2)
                                header["BuyerCode"] = GetSubElement(elements[2], 0);
                        }
                        break;

                    case "LIN":
                        if (inLineItem && !string.IsNullOrEmpty(currentItemCode))
                        {
                            items.Add(CreateItem(currentItemCode, currentBuyerCode, currentSupplierCode,
                                currentDescription, currentQuantity, currentUnit,
                                currentDeliveryStart, currentDeliveryEnd, currentLocation,
                                currentDocNumber, lineNumber));
                        }

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
                            currentItemCode = GetSubElement(elements[3], 0);
                        break;

                    case "PIA":
                        if (elements.Length > 2)
                        {
                            for (int i = 2; i < elements.Length; i++)
                            {
                                var piaCode = GetSubElement(elements[i], 0);
                                var piaType = GetSubElement(elements[i], 1);

                                if (piaType == "SA")
                                    currentSupplierCode = piaCode;
                                else if (piaType == "IN" || piaType == "MP")
                                    currentBuyerCode = piaCode;
                            }
                        }
                        break;

                    case "IMD":
                        if (elements.Length > 3)
                        {
                            currentDescription = GetSubElement(elements[3], 3);
                            if (string.IsNullOrEmpty(currentDescription))
                                currentDescription = GetSubElement(elements[3], 0);
                        }
                        break;

                    case "QTY":
                        if (elements.Length > 1)
                        {
                            var qtyParts = elements[1].Split(':');
                            if (qtyParts.Length >= 2)
                            {
                                // 21=ordered, 113=ordered (DELFOR), 52=per package (ignorar)
                                var qtyQualifier = qtyParts[0];
                                if (qtyQualifier is "21" or "113")
                                {
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
                        }
                        break;

                    case "UNT":
                    case "UNZ":
                        if (inLineItem && !string.IsNullOrEmpty(currentItemCode))
                        {
                            items.Add(CreateItem(currentItemCode, currentBuyerCode, currentSupplierCode,
                                currentDescription, currentQuantity, currentUnit,
                                currentDeliveryStart, currentDeliveryEnd, currentLocation,
                                currentDocNumber, lineNumber));
                        }
                        inLineItem = false;
                        break;
                }
            }

            _logger.LogInformation("Parsed {ItemCount} items from DELJIT", items.Count);

            return new ParsedEdifactResult(true, null, items, header);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing DELJIT content");
            return new ParsedEdifactResult(false, ex.Message, items, header);
        }
    }

    private static ParsedEdifactItem CreateItem(
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
                "102" => DateTime.ParseExact(value, "yyyyMMdd", null),
                "203" => DateTime.ParseExact(value, "yyyyMMddHHmm", null),
                "204" => DateTime.ParseExact(value, "yyyyMMddHHmmss", null),
                _ => DateTime.TryParse(value, out var parsed) ? parsed : null
            };
            return dt.HasValue ? DateTime.SpecifyKind(dt.Value.Date.AddHours(12), DateTimeKind.Utc) : null;
        }
        catch
        {
            return null;
        }
    }
}
