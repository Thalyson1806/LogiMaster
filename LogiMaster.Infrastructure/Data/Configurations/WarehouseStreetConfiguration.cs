using LogiMaster.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LogiMaster.Infrastructure.Data.Configurations;

public class WarehouseStreetConfiguration : IEntityTypeConfiguration<WarehouseStreet>
{
    public void Configure(EntityTypeBuilder<WarehouseStreet> builder)
    {
        builder.ToTable("WarehouseStreets");
        builder.HasKey(s => s.Id);

        builder.Property(s => s.Code).IsRequired().HasMaxLength(10);
        builder.Property(s => s.Name).IsRequired().HasMaxLength(100);
        builder.Property(s => s.Description).HasMaxLength(500);
        builder.Property(s => s.Color).HasMaxLength(20);

        builder.HasMany(s => s.Locations)
            .WithOne(l => l.WarehouseStreet)
            .HasForeignKey(l => l.StreetId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(s => s.Code).IsUnique();
        builder.HasIndex(s => s.SortOrder);
    }
}
