namespace LogiMaster.Domain.Enums;

public enum StockMovementType
{
    Entry = 1, // entrada manual (produçao, etc ate migrar junto com o apontamento de fabrica
    Exit = 2, // saida manual
    Adjustment = 3, //ajuste inventario (vai sobrescrever o valor anterior)
    Dispatch = 4, // saida automatica por romaneio
}