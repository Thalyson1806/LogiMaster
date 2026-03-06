using LogiMaster.Application.Interfaces;
using LogiMaster.Application.Services;
using LogiMaster.Application.Services.Parsers;
using LogiMaster.Domain.Interfaces;
using LogiMaster.Infrastructure.Data.Repositories;

namespace LogiMaster.API.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Repositories
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // File Parsers
        services.AddScoped<IFileParserService, TxtParserService>();
        services.AddScoped<IFileParserService, PdfParserService>();
        services.AddScoped<IFileParserService, ExcelParserService>();
        services.AddScoped<ITxtParserService, TxtParserService>();

        // Application Services
        services.AddScoped<ICustomerService, CustomerService>();
        services.AddScoped<ICustomerProductService, CustomerProductService>();
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<IBillingRequestService, BillingRequestService>();
        services.AddScoped<IPackingListService, PackingListService>();
        services.AddScoped<IPackagingService, PackagingService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();

        // EDI Services
        services.AddScoped<IEdiClientService, EdiClientService>();
        services.AddScoped<IEdiRouteService, EdiRouteService>();
        services.AddScoped<IEdiProductService, EdiProductService>();
        services.AddScoped<IEdiConversionService, EdiConversionService>();
        services.AddScoped<EdiSeedService>();

        // EDI Parsers
        services.AddScoped<IEdiSpreadsheetParser, EdiParserDas>();
        services.AddScoped<IEdiSpreadsheetParser, EdiParserAmvian>();
        services.AddScoped<IEdiSpreadsheetParser, EdiParserCopo>();

        //Edi Migration
        services.AddScoped<EdiMigrationService>();

        //Geocoding
        services.AddHttpClient<IGeocodingService, GeocodingService>();


        return services;
    }
}
