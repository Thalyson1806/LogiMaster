export type PackingListStatus =
  | "Pending"
  | "InSeparation"
  | "AwaitingConference"
  | "InConference"
  | "AwaitingInvoicing"
  | "Invoiced"
  | "Cancelled"
  | "Dispatched"
  | "Delivered";

export interface PackingListSummary {
  id: number;
  code: string;
  customerId: number;
  customerCode: string;
  customerName: string;
  status: PackingListStatus;
  statusName: string;
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
  requestedAt: string;
  invoiceNumber?: string;
  deliveredAt?: string;
  driverName?: string;
}

export interface PackingListItem {
  id: number;
  packingListId: number;
  productId: number;
  reference: string;
  description: string;
  edi: number;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  unitsPerBox?: number;
  volumes?: number;
  batch?: string;
  isConferenced: boolean;
}

export interface PackingList extends PackingListSummary {
  separationStartedAt?: string;
  separationCompletedAt?: string;
  conferenceStartedAt?: string;
  conferenceCompletedAt?: string;
  invoicedAt?: string;
  totalVolumes?: number;
  totalWeight?: number;
  deliverySignaturePath?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  hasInvoicePdf?: boolean;
  items: PackingListItem[];
}


export interface DeliverRequest {
  driverName: string;
  signatureBase64: string;
  latitude?: number;
  longitude?: number;
}
