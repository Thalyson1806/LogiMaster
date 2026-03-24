namespace LogiMaster.Domain.Enums;

[Flags]
public enum AppModule : long
{
    None = 0,

    // Romaneios (bits 0-3)
    Romaneios        = 1L << 0,
    Romaneios_Create = 1L << 1,
    Romaneios_Edit   = 1L << 2,
    Romaneios_Delete = 1L << 3,

    // EDI (bits 4-7)
    Edi        = 1L << 4,
    Edi_Create = 1L << 5,
    Edi_Edit   = 1L << 6,
    Edi_Delete = 1L << 7,

    // Faturamento (bits 8-11)
    Faturamento        = 1L << 8,
    Faturamento_Create = 1L << 9,
    Faturamento_Edit   = 1L << 10,
    Faturamento_Delete = 1L << 11,

    // Clientes (bits 12-15)
    Clientes        = 1L << 12,
    Clientes_Create = 1L << 13,
    Clientes_Edit   = 1L << 14,
    Clientes_Delete = 1L << 15,

    // Produtos (bits 16-19)
    Produtos        = 1L << 16,
    Produtos_Create = 1L << 17,
    Produtos_Edit   = 1L << 18,
    Produtos_Delete = 1L << 19,

    // Estoque (bits 20-22)
    Estoque        = 1L << 20,
    Estoque_Create = 1L << 21,
    Estoque_Delete = 1L << 22,

    // Mapa (bit 24)
    Mapa = 1L << 24,

    // Email (bit 28)
    Email = 1L << 28,

    All = Romaneios | Romaneios_Create | Romaneios_Edit | Romaneios_Delete
        | Edi | Edi_Create | Edi_Edit | Edi_Delete
        | Faturamento | Faturamento_Create | Faturamento_Edit | Faturamento_Delete
        | Clientes | Clientes_Create | Clientes_Edit | Clientes_Delete
        | Produtos | Produtos_Create | Produtos_Edit | Produtos_Delete
        | Estoque | Estoque_Create | Estoque_Delete
        | Mapa | Email
}
