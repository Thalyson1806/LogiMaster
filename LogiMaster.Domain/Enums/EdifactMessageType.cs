namespace LogiMaster.Domain.Enums;

public enum EdifactMessageType
{
    DELFOR = 1,   // Delivery Forecast
    DESADV = 2,   // Despatch Advice
    ORDERS = 3,   // Purchase Order
    INVOIC = 4,   // Invoice
    RECADV = 5,   //Receiving Advice

    DELJIT = 6, //Delivery Just in Time
    
    RND = 7 // RND/ANFAVEA (fomrato brasileiro)
}
