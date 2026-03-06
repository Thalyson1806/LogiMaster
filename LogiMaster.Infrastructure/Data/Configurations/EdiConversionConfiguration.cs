using LogiMaster.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LogiMaster.Infrastructure.Data.Configurations;

public class EdiConversionConfiguration : IEntityTypeConfiguration<EdiConversion>
{
    public void Configure(EntityTypeBuilder<EdiConversion> builder)
    {
        builder.ToTable("EdiConversions");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Code)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(e => e.InputFileName)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(e => e.OutputFileName)
            .HasMaxLength(500);

        builder.Property(e => e.ErrorMessage)
            .HasMaxLength(2000);

        builder.Property(e => e.Notes)
            .HasMaxLength(1000);

        builder.HasOne(e => e.Client)
            .WithMany(c => c.Conversions)
            .HasForeignKey(e => e.EdiClientId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Route)
            .WithMany()
            .HasForeignKey(e => e.EdiRouteId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.ConvertedBy)
            .WithMany()
            .HasForeignKey(e => e.ConvertedById)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(e => e.Code).IsUnique();
        builder.HasIndex(e => e.ConvertedAt);
        builder.HasIndex(e => e.Status);
        builder.HasIndex(e => e.EdiClientId);
    }
}
