using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Enums;
using LogiMaster.Domain.Interfaces;

namespace LogiMaster.Application.Services;

public class UserService : IUserService
{
    private readonly IUnitOfWork _unitOfWork;

    public UserService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<UserDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var users = await _unitOfWork.Users.GetAllAsync(cancellationToken);
        return users.Select(ToDto).OrderBy(u => u.Name);
    }

    public async Task<UserDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(id, cancellationToken);
        return user is null ? null : ToDto(user);
    }

    public async Task<UserDto> CreateAsync(CreateUserDto dto, CancellationToken cancellationToken = default)
    {
        if (await _unitOfWork.Users.EmailExistsAsync(dto.Email, cancellationToken: cancellationToken))
            throw new InvalidOperationException("Email já cadastrado");

        var user = new User(dto.Name, dto.Email, dto.Password, dto.Role);
        user.Update(dto.Name, dto.Department, dto.Role, dto.EmployeeId);
        user.SetPermissions(dto.Permissions);

        await _unitOfWork.Users.AddAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return ToDto(user);
    }

    public async Task<UserDto> UpdateAsync(int id, UpdateUserDto dto, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException("Usuário não encontrado");

        user.Update(dto.Name, dto.Department, dto.Role, dto.EmployeeId);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return ToDto(user);
    }

    public async Task<UserDto> UpdatePermissionsAsync(int id, AppModule permissions, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException("Usuário não encontrado");

        user.SetPermissions(permissions);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return ToDto(user);
    }

    public async Task<bool> ResetPasswordAsync(int id, string newPassword, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(id, cancellationToken);
        if (user is null) return false;

        user.ChangePassword(newPassword);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeactivateAsync(int id, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(id, cancellationToken);
        if (user is null) return false;

        user.Deactivate();
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ActivateAsync(int id, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(id, cancellationToken);
        if (user is null) return false;

        user.Activate();
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static UserDto ToDto(User u) => new(
        u.Id, u.Name, u.Email, u.Role, u.Role.ToString(),
        u.EmployeeId, u.Department, u.LastAccessAt, u.IsActive, u.CreatedAt,
        u.Permissions
    );
}
