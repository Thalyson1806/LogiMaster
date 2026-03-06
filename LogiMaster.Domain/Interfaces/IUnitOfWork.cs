namespace LogiMaster.Domain.Interfaces;

public interface IUnitOfWork : IDisposable
{
    ICustomerRepository Customers { get; }
    ICustomerProductRepository CustomerProducts { get; }

    IProductRepository Products { get; }
    IUserRepository Users { get; }
    IBillingRequestRepository BillingRequests { get; }
    IPackingListRepository PackingLists { get; }
    IPackagingRepository Packagings { get; }

    IEdiClientRepository EdiClients { get; }
    IEdiRouteRepository EdiRoutes { get; }
    IEdiProductRepository EdiProducts { get; }
    IEdiConversionRepository EdiConversions { get; }

    IEdifactFileRepository EdifactFiles { get; }
    IEdifactItemRepository EdifactItems { get; }

    IWarehouseStreetRepository WarehouseStreets { get; }
    IWarehouseLocationRepository WarehouseLocations { get; }
    IProductLocationRepository ProductLocations { get; }

    IStockMovementRepository StockMovements { get; }   // ← novo

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
}
