using LogiMaster.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LogiMaster.Infrastructure.Data.Configurations;

public class EdiRouteConfiguration : IEntityTypeConfiguration<EdiRoute>
{
    public void Configure(EntityTypeBuilder<EdiRoute> builder)
    {
        builder.ToTable("EdiRoutes");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Code)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.RouteType)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(e => e.DaysOfWeekJson)
            .HasMaxLength(100);

        builder.Property(e => e.Description)
            .HasMaxLength(500);

        builder.HasOne(e => e.Client)
            .WithMany(c => c.Routes)
            .HasForeignKey(e => e.EdiClientId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => new { e.EdiClientId, e.Code }).IsUnique();
        builder.HasIndex(e => e.IsActive);
    }
}
