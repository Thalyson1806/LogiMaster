namespace LogiMaster.Domain.Enums;

[Flags]
public enum AppModule : long
{
    None        = 0,
    Romaneios   = 1L << 0,
    Edi         = 1L << 1,
    Faturamento = 1L << 2,
    Clientes    = 1L << 3,
    Produtos    = 1L << 4,
    Estoque     = 1L << 5,
    Mapa        = 1L << 6,
    Email       = 1L << 7,

    All = Romaneios | Edi | Faturamento | Clientes | Produtos | Estoque | Mapa | Email
}
