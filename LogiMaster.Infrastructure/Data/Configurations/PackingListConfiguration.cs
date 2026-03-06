using LogiMaster.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LogiMaster.Infrastructure.Data.Configurations;

public class PackingListConfiguration : IEntityTypeConfiguration<PackingList>
{
    public void Configure(EntityTypeBuilder<PackingList> builder)
    {
        builder.ToTable("PackingLists");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Code)
            .IsRequired()
            .HasMaxLength(50);
      
        builder.Property(p => p.DriverName)
            .HasMaxLength(200);

        builder.Property(p => p.DeliverySignaturePath)
            .HasMaxLength(500);

        builder.Property(p => p.InvoicePdfPath)
            .HasMaxLength(500);

        builder.Property(p => p.CanhotoPath)
            .HasMaxLength(500);


        builder.Property(p => p.Status)
            .IsRequired();

        builder.Property(p => p.TotalWeight);

        builder.Property(p => p.TotalValue);

        builder.Property(p => p.InvoiceNumber)
            .HasMaxLength(50);

        builder.Property(p => p.Notes)
            .HasMaxLength(1000);

        builder.HasOne(p => p.Customer)
            .WithMany(c => c.PackingLists)
            .HasForeignKey(p => p.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.BillingRequest)
            .WithMany()
            .HasForeignKey(p => p.BillingRequestId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(p => p.CreatedBy)
            .WithMany(u => u.CreatedPackingLists)
            .HasForeignKey(p => p.CreatedById)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(p => p.SeparatedBy)
            .WithMany(u => u.SeparatedPackingLists)
            .HasForeignKey(p => p.SeparatedById)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(p => p.ConferencedBy)
            .WithMany(u => u.ConferencedPackingLists)
            .HasForeignKey(p => p.ConferencedById)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(p => p.InvoicedBy)
            .WithMany(u => u.InvoicedPackingLists)
            .HasForeignKey(p => p.InvoicedById)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(p => p.Items)
            .WithOne(i => i.PackingList)
            .HasForeignKey(i => i.PackingListId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(p => p.Code)
            .IsUnique();

        builder.HasIndex(p => p.Status);
        builder.HasIndex(p => p.CustomerId);
        builder.HasIndex(p => p.RequestedAt);
        builder.HasIndex(p => p.InvoiceNumber);
    }
}

public class PackingListItemConfiguration : IEntityTypeConfiguration<PackingListItem>
{
    public void Configure(EntityTypeBuilder<PackingListItem> builder)
    {
        builder.ToTable("PackingListItems");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Reference)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(i => i.Description)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(i => i.Batch)
            .HasMaxLength(50);
            

        builder.Property(i => i.UnitPrice);

        builder.Property(i => i.TotalValue);

        builder.Property(i => i.UnitWeight);

        builder.Property(i => i.TotalWeight);

        builder.Property(i => i.Notes)
            .HasMaxLength(1000);
            

        builder.HasOne(i => i.Product)
            .WithMany(p => p.PackingListItems)
            .HasForeignKey(i => i.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(i => i.BillingRequestItem)
            .WithMany()
            .HasForeignKey(i => i.BillingRequestItemId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(i => i.PackingListId);
        builder.HasIndex(i => i.ProductId);
        builder.HasIndex(i => i.IsConferenced);
        
    }
}
