namespace LogiMaster.Application.Interfaces;

public interface IGeocodingService
{
    Task<GeocodingResult?> GeocodeAddressAsync(string address, CancellationToken ct = default);
    Task<int> GeocodeAllCustomersAsync(CancellationToken ct = default);
}

public record GeocodingResult(double Latitude, double Longitude, string DisplayName);
