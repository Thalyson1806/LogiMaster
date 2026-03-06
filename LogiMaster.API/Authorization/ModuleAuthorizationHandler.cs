using LogiMaster.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace LogiMaster.API.Authorization;

public class ModuleAuthorizationHandler : AuthorizationHandler<ModuleRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, ModuleRequirement requirement)
    {
        // Administrator tem acesso a tudo
        if (context.User.IsInRole(nameof(UserRole.Administrator)))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        var permissionsClaim = context.User.FindFirst("permissions")?.Value;
        if (permissionsClaim != null && long.TryParse(permissionsClaim, out var permissionsValue))
        {
            var userPermissions = (AppModule)permissionsValue;
            if (userPermissions.HasFlag(requirement.Module))
            {
                context.Succeed(requirement);
            }
        }

        return Task.CompletedTask;
    }
}
