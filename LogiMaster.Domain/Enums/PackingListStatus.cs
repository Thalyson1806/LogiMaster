namespace LogiMaster.Domain.Enums;

public enum PackingListStatus
{
    Pending = 0,
    InSeparation = 1,
    AwaitingConference = 2,
    InConference = 3,
    AwaitingInvoicing = 4,
    Invoiced = 5,
    Cancelled = 6,
    Dispatched = 7,
    Delivered = 8
}
