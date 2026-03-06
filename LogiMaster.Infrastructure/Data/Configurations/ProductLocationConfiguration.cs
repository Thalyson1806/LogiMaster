using LogiMaster.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LogiMaster.Infrastructure.Data.Configurations;

public class ProductLocationConfiguration : IEntityTypeConfiguration<ProductLocation>
{
    public void Configure(EntityTypeBuilder<ProductLocation> builder)
    {
        builder.ToTable("ProductLocations");
        builder.HasKey(pl => pl.Id);

        builder.Property(pl => pl.Notes).HasMaxLength(500);

        builder.HasOne(pl => pl.Product)
            .WithMany(p => p.Locations)
            .HasForeignKey(pl => pl.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(pl => pl.WarehouseLocation)
            .WithMany(l => l.ProductLocations)
            .HasForeignKey(pl => pl.LocationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(pl => new { pl.ProductId, pl.LocationId }).IsUnique();
        builder.HasIndex(pl => pl.IsPrimary);
    }
}
