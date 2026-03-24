using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Enums;
using LogiMaster.Infrastructure.Data.Configurations;
using Microsoft.EntityFrameworkCore;

namespace LogiMaster.Infrastructure.Data.Context;

public class LogiMasterDbContext : DbContext
{
    public LogiMasterDbContext(DbContextOptions<LogiMasterDbContext> options) : base(options)
    {
    }
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<CustomerProduct> CustomerProducts => Set<CustomerProduct>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<User> Users => Set<User>();
    public DbSet<BillingRequest> BillingRequests => Set<BillingRequest>();
    public DbSet<BillingRequestItem> BillingRequestItems => Set<BillingRequestItem>();
    public DbSet<PackingList> PackingLists => Set<PackingList>();
    public DbSet<PackingListItem> PackingListItems => Set<PackingListItem>();
    public DbSet<PackingListNfPdf> PackingListNfPdfs { get; set; } = null!;

    
    // ===== Embalagens =====
    public DbSet<Packaging> Packagings => Set<Packaging>();
    public DbSet<PackagingType> PackagingTypes => Set<PackagingType>();

        // ===== EDI =====
    public DbSet<EdiClient> EdiClients => Set<EdiClient>();
    public DbSet<EdiRoute> EdiRoutes => Set<EdiRoute>();
    public DbSet<EdiProduct> EdiProducts => Set<EdiProduct>();
    public DbSet<EdiConversion> EdiConversions => Set<EdiConversion>();

    public DbSet<EdifactFile> EdifactFiles => Set<EdifactFile>();
    public DbSet<EdifactItem> EdifactItems => Set<EdifactItem>();

    

    // ===== Endereçamento =====
    public DbSet<WarehouseStreet> WarehouseStreets => Set<WarehouseStreet>();
    public DbSet<WarehouseLocation> WarehouseLocations => Set<WarehouseLocation>();
    public DbSet<ProductLocation> ProductLocations => Set<ProductLocation>();


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
         

         modelBuilder.ApplyConfiguration(new PackingListNfPdfConfiguration());

        // Apply all configurations from assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(LogiMasterDbContext).Assembly);

        // ===== Configuração do relacionamento Product -> Packaging =====
        modelBuilder.Entity<Product>()
            .HasOne(p => p.DefaultPackaging)
            .WithMany(pkg => pkg.Products)
            .HasForeignKey(p => p.DefaultPackagingId)
            .OnDelete(DeleteBehavior.SetNull);

        // ===== Configuração do relacionamento Packaging -> PackagingType =====
        modelBuilder.Entity<Packaging>()
            .HasOne(p => p.PackagingType)
            .WithMany(pt => pt.Packagings)
            .HasForeignKey(p => p.PackagingTypeId)
            .OnDelete(DeleteBehavior.Restrict);


        // ===== Seed de tipos de embalagem padrão =====
        modelBuilder.Entity<PackagingType>().HasData(
            new { Id = 1, Code = "CAIXA", Name = "Caixa", Description = "Caixa de papelão ou plástico", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = (DateTime?)null },
            new { Id = 2, Code = "PALETE", Name = "Palete", Description = "Palete de madeira ou plástico", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = (DateTime?)null },
            new { Id = 3, Code = "SACOLA", Name = "Sacola", Description = "Sacola plástica", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = (DateTime?)null },
            new { Id = 4, Code = "ENGRADADO", Name = "Engradado", Description = "Engradado de plástico ou madeira", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = (DateTime?)null },
            new { Id = 5, Code = "TAMBOR", Name = "Tambor", Description = "Tambor metálico ou plástico", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = (DateTime?)null },
            new { Id = 6, Code = "OUTRO", Name = "Outro", Description = "Outro tipo de embalagem", IsActive = true, CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = (DateTime?)null }
        );

        // Seed do usuario padrao (admin)
        modelBuilder.Entity<User>().HasData(
            new
            {
                Id = 1,
                Name = "Administrator",
                Email = "admin@suaempresa.com",
                PasswordHash = "admin123",
                Role = UserRole.Administrator,
                Department = "T.I",
                IsActive = true,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = (DateTime?)null,
                LastAccessAt = (DateTime?)null
            }
        );
    }
}
