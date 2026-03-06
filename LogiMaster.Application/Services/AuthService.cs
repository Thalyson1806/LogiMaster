using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using LogiMaster.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace LogiMaster.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _configuration;

    public AuthService(IUnitOfWork unitOfWork, IConfiguration configuration)
    {
        _unitOfWork = unitOfWork;
        _configuration = configuration;
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginDto request, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByEmailAsync(request.Email, cancellationToken);

        if (user == null)
            return null;

        // Verifica senha (por enquanto simples, depois implementar hash)
        if (user.PasswordHash != request.Password)
            return null;

        // Registra o acesso
        user.RecordAccess();
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Gera o token JWT
        var token = GenerateJwtToken(user.Id, user.Email, user.Role.ToString(), (long)user.Permissions);

        return new LoginResponseDto(
            user.Id,
            user.Name,
            user.Email,
            user.EmployeeId,
            user.Role,
            user.Permissions,
            token
        );
    }

    public async Task<UserDto?> GetCurrentUserAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);

        if (user == null || !user.IsActive)
            return null;

        return new UserDto(
            user.Id,
            user.Name,
            user.Email,
            user.Role,
            user.Role.ToString(),
            user.EmployeeId,
            user.Department,
            user.LastAccessAt,
            user.IsActive,
            user.CreatedAt
        );
    }

    private string GenerateJwtToken(int userId, string email, string role, long permissions)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _configuration["Jwt:Secret"] ?? "LogiMasterSecretKey2026SuperSecure123!"));

        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.Role, role),
            new Claim("permissions", permissions.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"] ?? "LogiMaster",
            audience: _configuration["Jwt:Audience"] ?? "LogiMaster",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
