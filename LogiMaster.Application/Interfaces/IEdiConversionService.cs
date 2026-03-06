using LogiMaster.Application.DTOs;

namespace LogiMaster.Application.Interfaces;

public interface IEdiConversionService
{
    Task<IEnumerable<EdiConversionDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<EdiConversionDto>> GetByClientIdAsync(int clientId, CancellationToken cancellationToken = default);
    Task<EdiConversionDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    
    Task<EdiConversionResultDto> ConvertAsync(
        Stream inputFile, 
        string fileName, 
        int clientId, 
        int routeId,
        DateTime? startDate, 
        DateTime? endDate, 
        int? userId, 
        CancellationToken cancellationToken = default);
    
    Task<(byte[] Content, string FileName)> DownloadAsync(int conversionId, CancellationToken cancellationToken = default);
}
