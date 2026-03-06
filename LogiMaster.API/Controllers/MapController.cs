using Microsoft.AspNetCore.Mvc;
using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using LogiMaster.Domain.Interfaces;

using Microsoft.AspNetCore.Authorization;

namespace LogiMaster.API.Controllers;

[Authorize(Policy = "Module.Mapa")]
[ApiController]
[Route("api/[controller]")]
public class MapController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IGeocodingService _geocodingService;

    public MapController(IUnitOfWork unitOfWork, IGeocodingService geocodingService)
    {
        _unitOfWork = unitOfWork;
        _geocodingService = geocodingService;
    }

    [HttpGet("customers")]
    public async Task<ActionResult<IEnumerable<CustomerMapDto>>> GetCustomersForMap(CancellationToken ct)
    {
        var customers = await _unitOfWork.Customers.GetAllAsync(ct);
        var packingLists = await _unitOfWork.PackingLists.GetAllAsync(ct);

        var customersWithCoords = customers
            .Where(c => c.HasCoordinates && c.IsActive)
            .Select(c =>
            {
                var pending = packingLists
                    .Where(p => p.CustomerId == c.Id && 
                           p.Status != Domain.Enums.PackingListStatus.Invoiced &&
                           p.Status != Domain.Enums.PackingListStatus.Cancelled)
                    .ToList();

                return new CustomerMapDto(
                    c.Id,
                    c.Code,
                    c.Name,
                    c.City,
                    c.State,
                    c.Latitude!.Value,
                    c.Longitude!.Value,
                    pending.Count,
                    pending.Sum(p => p.TotalValue)
                );
            });

        return Ok(customersWithCoords);
    }

    [HttpGet("deliveries")]
    public async Task<ActionResult> GetDeliveriesForMap([FromQuery] string? status, CancellationToken ct)
    {
        var packingLists = await _unitOfWork.PackingLists.GetAllAsync(ct);
        var customers = await _unitOfWork.Customers.GetAllAsync(ct);

        var query = packingLists.AsEnumerable();

        if (!string.IsNullOrEmpty(status))
        {
            if (Enum.TryParse<Domain.Enums.PackingListStatus>(status, out var statusEnum))
            {
                query = query.Where(p => p.Status == statusEnum);
            }
        }
        else
        {
            // Por padrão, mostrar apenas não faturados e não cancelados
            query = query.Where(p => 
                p.Status != Domain.Enums.PackingListStatus.Invoiced &&
                p.Status != Domain.Enums.PackingListStatus.Cancelled);
        }

        var deliveries = query
            .Select(p =>
            {
                var customer = customers.FirstOrDefault(c => c.Id == p.CustomerId);
                return new
                {
                    p.Id,
                    p.Code,
                    CustomerId = p.CustomerId,
                    CustomerCode = customer?.Code,
                    CustomerName = customer?.Name,
                    CustomerCity = customer?.City,
                    Latitude = customer?.Latitude,
                    Longitude = customer?.Longitude,
                    Status = p.Status.ToString(),
                    p.TotalValue,
                    p.TotalItems,
                    p.RequestedAt
                };
            })
            .Where(d => d.Latitude.HasValue && d.Longitude.HasValue);

        return Ok(deliveries);
    }

    [HttpPost("geocode/{customerId}")]
    public async Task<ActionResult> GeocodeCustomer(int customerId, CancellationToken ct)
    {
        var customer = await _unitOfWork.Customers.GetByIdAsync(customerId, ct);
        if (customer == null)
            return NotFound();

        if (string.IsNullOrWhiteSpace(customer.FullAddress))
            return BadRequest(new { error = "Cliente não possui endereço cadastrado" });

        var result = await _geocodingService.GeocodeAddressAsync(customer.FullAddress, ct);
        if (result == null)
            return BadRequest(new { error = "Não foi possível geocodificar o endereço" });

        customer.SetCoordinates(result.Latitude, result.Longitude);
        _unitOfWork.Customers.Update(customer);
        await _unitOfWork.SaveChangesAsync(ct);

        return Ok(new
        {
            latitude = result.Latitude,
            longitude = result.Longitude,
            displayName = result.DisplayName
        });
    }

    [HttpPost("geocode-all")]
    public async Task<ActionResult> GeocodeAllCustomers(CancellationToken ct)
    {
        var count = await _geocodingService.GeocodeAllCustomersAsync(ct);
        return Ok(new { message = $"{count} clientes geocodificados" });
    }
}
