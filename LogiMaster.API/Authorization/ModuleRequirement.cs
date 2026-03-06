using LogiMaster.Domain.Enums;
using Microsoft.AspNetCore.Authorization;

namespace LogiMaster.API.Authorization;

public class ModuleRequirement(AppModule module) : IAuthorizationRequirement
{
    public AppModule Module { get; } = module;
}
