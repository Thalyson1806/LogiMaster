using LogiMaster.Domain.Enums;

namespace LogiMaster.Domain.Entities;

public class StockMovement : BaseEntity
{
    public int ProductId { get; private set; }
    public StockMovementType Type { get; private set; }
    public decimal Quantity { get; private set; }   // positivo = entrada, negativo = saída
    public string? Notes { get; private set; }
    public int? CreatedByUserId { get; private set; }
    public int? PackingListId { get; private set; } // preenchido quando Type = Dispatch

    // Navigation
    public virtual Product Product { get; private set; } = null!;
    public virtual User? CreatedByUser { get; private set; }
    public virtual PackingList? PackingList { get; private set; }

    protected StockMovement() { }

    public StockMovement(int productId, StockMovementType type, decimal quantity, string? notes = null, int? createdByUserId = null, int? packingListId = null)
    {
        if (productId <= 0) throw new ArgumentException("ProductId obrigatório", nameof(productId));
        if (quantity == 0) throw new ArgumentException("Quantidade não pode ser zero", nameof(quantity));

        ProductId = productId;
        Type = type;
        Quantity = quantity;
        Notes = notes?.Trim();
        CreatedByUserId = createdByUserId;
        PackingListId = packingListId;
    }
}
