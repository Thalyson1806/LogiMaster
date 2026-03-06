using LogiMaster.Application.DTOs;

namespace LogiMaster.Application.Interfaces;

public interface IStockService
{
    Task<StockSummaryPageDto> GetStockSummaryAsync(string? productType = null, CancellationToken ct = default);
    Task<IEnumerable<StockMovementDto>> GetMovementsByProductAsync(int productId, CancellationToken ct = default);
    Task<StockMovementDto> RegisterMovementAsync(CreateStockMovementDto dto, int userId, CancellationToken ct = default);
    Task<IEnumerable<StockMovementDto>> RegisterBulkMovementsAsync(BulkCreateStockMovementDto dto, int userId, CancellationToken ct = default);
}
