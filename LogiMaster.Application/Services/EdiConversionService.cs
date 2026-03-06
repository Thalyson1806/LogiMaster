using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Enums;
using LogiMaster.Domain.Interfaces;
using OfficeOpenXml;

namespace LogiMaster.Application.Services;

public class EdiConversionService : IEdiConversionService
{
    private readonly IUnitOfWork _unitOfWork;

    public EdiConversionService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
        ExcelPackage.License.SetNonCommercialPersonal("LogiMaster");
    }

    public async Task<IEnumerable<EdiConversionDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var conversions = await _unitOfWork.EdiConversions.GetAllAsync(cancellationToken);
        return conversions.OrderByDescending(c => c.ConvertedAt).Select(MapToDto);
    }

    public async Task<IEnumerable<EdiConversionDto>> GetByClientIdAsync(int clientId, CancellationToken cancellationToken = default)
    {
        var conversions = await _unitOfWork.EdiConversions.GetByClientIdAsync(clientId, cancellationToken);
        return conversions.Select(MapToDto);
    }

    public async Task<EdiConversionDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var conversion = await _unitOfWork.EdiConversions.GetWithDetailsAsync(id, cancellationToken);
        return conversion != null ? MapToDto(conversion) : null;
    }

    public async Task<EdiConversionResultDto> ConvertAsync(
        Stream inputFile,
        string fileName,
        int clientId,
        int routeId,
        DateTime? startDate,
        DateTime? endDate,
        int? userId,
        CancellationToken cancellationToken = default)
    {
        var warnings = new List<string>();

        var client = await _unitOfWork.EdiClients.GetByIdAsync(clientId, cancellationToken);
        if (client == null)
            return new EdiConversionResultDto(0, "", false, 0, 0, 0, warnings, "Cliente não encontrado", null, null);

        var route = await _unitOfWork.EdiRoutes.GetByIdAsync(routeId, cancellationToken);
        if (route == null)
            return new EdiConversionResultDto(0, "", false, 0, 0, 0, warnings, "Roteiro não encontrado", null, null);

        var conversion = new EdiConversion(clientId, routeId, fileName, userId);
        conversion.SetDates(startDate, endDate);
        conversion.StartProcessing();

        await _unitOfWork.EdiConversions.AddAsync(conversion, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        try
        {
            using var package = new ExcelPackage(inputFile);
            var worksheet = package.Workbook.Worksheets.FirstOrDefault();
            if (worksheet == null)
            {
                conversion.SetError("Planilha vazia ou inválida");
                _unitOfWork.EdiConversions.Update(conversion);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                return new EdiConversionResultDto(conversion.Id, conversion.Code, false, 0, 0, 0, warnings, "Planilha vazia", null, null);
            }

            var rowCount = worksheet.Dimension?.Rows ?? 0;
            var productsProcessed = 0;
            var productsNotFound = 0;
            var outputLines = new List<OutputLine>();

            for (int row = 2; row <= rowCount; row++)
            {
                var description = worksheet.Cells[row, 1].Value?.ToString()?.Trim();
                if (string.IsNullOrWhiteSpace(description)) continue;

                productsProcessed++;
                var product = await _unitOfWork.EdiProducts.FindForConversionAsync(description, clientId, cancellationToken);

                if (product == null)
                {
                    productsNotFound++;
                    warnings.Add($"Produto não encontrado: {description}");
                    continue;
                }

                var quantity = worksheet.Cells[row, 2].Value?.ToString();
                var deliveryDate = CalculateDeliveryDate(route, startDate ?? DateTime.Today);

                outputLines.Add(new OutputLine
                {
                    Description = product.Description,
                    Reference = product.Reference ?? "",
                    Quantity = quantity ?? "0",
                    DeliveryDate = deliveryDate.ToString("dd/MM/yyyy"),
                    Code = product.Code ?? "",
                    Value = product.Value?.ToString("F2") ?? "0"
                });
            }

            var outputBytes = GenerateOutputExcel(outputLines);
            var outputFileName = $"{client.Code}_EDI_{DateTime.Now:yyyyMMdd}.xlsx";

            conversion.Complete(outputFileName, productsProcessed, outputLines.Count, productsNotFound);

            _unitOfWork.EdiConversions.Update(conversion);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new EdiConversionResultDto(
                conversion.Id,
                conversion.Code,
                true,
                productsProcessed,
                outputLines.Count,
                productsNotFound,
                warnings,
                null,
                outputBytes,
                outputFileName
            );
        }
        catch (Exception ex)
        {
            conversion.SetError(ex.Message);
            _unitOfWork.EdiConversions.Update(conversion);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new EdiConversionResultDto(conversion.Id, conversion.Code, false, 0, 0, 0, warnings, ex.Message, null, null);
        }
    }

    public async Task<(byte[] Content, string FileName)> DownloadAsync(int conversionId, CancellationToken cancellationToken = default)
    {
        var conversion = await _unitOfWork.EdiConversions.GetWithDetailsAsync(conversionId, cancellationToken);
        if (conversion == null)
            throw new InvalidOperationException("Conversão não encontrada");

        throw new NotImplementedException("Download de arquivos será implementado com storage");
    }

    private static DateTime CalculateDeliveryDate(EdiRoute route, DateTime baseDate)
    {
        if (route.FrequencyDays.HasValue)
            return baseDate.AddDays(route.FrequencyDays.Value);

        return baseDate.AddDays(7);
    }

    private static byte[] GenerateOutputExcel(List<OutputLine> lines)
    {
        using var package = new ExcelPackage();
        var ws = package.Workbook.Worksheets.Add("EDI");

        ws.Cells[1, 1].Value = "Descrição";
        ws.Cells[1, 2].Value = "Referência";
        ws.Cells[1, 3].Value = "Quantidade";
        ws.Cells[1, 4].Value = "Data Entrega";
        ws.Cells[1, 5].Value = "Código";
        ws.Cells[1, 6].Value = "Valor";

        for (int i = 0; i < lines.Count; i++)
        {
            var row = i + 2;
            ws.Cells[row, 1].Value = lines[i].Description;
            ws.Cells[row, 2].Value = lines[i].Reference;
            ws.Cells[row, 3].Value = lines[i].Quantity;
            ws.Cells[row, 4].Value = lines[i].DeliveryDate;
            ws.Cells[row, 5].Value = lines[i].Code;
            ws.Cells[row, 6].Value = lines[i].Value;
        }

        ws.Cells.AutoFitColumns();
        return package.GetAsByteArray();
    }

    private static EdiConversionDto MapToDto(EdiConversion c) => new(
        c.Id,
        c.EdiClientId,
        c.Client?.Name ?? "",
        c.EdiRouteId,
        c.Route?.Name ?? "",
        c.Code,
        c.ConvertedAt,
        c.ConvertedById,
        c.ConvertedBy?.Name,
        c.InputFileName,
        c.OutputFileName,
        c.StartDate,
        c.EndDate,
        c.TotalProductsProcessed,
        c.TotalLinesGenerated,
        c.ProductsNotFound,
        c.Status,
        c.ErrorMessage,
        c.Notes,
        c.IsActive,
        c.CreatedAt
    );

    private class OutputLine
    {
        public string Description { get; set; } = "";
        public string Reference { get; set; } = "";
        public string Quantity { get; set; } = "";
        public string DeliveryDate { get; set; } = "";
        public string Code { get; set; } = "";
        public string Value { get; set; } = "";
    }
}
