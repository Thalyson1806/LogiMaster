using LogiMaster.Application.DTOs;

namespace LogiMaster.Application.Interfaces;

public interface IEdiProductService
{
    Task<IEnumerable<EdiProductDto>> GetByClientIdAsync(int clientId, CancellationToken cancellationToken = default);
    Task<IEnumerable<EdiProductDto>> SearchAsync(int clientId, string term, CancellationToken cancellationToken = default);
    Task<EdiProductDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<EdiProductDto> CreateAsync(CreateEdiProductDto dto, CancellationToken cancellationToken = default);
    Task<EdiProductDto?> UpdateAsync(int id, UpdateEdiProductDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
    Task<int> ImportFromExcelAsync(int clientId, Stream fileStream, string fileName, CancellationToken cancellationToken = default);
}
