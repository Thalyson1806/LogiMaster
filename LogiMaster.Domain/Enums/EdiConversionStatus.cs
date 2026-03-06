namespace LogiMaster.Domain.Enums;

public enum EdiConversionStatus
{
    Pending = 0,
    Processing = 1,
    Completed = 2,
    CompletedWithWarnings = 3,
    Error = 4
}