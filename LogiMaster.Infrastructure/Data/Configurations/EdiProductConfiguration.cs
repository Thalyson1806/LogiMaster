using LogiMaster.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;


namespace LogiMaster.Infrastructure.Data.Configurations;

public class EdiProductConfiguration : IEntityTypeConfiguration<EdiProduct>
{
    public void Configure(EntityTypeBuilder<EdiProduct> builder)
    {
        builder.ToTable("EdiProducts");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Description)
        .IsRequired()
        .HasMaxLength(500);

        builder.Property(e => e.Reference)
        .HasMaxLength(100);

        builder.Property(e => e.Code)
        .HasMaxLength(100);

        builder.Property(e => e.Value)
        .HasPrecision(18, 2);

        builder.HasOne(e => e.Client)
        .WithMany( c => c.Products)
        .HasForeignKey (e => e.EdiClientId)
        .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(e => e.Product)
        .WithMany()
        .HasForeignKey(e => e.ProductId)
        .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(e => new { e.EdiClientId, e.Description});
        builder.HasIndex(e => e.IsActive);
    }
}