using LogiMaster.Application.DTOs;

namespace LogiMaster.Application.Interfaces;

public interface IMissingPartsService
{
    Task<MissingPartsSummaryDto> GetMissingPartsAsync(CancellationToken ct = default);
    Task<MissingPartDto?> GetByProductAsync(int productId, CancellationToken ct = default);
}
