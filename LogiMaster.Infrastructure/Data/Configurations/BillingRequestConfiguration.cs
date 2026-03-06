using LogiMaster.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LogiMaster.Infrastructure.Data.Configurations;

public class BillingRequestConfiguration : IEntityTypeConfiguration<BillingRequest>
{
    public void Configure(EntityTypeBuilder<BillingRequest> builder)
    {
        builder.ToTable("BillingRequests");

        builder.HasKey(b => b.Id);

        builder.Property(b => b.Code)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(b => b.FileName)
            .HasMaxLength(500);

        builder.Property(b => b.TotalValue);

        builder.Property(b => b.Notes)
            .HasMaxLength(1000);

        builder.HasOne(b => b.ImportedBy)
            .WithMany()
            .HasForeignKey(b => b.ImportedById)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(b => b.Items)
            .WithOne(i => i.BillingRequest)
            .HasForeignKey(i => i.BillingRequestId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(b => b.Code)
            .IsUnique();

        builder.HasIndex(b => b.ImportedAt);
        builder.HasIndex(b => b.IsProcessed);
    }
}

public class BillingRequestItemConfiguration : IEntityTypeConfiguration<BillingRequestItem>
{
    public void Configure(EntityTypeBuilder<BillingRequestItem> builder)
    {
        builder.ToTable("BillingRequestItems");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.CustomerCode)
            .HasMaxLength(50);

        builder.Property(i => i.CustomerName)
            .HasMaxLength(200);

        builder.Property(i => i.ProductReference)
            .HasMaxLength(50);

        builder.Property(i => i.ProductDescription)
            .HasMaxLength(500);

        builder.Property(i => i.UnitPrice);

        builder.Property(i => i.TotalValue);

        builder.Property(i => i.Notes)
            .HasMaxLength(1000);

        builder.HasOne(i => i.Customer)
            .WithMany(c => c.BillingRequestItems)
            .HasForeignKey(i => i.CustomerId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(i => i.Product)
            .WithMany()
            .HasForeignKey(i => i.ProductId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(i => i.BillingRequestId);
        builder.HasIndex(i => i.CustomerId);
        builder.HasIndex(i => i.ProductId);
        builder.HasIndex(i => i.PendingQuantity);
    }
}
