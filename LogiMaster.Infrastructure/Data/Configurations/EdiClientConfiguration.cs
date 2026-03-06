using LogiMaster.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;


namespace LogiMaster.Infrastructure.Data.Configurations;

public class EdiClientConfiguration : IEntityTypeConfiguration<EdiClient>
{
    public void Configure(EntityTypeBuilder<EdiClient> builder)
    {
        builder.ToTable("EdiClients");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Code)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.Description)
            .HasMaxLength(500);

        builder.Property(e => e.EdiCode)
            .HasMaxLength(20);

        builder.Property(e => e.SpreadsheetConfigJson)
            .IsRequired();

        builder.Property(e => e.DeliveryRulesJson)
            .IsRequired();

        builder.Property(e => e.FileType)
            .IsRequired()
            .HasMaxLength(10);

        builder.HasOne(e => e.Customer)
            .WithMany()
            .HasForeignKey(e => e.CustomerId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        builder.HasIndex(e => e.Code).IsUnique();
        builder.HasIndex(e => e.IsActive);
        builder.HasIndex(e => e.EdiCode);
        builder.HasIndex(e => e.CustomerId);
    }
}
