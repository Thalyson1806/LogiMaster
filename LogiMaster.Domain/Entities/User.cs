using LogiMaster.Domain.Enums;

namespace LogiMaster.Domain.Entities;

public class User : BaseEntity
{
    public string Name { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public UserRole Role { get; private set; }
    public AppModule Permissions { get; private set; } = AppModule.None;
    public string? Department { get; private set; }
    public string? EmployeeId { get; private set;} // re - vincular com futuro cadastro de funcionários 
    public DateTime? LastAccessAt { get; private set; }

    // Navigation
    public virtual ICollection<PackingList> CreatedPackingLists { get; private set; } = new List<PackingList>();
    public virtual ICollection<PackingList> SeparatedPackingLists { get; private set; } = new List<PackingList>();
    public virtual ICollection<PackingList> ConferencedPackingLists { get; private set; } = new List<PackingList>();
    public virtual ICollection<PackingList> InvoicedPackingLists { get; private set; } = new List<PackingList>();

    protected User() { }

    public User(string name, string email, string passwordHash, UserRole role)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("User name is required", nameof(name));
        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("User email is required", nameof(email));
        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new ArgumentException("Password is required", nameof(passwordHash));

        Name = name.Trim();
        Email = email.Trim().ToLower();
        PasswordHash = passwordHash;
        Role = role;
    }

    public void Update(string name, string? department, UserRole role, string? employeeId = null)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("User name is required", nameof(name));

        Name = name.Trim();
        Department = department?.Trim();
        Role = role;
        EmployeeId = employeeId?.Trim();
        MarkUpdated();
    }

    public void SetPermissions(AppModule permissions)
    {
        Permissions = permissions;
        MarkUpdated();
    }

    public void ChangePassword(string newPasswordHash)
    {
        if (string.IsNullOrWhiteSpace(newPasswordHash))
            throw new ArgumentException("Password is required", nameof(newPasswordHash));

        PasswordHash = newPasswordHash;
        MarkUpdated();
    }

    public void RecordAccess()
    {
        LastAccessAt = DateTime.UtcNow;
    }
}
