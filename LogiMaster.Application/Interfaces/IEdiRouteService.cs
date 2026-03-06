using LogiMaster.Application.DTOs;

namespace LogiMaster.Application.Interfaces;

public interface IEdiRouteService
{
    Task<IEnumerable<EdiRouteDto>> GetByClientIdAsync(int clientId, CancellationToken cancellationToken = default);
    Task<EdiRouteDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<EdiRouteDto> CreateAsync(CreateEdiRouteDto dto, CancellationToken cancellationToken = default);
    Task<EdiRouteDto?> UpdateAsync(int id, UpdateEdiRouteDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
}
