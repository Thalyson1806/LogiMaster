using LogiMaster.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LogiMaster.Infrastructure.Data.Configurations;

public class EdifactItemConfiguration : IEntityTypeConfiguration<EdifactItem>
{
    public void Configure(EntityTypeBuilder<EdifactItem> builder)
    {
        builder.ToTable("EdifactItems");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.ItemCode).IsRequired().HasMaxLength(100);
        builder.Property(e => e.BuyerItemCode).HasMaxLength(100);
        builder.Property(e => e.SupplierItemCode).HasMaxLength(100);
        builder.Property(e => e.Description).HasMaxLength(500);
        builder.Property(e => e.UnitOfMeasure).HasMaxLength(20);
        builder.Property(e => e.DeliveryLocation).HasMaxLength(200);
        builder.Property(e => e.DocumentNumber).HasMaxLength(100);
        builder.Property(e => e.ErrorMessage).HasMaxLength(1000);
        builder.Property(e => e.Quantity).HasPrecision(18, 4);

        builder.HasOne(e => e.Product)
            .WithMany()
            .HasForeignKey(e => e.ProductId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(e => e.EdifactFileId);
        builder.HasIndex(e => e.ItemCode);
        builder.HasIndex(e => e.ProductId);
        builder.HasIndex(e => e.IsProcessed);
        builder.HasIndex(e => new { e.DeliveryStart, e.DeliveryEnd });
    }
}
