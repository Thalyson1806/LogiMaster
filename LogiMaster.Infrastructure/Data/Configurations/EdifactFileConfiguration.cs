using LogiMaster.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LogiMaster.Infrastructure.Data.Configurations;

public class EdifactFileConfiguration : IEntityTypeConfiguration<EdifactFile>
{
    public void Configure(EntityTypeBuilder<EdifactFile> builder)
    {
        builder.ToTable("EdifactFiles");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.FileName).IsRequired().HasMaxLength(255);
        builder.Property(e => e.OriginalFileName).IsRequired().HasMaxLength(500);
        builder.Property(e => e.ErrorMessage).HasMaxLength(2000);
        builder.Property(e => e.RawContent).HasColumnType("TEXT");

        builder.HasOne(e => e.Customer)
            .WithMany()
            .HasForeignKey(e => e.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(e => e.Items)
            .WithOne(i => i.EdifactFile)
            .HasForeignKey(i => i.EdifactFileId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => e.Status);
        builder.HasIndex(e => e.ReceivedAt);
        builder.HasIndex(e => e.CustomerId);
        builder.HasIndex(e => new { e.CustomerId, e.Status });
    }
}
