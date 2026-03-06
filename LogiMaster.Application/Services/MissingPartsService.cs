using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using LogiMaster.Domain.Interfaces;

namespace LogiMaster.Application.Services;

public class MissingPartsService : IMissingPartsService
{
    private readonly IUnitOfWork _unitOfWork;

    public MissingPartsService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<MissingPartsSummaryDto> GetMissingPartsAsync(CancellationToken ct = default)
    {
        var today = DateTime.UtcNow.Date;

        // 1. Itens EDI futuros com produto vinculado
        var futureItems = await _unitOfWork.EdifactItems.GetFutureItemsWithProductAsync(today, ct);

        // 2. Estoque atual por produto (baseado em movimentos reais)
        var stockByProduct = await _unitOfWork.StockMovements.GetCurrentStockAllProductsAsync(ct);

        // 3. Agrupa itens por produto
        var itemsByProduct = futureItems
            .Where(i => i.ProductId.HasValue && i.Product != null)
            .GroupBy(i => i.ProductId!.Value);

        var results = new List<MissingPartDto>();

        foreach (var group in itemsByProduct)
        {
            var productId = group.Key;
            var product = group.First().Product!;
            var currentStock = stockByProduct.GetValueOrDefault(productId, 0m);

            // Agrupa por data de entrega e monta timeline
            var byDate = group
                .GroupBy(i => i.DeliveryStart.HasValue ? i.DeliveryStart.Value.Date : today)
                .OrderBy(g => g.Key);

            var timeline = new List<ProjectedBalancePoint>();
            decimal cumulative = 0;
            DateTime? shortageDate = null;
            decimal shortageQty = 0;

            foreach (var dateGroup in byDate)
            {
                var demandOnDate = dateGroup.Sum(i => i.Quantity);
                cumulative += demandOnDate;
                var balance = currentStock - cumulative;

                if (balance < 0 && shortageDate == null)
                {
                    shortageDate = dateGroup.Key;
                    shortageQty = Math.Abs(balance);
                }

                timeline.Add(new ProjectedBalancePoint(dateGroup.Key, demandOnDate, cumulative, balance));
            }

            var totalDemand = group.Sum(i => i.Quantity);
            var projectedBalance = currentStock - totalDemand;
            var daysUntilShortage = shortageDate.HasValue
                ? Math.Max(0, (int)(shortageDate.Value - today).TotalDays)
                : 9999;

            var riskLevel = shortageDate == null ? "OK"
                : daysUntilShortage <= 7 ? "Critical"
                : daysUntilShortage <= 30 ? "Warning"
                : "OK";

            var reason = shortageDate == null ? null
                : currentStock == 0 ? "SEM_ESTOQUE"
                : "DEMANDA_EXCEDE_ESTOQUE";

            results.Add(new MissingPartDto(
                productId,
                product.Reference,
                product.Description,
                currentStock,
                totalDemand,
                projectedBalance,
                shortageDate,
                shortageQty,
                daysUntilShortage,
                riskLevel,
                reason,
                timeline
            ));
        }

        results = results
            .OrderBy(r => r.RiskLevel == "Critical" ? 0 : r.RiskLevel == "Warning" ? 1 : 2)
            .ThenBy(r => r.DaysUntilShortage)
            .ToList();

        return new MissingPartsSummaryDto(
            results.Count,
            results.Count(r => r.RiskLevel == "Critical"),
            results.Count(r => r.RiskLevel == "Warning"),
            results.Count(r => r.RiskLevel == "OK"),
            results
        );
    }

    public async Task<MissingPartDto?> GetByProductAsync(int productId, CancellationToken ct = default)
    {
        var summary = await GetMissingPartsAsync(ct);
        return summary.Items.FirstOrDefault(i => i.ProductId == productId);
    }
}
