using System.Data.Common;

namespace LogiMaster.Application.DTOs;

public record EdiRouteDto(
    int Id,
    int EdiClientId,
    string ClientName,
    string Code,
    string Name,
    string RouteType,
    string? DaysOfWeekJson,
    int? FrequencyPerWeek,
    int? FrequencyDays,
    string? Description,
    bool IsDefault,
    bool IsActive,
    DateTime CreatedAt
);

public record CreateEdiRouteDto(
    int EdiClientId,
    string Code,
    string Name,
    string RouteType,
    string? DaysOfWeekJson,
    int? FrequencyPerWeek,
    int? FrequencyDays,
    string? Description,
    bool IsDefault
);


public record UpdateEdiRouteDto(
    string Name,
    string RouteType,
    string? DaysOfWeekJson,
    int? FrequencyPerWeek,
    int? FrequencyDays,
    string? Description,
    bool IsDefault
);