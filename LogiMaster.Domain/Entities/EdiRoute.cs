namespace LogiMaster.Domain.Entities;

public class EdiRoute : BaseEntity
{
    public int EdiClientId { get; private set; }
    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string RouteType { get; private set; } = string.Empty;
    public string? DaysOfWeekJson { get; private set; }
    public int? FrequencyPerWeek { get; private set; }
    public int? FrequencyDays { get; private set; }
    public string? Description { get; private set; }
    public bool IsDefault { get; private set; }

    // Navigation
    public virtual EdiClient Client { get; private set; } = null!;

    protected EdiRoute() { }

    public EdiRoute(int ediClientId, string code, string name, string routeType)
    {
        EdiClientId = ediClientId;
        Code = code.ToLower().Trim();
        Name = name.Trim();
        RouteType = routeType;
    }

    public void Update(string name, string routeType, string? daysOfWeekJson, int? frequencyPerWeek, int? frequencyDays, string? description, bool isDefault)
    {
        Name = name.Trim();
        RouteType = routeType;
        DaysOfWeekJson = daysOfWeekJson;
        FrequencyPerWeek = frequencyPerWeek;
        FrequencyDays = frequencyDays;
        Description = description?.Trim();
        IsDefault = isDefault;
        MarkUpdated();
    }

    public void SetAsDefault()
    {
        IsDefault = true;
        MarkUpdated();
    }
}
