using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Interfaces;

namespace LogiMaster.Application.Services;

public class WarehouseService : IWarehouseService
{
    private readonly IUnitOfWork _unitOfWork;

    public WarehouseService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    // === STREETS ===
    public async Task<IEnumerable<WarehouseStreetDto>> GetAllStreetsAsync(CancellationToken ct = default)
    {
        var streets = await _unitOfWork.WarehouseStreets.GetAllWithLocationsAsync(ct);
        return streets.Select(s => new WarehouseStreetDto(
            s.Id, s.Code, s.Name, s.Description, s.SortOrder, s.RackCount, s.Color,
            s.Locations.Count(l => l.IsActive), s.IsActive, s.CreatedAt));
    }

    public async Task<WarehouseStreetDto?> GetStreetByIdAsync(int id, CancellationToken ct = default)
    {
        var street = await _unitOfWork.WarehouseStreets.GetByIdAsync(id, ct);
        if (street == null || !street.IsActive) return null;

        return new WarehouseStreetDto(
            street.Id, street.Code, street.Name, street.Description, street.SortOrder,
            street.RackCount, street.Color, street.Locations.Count(l => l.IsActive),
            street.IsActive, street.CreatedAt);
    }

    public async Task<WarehouseStreetDto> CreateStreetAsync(CreateWarehouseStreetDto dto, CancellationToken ct = default)
    {
        var exists = await _unitOfWork.WarehouseStreets.CodeExistsAsync(dto.Code, null, ct);
        if (exists) throw new InvalidOperationException($"Rua '{dto.Code}' já existe");

        var street = new WarehouseStreet(dto.Code, dto.Name, dto.SortOrder);
        street.Update(dto.Name, dto.Description, dto.SortOrder, dto.RackCount, dto.Color);

        await _unitOfWork.WarehouseStreets.AddAsync(street, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return new WarehouseStreetDto(
            street.Id, street.Code, street.Name, street.Description, street.SortOrder,
            street.RackCount, street.Color, 0, street.IsActive, street.CreatedAt);
    }

    public async Task<WarehouseStreetDto> UpdateStreetAsync(int id, UpdateWarehouseStreetDto dto, CancellationToken ct = default)
    {
        var street = await _unitOfWork.WarehouseStreets.GetByIdAsync(id, ct);
        if (street == null || !street.IsActive)
            throw new InvalidOperationException("Rua não encontrada");

        street.Update(dto.Name, dto.Description, dto.SortOrder, dto.RackCount, dto.Color);
        await _unitOfWork.SaveChangesAsync(ct);

        var locations = await _unitOfWork.WarehouseLocations.GetByStreetIdAsync(id, ct);
        return new WarehouseStreetDto(
            street.Id, street.Code, street.Name, street.Description, street.SortOrder,
            street.RackCount, street.Color, locations.Count(), street.IsActive, street.CreatedAt);
    }

    public async Task DeleteStreetAsync(int id, CancellationToken ct = default)
    {
        var street = await _unitOfWork.WarehouseStreets.GetByIdAsync(id, ct);
        if (street == null || !street.IsActive)
            throw new InvalidOperationException("Rua não encontrada");

        var locations = await _unitOfWork.WarehouseLocations.GetByStreetIdAsync(id, ct);
        if (locations.Any())
            throw new InvalidOperationException("Não é possível excluir rua com locais ativos");

        street.Deactivate();
        await _unitOfWork.SaveChangesAsync(ct);
    }

    // === LOCATIONS ===
    public async Task<IEnumerable<WarehouseLocationDto>> GetAllLocationsAsync(CancellationToken ct = default)
    {
        var locations = await _unitOfWork.WarehouseLocations.GetAllWithStreetAsync(ct);
        return locations.Select(l => new WarehouseLocationDto(
            l.Id, l.StreetId, l.WarehouseStreet.Name, l.Code, l.Street, l.Rack, l.Level, l.Position,
            l.Description, l.Capacity, l.IsAvailable, l.ProductLocations.Count(pl => pl.IsActive),
            l.IsActive, l.CreatedAt));
    }

    public async Task<IEnumerable<WarehouseLocationDto>> GetLocationsByStreetAsync(int streetId, CancellationToken ct = default)
    {
        var locations = await _unitOfWork.WarehouseLocations.GetByStreetIdAsync(streetId, ct);
        return locations.Select(l => new WarehouseLocationDto(
            l.Id, l.StreetId, l.WarehouseStreet.Name, l.Code, l.Street, l.Rack, l.Level, l.Position,
            l.Description, l.Capacity, l.IsAvailable, l.ProductLocations.Count(pl => pl.IsActive),
            l.IsActive, l.CreatedAt));
    }

    public async Task<WarehouseLocationDto?> GetLocationByIdAsync(int id, CancellationToken ct = default)
    {
        var location = await _unitOfWork.WarehouseLocations.GetByIdAsync(id, ct);
        if (location == null || !location.IsActive) return null;

        var street = await _unitOfWork.WarehouseStreets.GetByIdAsync(location.StreetId, ct);
        return new WarehouseLocationDto(
            location.Id, location.StreetId, street?.Name ?? "", location.Code, location.Street,
            location.Rack, location.Level, location.Position, location.Description, location.Capacity,
            location.IsAvailable, location.ProductLocations.Count(pl => pl.IsActive),
            location.IsActive, location.CreatedAt);
    }

    public async Task<WarehouseLocationDto?> GetLocationByCodeAsync(string code, CancellationToken ct = default)
    {
        var location = await _unitOfWork.WarehouseLocations.GetByCodeAsync(code, ct);
        if (location == null || !location.IsActive) return null;

        return new WarehouseLocationDto(
            location.Id, location.StreetId, location.WarehouseStreet.Name, location.Code,
            location.Street, location.Rack, location.Level, location.Position, location.Description,
            location.Capacity, location.IsAvailable, location.ProductLocations.Count(pl => pl.IsActive),
            location.IsActive, location.CreatedAt);
    }

    public async Task<WarehouseLocationDto> CreateLocationAsync(CreateWarehouseLocationDto dto, CancellationToken ct = default)
    {
        var street = await _unitOfWork.WarehouseStreets.GetByIdAsync(dto.StreetId, ct);
        if (street == null || !street.IsActive)
            throw new InvalidOperationException("Rua não encontrada");

        var location = new WarehouseLocation(dto.StreetId, dto.Street, dto.Rack, dto.Level, dto.Position);

        var exists = await _unitOfWork.WarehouseLocations.CodeExistsAsync(location.Code, null, ct);
        if (exists) throw new InvalidOperationException($"Local '{location.Code}' já existe");

        if (dto.Description != null || dto.Capacity != null)
            location.Update(dto.Description, dto.Capacity, true);

        await _unitOfWork.WarehouseLocations.AddAsync(location, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return new WarehouseLocationDto(
            location.Id, location.StreetId, street.Name, location.Code, location.Street,
            location.Rack, location.Level, location.Position, location.Description,
            location.Capacity, location.IsAvailable, 0, location.IsActive, location.CreatedAt);
    }

    public async Task<IEnumerable<WarehouseLocationDto>> BulkCreateLocationsAsync(BulkCreateLocationsDto dto, CancellationToken ct = default)
    {
        var street = await _unitOfWork.WarehouseStreets.GetByIdAsync(dto.StreetId, ct);
        if (street == null || !street.IsActive)
            throw new InvalidOperationException("Rua não encontrada");

        var locations = new List<WarehouseLocation>();

        for (int rack = dto.RackStart; rack <= dto.RackEnd; rack++)
        {
            for (int level = dto.LevelStart; level <= dto.LevelEnd; level++)
            {
                for (int pos = dto.PositionStart; pos <= dto.PositionEnd; pos++)
                {
                    var location = new WarehouseLocation(
                        dto.StreetId, dto.Street, rack.ToString(), level, pos.ToString());

                    var exists = await _unitOfWork.WarehouseLocations.CodeExistsAsync(location.Code, null, ct);
                    if (!exists) locations.Add(location);
                }
            }
        }

        if (locations.Count == 0)
            throw new InvalidOperationException("Todos os locais já existem");

        foreach (var loc in locations)
            await _unitOfWork.WarehouseLocations.AddAsync(loc, ct);

        await _unitOfWork.SaveChangesAsync(ct);

        return locations.Select(l => new WarehouseLocationDto(
            l.Id, l.StreetId, street.Name, l.Code, l.Street, l.Rack, l.Level, l.Position,
            l.Description, l.Capacity, l.IsAvailable, 0, l.IsActive, l.CreatedAt));
    }

    public async Task DeleteLocationAsync(int id, CancellationToken ct = default)
    {
        var location = await _unitOfWork.WarehouseLocations.GetByIdAsync(id, ct);
        if (location == null || !location.IsActive)
            throw new InvalidOperationException("Local não encontrado");

        var hasProducts = await _unitOfWork.WarehouseLocations.HasProductsAsync(id, ct);
        if (hasProducts)
            throw new InvalidOperationException("Não é possível excluir local com produtos vinculados");

        location.Deactivate();
        await _unitOfWork.SaveChangesAsync(ct);
    }

    // === PRODUCT LOCATIONS ===
    public async Task<IEnumerable<ProductLocationDto>> GetProductLocationsAsync(int? productId = null, int? locationId = null, CancellationToken ct = default)
    {
        var productLocations = await _unitOfWork.ProductLocations.GetAllWithDetailsAsync(productId, locationId, ct);

        return productLocations
            .Where(pl => pl.IsActive)
            .Select(pl => new ProductLocationDto(
                pl.Id, pl.ProductId, pl.Product.Reference, pl.Product.Description,
                pl.LocationId, pl.WarehouseLocation.Code, pl.IsPrimary, pl.Quantity, pl.Notes));
    }

    public async Task<ProductLocationDto> AssignProductLocationAsync(AssignProductLocationDto dto, CancellationToken ct = default)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(dto.ProductId, ct);
        if (product == null || !product.IsActive)
            throw new InvalidOperationException("Produto não encontrado");

        var location = await _unitOfWork.WarehouseLocations.GetByIdAsync(dto.LocationId, ct);
        if (location == null || !location.IsActive)
            throw new InvalidOperationException("Local não encontrado");

        var existing = await _unitOfWork.ProductLocations.GetByProductAndLocationAsync(dto.ProductId, dto.LocationId, ct);
        if (existing != null && existing.IsActive)
            throw new InvalidOperationException("Produto já vinculado a este local");

        if (dto.IsPrimary)
            await _unitOfWork.ProductLocations.ClearPrimaryForProductAsync(dto.ProductId, ct);

        var productLocation = new ProductLocation(dto.ProductId, dto.LocationId, dto.IsPrimary);
        productLocation.Update(dto.IsPrimary, dto.Quantity, dto.Notes);

        await _unitOfWork.ProductLocations.AddAsync(productLocation, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return new ProductLocationDto(
            productLocation.Id, product.Id, product.Reference, product.Description,
            location.Id, location.Code, productLocation.IsPrimary, productLocation.Quantity, productLocation.Notes);
    }

    public async Task DeleteProductLocationAsync(int id, CancellationToken ct = default)
    {
        var pl = await _unitOfWork.ProductLocations.GetByIdAsync(id, ct);
        if (pl == null || !pl.IsActive)
            throw new InvalidOperationException("Vínculo não encontrado");

        pl.Deactivate();
        await _unitOfWork.SaveChangesAsync(ct);
    }

    // === MAP ===
    public async Task<WarehouseMapDto> GetWarehouseMapAsync(CancellationToken ct = default)
    {
        var streets = await GetAllStreetsAsync(ct);
        var locations = await GetAllLocationsAsync(ct);

        var occupiedCount = locations.Count(l => l.ProductCount > 0);

        return new WarehouseMapDto(
            streets, locations, streets.Count(), locations.Count(),
            occupiedCount, locations.Count() - occupiedCount);
    }
}
