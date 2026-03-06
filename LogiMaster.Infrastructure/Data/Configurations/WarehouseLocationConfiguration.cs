using LogiMaster.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LogiMaster.Infrastructure.Data.Configurations;

public class WarehouseLocationConfiguration : IEntityTypeConfiguration<WarehouseLocation>
{
    public void Configure(EntityTypeBuilder<WarehouseLocation> builder)
    {
        builder.ToTable("WarehouseLocations");
        builder.HasKey(l => l.Id);

        builder.Property(l => l.Code).IsRequired().HasMaxLength(20);
        builder.Property(l => l.Street).IsRequired().HasMaxLength(10);
        builder.Property(l => l.Rack).IsRequired().HasMaxLength(10);
        builder.Property(l => l.Position).IsRequired().HasMaxLength(10);
        builder.Property(l => l.Description).HasMaxLength(500);

        builder.HasIndex(l => l.Code).IsUnique();
        builder.HasIndex(l => new { l.Street, l.Rack, l.Level, l.Position });
        builder.HasIndex(l => l.IsAvailable);
    }
}
