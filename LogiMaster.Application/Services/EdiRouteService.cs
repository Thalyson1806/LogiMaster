using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Interfaces;

namespace LogiMaster.Application.Services;

public class EdiRouteService : IEdiRouteService
{
    private readonly IUnitOfWork _unitOfWork;

    public EdiRouteService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<EdiRouteDto>> GetByClientIdAsync(int clientId, CancellationToken cancellationToken = default)
    {
        var routes = await _unitOfWork.EdiRoutes.GetByClientIdAsync(clientId, cancellationToken);
        return routes.Where(r => r.IsActive).Select(MapToDto);
    }

    public async Task<EdiRouteDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var route = await _unitOfWork.EdiRoutes.GetByIdAsync(id, cancellationToken);
        return route != null ? MapToDto(route) : null;
    }

    public async Task<EdiRouteDto> CreateAsync(CreateEdiRouteDto dto, CancellationToken cancellationToken = default)
    {
        var route = new EdiRoute(dto.EdiClientId, dto.Code, dto.Name, dto.RouteType);
        
        // Atualiza campos opcionais
        route.Update(
            dto.Name,
            dto.RouteType,
            dto.DaysOfWeekJson,
            dto.FrequencyPerWeek,
            dto.FrequencyDays,
            dto.Description,
            dto.IsDefault
        );

        await _unitOfWork.EdiRoutes.AddAsync(route, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(route);
    }

    public async Task<EdiRouteDto?> UpdateAsync(int id, UpdateEdiRouteDto dto, CancellationToken cancellationToken = default)
    {
        var route = await _unitOfWork.EdiRoutes.GetByIdAsync(id, cancellationToken);
        if (route == null) return null;

        route.Update(
            dto.Name,
            dto.RouteType,
            dto.DaysOfWeekJson,
            dto.FrequencyPerWeek,
            dto.FrequencyDays,
            dto.Description,
            dto.IsDefault
        );

        _unitOfWork.EdiRoutes.Update(route);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(route);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var route = await _unitOfWork.EdiRoutes.GetByIdAsync(id, cancellationToken);
        if (route == null) return false;

        route.Deactivate();
        _unitOfWork.EdiRoutes.Update(route);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    private static EdiRouteDto MapToDto(EdiRoute route) => new(
        route.Id,
        route.EdiClientId,
        route.Client?.Name ?? "",
        route.Code,
        route.Name,
        route.RouteType,
        route.DaysOfWeekJson,
        route.FrequencyPerWeek,
        route.FrequencyDays,
        route.Description,
        route.IsDefault,
        route.IsActive,
        route.CreatedAt
    );
}
