using LogiMaster.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LogiMaster.Infrastructure.Data.Configurations;

public class PackingListNfPdfConfiguration : IEntityTypeConfiguration<PackingListNfPdf>
{
    public void Configure(EntityTypeBuilder<PackingListNfPdf> builder)
    {
        builder.ToTable("PackingListNfPdfs");
        builder.HasKey(n => n.Id);
        builder.Property(n => n.NfNumber).IsRequired().HasMaxLength(100);
        builder.Property(n => n.PdfPath).IsRequired().HasMaxLength(500);
        builder.Property(n => n.CanhotoPath).HasMaxLength(500);

        builder.HasOne(n => n.PackingList)
            .WithMany(p => p.NfPdfs)
            .HasForeignKey(n => n.PackingListId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(n => n.PackingListId);
    }
}
