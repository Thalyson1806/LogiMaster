using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Enums;
using LogiMaster.Domain.Interfaces;

namespace LogiMaster.Application.Services;

public class StockService : IStockService
{
    private readonly IUnitOfWork _uow;

    public StockService(IUnitOfWork uow)
    {
        _uow = uow;
    }

   public async Task<StockSummaryPageDto> GetStockSummaryAsync(string? productType = null, CancellationToken ct = default)
  {
    var stocks = await _uow.StockMovements.GetCurrentStockAllProductsAsync(ct);
    var products = await _uow.Products.GetAllAsync(ct);

    var items = products.Select(p =>
    {
        stocks.TryGetValue(p.Id, out var qty);
        return new StockSummaryDto(p.Id, p.Reference, p.Description, p.ProductType.ToString(), qty, null);
    }).ToList();

    if (!string.IsNullOrEmpty(productType))
        items = items.Where(i => i.ProductType.Equals(productType, StringComparison.OrdinalIgnoreCase)).ToList();

    return new StockSummaryPageDto(
        TotalProducts: items.Count,
        ProductsWithStock: items.Count(i => i.CurrentStock > 0),
        ProductsWithoutStock: items.Count(i => i.CurrentStock <= 0),
        Items: items.OrderBy(i => i.ProductReference).ToList()
    );
 }


    public async Task<IEnumerable<StockMovementDto>> GetMovementsByProductAsync(int productId, CancellationToken ct = default)
    {
        var movements = await _uow.StockMovements.GetByProductIdAsync(productId, ct);
        return movements.Select(ToDto);
    }

    public async Task<StockMovementDto> RegisterMovementAsync(CreateStockMovementDto dto, int userId, CancellationToken ct = default)
    {
        var type = ParseType(dto.Type);
        var qty = ResolveQuantity(type, dto.Quantity);

        var movement = new StockMovement(dto.ProductId, type, qty, dto.Notes, userId);
        await _uow.StockMovements.AddAsync(movement, ct);
        await _uow.SaveChangesAsync(ct);

        var saved = (await _uow.StockMovements.GetByProductIdAsync(dto.ProductId, ct))
            .OrderByDescending(m => m.CreatedAt).First();
        return ToDto(saved);
    }

    public async Task<IEnumerable<StockMovementDto>> RegisterBulkMovementsAsync(BulkCreateStockMovementDto dto, int userId, CancellationToken ct = default)
    {
        var movements = dto.Movements.Select(m =>
        {
            var type = ParseType(m.Type);
            var qty = ResolveQuantity(type, m.Quantity);
            return new StockMovement(m.ProductId, type, qty, m.Notes, userId);
        }).ToList();

        await _uow.StockMovements.AddRangeAsync(movements, ct);
        await _uow.SaveChangesAsync(ct);

        return movements.Select(ToDto);
    }

    public async Task<bool> DeleteMovementAsync(int id, CancellationToken ct = default)
    {
        var movement = await _uow.StockMovements.GetByIdAsync(id, ct);
        if (movement is null) return false;
        movement.Deactivate();
        await _uow.SaveChangesAsync(ct);
        return true;
    }

    private static StockMovementType ParseType(string type) => type.ToLower() switch
    {
        "entry"      => StockMovementType.Entry,
        "exit"       => StockMovementType.Exit,
        "adjustment" => StockMovementType.Adjustment,
        "dispatch"   => StockMovementType.Dispatch,
        _ => throw new ArgumentException($"Tipo inválido: {type}")
    };

    // Saída e Dispatch sempre negativos; Entrada e Adjustment respeitam o sinal enviado
    private static decimal ResolveQuantity(StockMovementType type, decimal qty) => type switch
    {
        StockMovementType.Exit     => -Math.Abs(qty),
        StockMovementType.Dispatch => -Math.Abs(qty),
        _                          => qty
    };

    private static StockMovementDto ToDto(StockMovement m) => new(
        m.Id,
        m.ProductId,
        m.Product?.Reference ?? "",
        m.Product?.Description ?? "",
        m.Type.ToString(),
        m.Quantity,
        m.Notes,
        m.CreatedByUserId,
        m.CreatedByUser?.Name,
        m.PackingListId,
        m.CreatedAt
    );
}
