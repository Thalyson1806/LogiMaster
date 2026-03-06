namespace LogiMaster.Domain.Entities;

public class CustomerProduct : BaseEntity
{
    public int CustomerId { get; private set; }
    public int ProductId { get; private set; }
    public string CustomerCode { get; private set; } = string.Empty; // Código que o cliente usa no EDI
    public string? Notes { get; private set; }

    // Navigation
    public virtual Customer Customer { get; private set; } = null!;
    public virtual Product Product { get; private set; } = null!;

    protected CustomerProduct() { }

    public CustomerProduct(int customerId, int productId, string customerCode)
    {
        if (customerId <= 0)
            throw new ArgumentException("CustomerId inválido", nameof(customerId));
        if (productId <= 0)
            throw new ArgumentException("ProductId inválido", nameof(productId));
        if (string.IsNullOrWhiteSpace(customerCode))
            throw new ArgumentException("Código do cliente é obrigatório", nameof(customerCode));

        CustomerId = customerId;
        ProductId = productId;
        CustomerCode = customerCode.Trim().ToUpper();
    }

    public void Update(string customerCode, string? notes)
    {
        if (string.IsNullOrWhiteSpace(customerCode))
            throw new ArgumentException("Código do cliente é obrigatório", nameof(customerCode));

        CustomerCode = customerCode.Trim().ToUpper();
        Notes = notes?.Trim();
        MarkUpdated();
    }
}