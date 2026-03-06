using LogiMaster.Application.DTOs;
using LogiMaster.Domain.Enums;

namespace LogiMaster.Application.Interfaces;

public interface IUserService
{
    Task<IEnumerable<UserDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<UserDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<UserDto> CreateAsync(CreateUserDto dto, CancellationToken cancellationToken = default);
    Task<UserDto> UpdateAsync(int id, UpdateUserDto dto, CancellationToken cancellationToken = default);
    Task<UserDto> UpdatePermissionsAsync(int id, AppModule permissions, CancellationToken cancellationToken = default);
    Task<bool> ResetPasswordAsync(int id, string newPassword, CancellationToken cancellationToken = default);
    Task<bool> DeactivateAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> ActivateAsync(int id, CancellationToken cancellationToken = default);
}
