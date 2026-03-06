using LogiMaster.Domain.Enums;

namespace LogiMaster.Application.DTOs;

public record UserDto(
    int Id,
    string Name,
    string Email,
    UserRole Role,
    string RoleName,
    string? EmployeeId,
    string? Department,
    DateTime? LastAccessAt,
    bool IsActive,
    DateTime CreatedAt,
    AppModule Permissions
);

public record CreateUserDto(
    string Name,
    string Email,
    string Password,
    UserRole Role,
    string? Department,
    string? EmployeeId,
    AppModule Permissions = AppModule.None
);

public record UpdateUserDto(
    string Name,
    UserRole Role,
    string? Department,
    string? EmployeeId
);

public record UpdateUserPermissionsDto(AppModule Permissions);

public record ChangePasswordDto(
    string CurrentPassword,
    string NewPassword
);

public record LoginDto(
    string Email,
    string Password
);

public record LoginResponseDto(
    int UserId,
    string Name,
    string Email,
    string? EmployeeId,
    UserRole Role,
    AppModule Permissions,
    string Token
);
