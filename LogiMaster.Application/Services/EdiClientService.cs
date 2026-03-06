using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Interfaces;

namespace LogiMaster.Application.Services;

public class EdiClientService : IEdiClientService
{
    private readonly IUnitOfWork _unitOfWork;

    public EdiClientService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<EdiClientDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var clients = await _unitOfWork.EdiClients.GetAllAsync(cancellationToken);
        return clients.Where(c => c.IsActive).Select(MapToDto);
    }

    public async Task<EdiClientDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var client = await _unitOfWork.EdiClients.GetByIdAsync(id, cancellationToken);
        return client != null ? MapToDto(client) : null;
    }

    public async Task<EdiClientDto?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        var client = await _unitOfWork.EdiClients.GetByCodeAsync(code, cancellationToken);
        return client != null ? MapToDto(client) : null;
    }

    public async Task<EdiClientDto> CreateAsync(CreateEdiClientDto dto, CancellationToken cancellationToken = default)
    {
        var client = new EdiClient(dto.Code, dto.Name);

        client.Update(
            dto.Name,
            dto.Description,
            dto.EdiCode,
            dto.CustomerId,
            dto.SpreadsheetConfigJson ?? "{}",
            dto.DeliveryRulesJson ?? "{}",
            dto.FileType ?? "xlsx"
        );

        await _unitOfWork.EdiClients.AddAsync(client, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(client);
    }

    public async Task<EdiClientDto?> UpdateAsync(int id, UpdateEdiClientDto dto, CancellationToken cancellationToken = default)
    {
        var client = await _unitOfWork.EdiClients.GetByIdAsync(id, cancellationToken);
        if (client == null) return null;

        client.Update(
            dto.Name,
            dto.Description,
            dto.EdiCode,
            dto.CustomerId,
            dto.SpreadSheetConfigJson ?? client.SpreadsheetConfigJson,
            dto.DeliveryRulesJson ?? client.DeliveryRulesJson,
            dto.FileType ?? client.FileType
        );

        _unitOfWork.EdiClients.Update(client);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDto(client);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var client = await _unitOfWork.EdiClients.GetByIdAsync(id, cancellationToken);
        if (client == null) return false;

        client.Deactivate();
        _unitOfWork.EdiClients.Update(client);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }

    private static EdiClientDto MapToDto(EdiClient client) => new(
        client.Id,
        client.Code,
        client.Name,
        client.Description,
        client.EdiCode,
        client.CustomerId,
        client.Customer?.Name,
        client.SpreadsheetConfigJson,
        client.DeliveryRulesJson,
        client.FileType,
        client.Routes?.Count ?? 0,
        client.Products?.Count ?? 0,
        client.IsActive,
        client.CreatedAt
    );
}
