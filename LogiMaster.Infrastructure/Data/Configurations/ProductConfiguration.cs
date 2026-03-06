using LogiMaster.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LogiMaster.Infrastructure.Data.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Reference)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(p => p.Description)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(p => p.UnitsPerBox)
            .IsRequired()
            .HasDefaultValue(1);

        builder.Property(p => p.UnitWeight);

        builder.Property(p => p.UnitPrice);

        builder.Property(p => p.Barcode)
            .HasMaxLength(50);

        builder.Property(p => p.Notes)
            .HasMaxLength(1000);

        builder.HasIndex(p => p.Reference)
            .IsUnique();

        builder.HasIndex(p => p.Description);
        builder.HasIndex(p => p.IsActive);
    }
}
