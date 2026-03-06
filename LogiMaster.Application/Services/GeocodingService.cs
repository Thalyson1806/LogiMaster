using System.Text.Json;
using System.Text.Json.Serialization;
using LogiMaster.Application.Interfaces;
using LogiMaster.Domain.Interfaces;
using Microsoft.Extensions.Configuration;

namespace LogiMaster.Application.Services;

public class GeocodingService : IGeocodingService
{
    private readonly HttpClient _httpClient;
    private readonly IUnitOfWork _unitOfWork;
    private readonly string _apiKey;

    public GeocodingService(HttpClient httpClient, IUnitOfWork unitOfWork, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _unitOfWork = unitOfWork;
        _apiKey = configuration["TomTomApiKey"] ?? throw new InvalidOperationException("TomTomApiKey não configurada.");
    }

    public async Task<GeocodingResult?> GeocodeAddressAsync(string address, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(address))
            return null;

        try
        {
            var encoded = Uri.EscapeDataString(address + ", Brasil");
            var url = $"https://api.tomtom.com/search/2/geocode/{encoded}.json?key={_apiKey}&countrySet=BR&limit=1";

            var response = await _httpClient.GetAsync(url, ct);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync(ct);
            var root = JsonSerializer.Deserialize<TomTomResponse>(json);

            var result = root?.Results?.FirstOrDefault();
            if (result?.Position is null)
                return null;

            return new GeocodingResult(
                result.Position.Lat,
                result.Position.Lon,
                result.Address?.FreeformAddress ?? address
            );
        }
        catch
        {
            return null;
        }
    }

    public async Task<int> GeocodeAllCustomersAsync(CancellationToken ct = default)
    {
        var customers = await _unitOfWork.Customers.GetAllAsync(ct);
        var pending = customers.Where(c => !c.HasCoordinates && !string.IsNullOrWhiteSpace(c.FullAddress));

        int geocoded = 0;
        foreach (var customer in pending)
        {
            var result = await GeocodeAddressAsync(customer.FullAddress, ct);
            if (result != null)
            {
                customer.SetCoordinates(result.Latitude, result.Longitude);
                geocoded++;
            }
        }

        await _unitOfWork.SaveChangesAsync(ct);
        return geocoded;
    }

    // Modelos da resposta TomTom
    private class TomTomResponse
    {
        [JsonPropertyName("results")]
        public List<TomTomResult>? Results { get; set; }
    }

    private class TomTomResult
    {
        [JsonPropertyName("position")]
        public TomTomPosition? Position { get; set; }

        [JsonPropertyName("address")]
        public TomTomAddress? Address { get; set; }
    }

    private class TomTomPosition
    {
        [JsonPropertyName("lat")]
        public double Lat { get; set; }

        [JsonPropertyName("lon")]
        public double Lon { get; set; }
    }

    private class TomTomAddress
    {
        [JsonPropertyName("freeformAddress")]
        public string? FreeformAddress { get; set; }
    }
}
