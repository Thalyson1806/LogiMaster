using LogiMaster.Application.DTOs;

namespace LogiMaster.Application.Interfaces;

public interface IEdiClientService
{
    Task<IEnumerable<EdiClientDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<EdiClientDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<EdiClientDto?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);
    Task<EdiClientDto> CreateAsync(CreateEdiClientDto dto, CancellationToken cancellationToken = default);
    Task<EdiClientDto?> UpdateAsync(int id, UpdateEdiClientDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
}
