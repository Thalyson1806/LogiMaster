using LogiMaster.Domain.Interfaces;
using LogiMaster.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore.Storage;

namespace LogiMaster.Infrastructure.Data.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly LogiMasterDbContext _context;
    private IDbContextTransaction? _transaction;

    private ICustomerRepository? _customers;
    private ICustomerProductRepository? _customerProducts;
    private IProductRepository? _products;
    private IUserRepository? _users;
    private IBillingRequestRepository? _billingRequests;
    private IPackingListRepository? _packingLists;
    private IEdiClientRepository? _ediClients;
    private IEdiRouteRepository? _ediRoutes;
    private IEdiProductRepository? _ediProducts;
    private IEdiConversionRepository? _ediConversions;
    private IEdifactFileRepository? _edifactFiles;
    private IEdifactItemRepository? _edifactItems;
    private IWarehouseStreetRepository? _warehouseStreets;
    private IWarehouseLocationRepository? _warehouseLocations;
    private IProductLocationRepository? _productLocations;
    private IStockMovementRepository? _stockMovements;
 
    // ===== NOVO: Repositório de Embalagens =====
    private IPackagingRepository? _packagings;

    public UnitOfWork(LogiMasterDbContext context)
    {
        _context = context;
    }

    public ICustomerRepository Customers =>
        _customers ??= new CustomerRepository(_context);

    public ICustomerProductRepository CustomerProducts =>
        _customerProducts ??= new CustomerProductRepository(_context);

    public IProductRepository Products =>
        _products ??= new ProductRepository(_context);

    public IUserRepository Users =>
        _users ??= new UserRepository(_context);

    public IBillingRequestRepository BillingRequests =>
        _billingRequests ??= new BillingRequestRepository(_context);

    public IPackingListRepository PackingLists =>
        _packingLists ??= new PackingListRepository(_context);

    // ===== NOVO: Propriedade para Embalagens =====
    public IPackagingRepository Packagings =>
        _packagings ??= new PackagingRepository(_context);

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        _transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
    }

    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction is not null)
        {
            await _transaction.CommitAsync(cancellationToken);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction is not null)
        {
            await _transaction.RollbackAsync(cancellationToken);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }
        // ===== EDI =====
    public IEdiClientRepository EdiClients => 
        _ediClients ??= new EdiClientRepository(_context);
    
    public IEdiRouteRepository EdiRoutes => 
        _ediRoutes ??= new EdiRouteRepository(_context);
    
    public IEdiProductRepository EdiProducts => 
        _ediProducts ??= new EdiProductRepository(_context);
    
    public IEdiConversionRepository EdiConversions => 
        _ediConversions ??= new EdiConversionRepository(_context);

        //endereçamento
     
    public IWarehouseStreetRepository WarehouseStreets =>
        _warehouseStreets ??= new WarehouseStreetRepository(_context);

    public IWarehouseLocationRepository WarehouseLocations =>
        _warehouseLocations ??= new WarehouseLocationRepository(_context);

    public IProductLocationRepository ProductLocations =>
        _productLocations ??= new ProductLocationRepository(_context);
    
    
        public IEdifactFileRepository EdifactFiles =>
    _edifactFiles ??= new EdifactFileRepository(_context);

    public IEdifactItemRepository EdifactItems =>

        _edifactItems ??= new EdifactItemRepository(_context);
        public IStockMovementRepository StockMovements =>
    _stockMovements ??= new StockMovementRepository(_context);



    public void Dispose()
    {
        _transaction?.Dispose();
        _context.Dispose();
    }
}


