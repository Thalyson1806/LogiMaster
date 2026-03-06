

export interface EdiClient {
    id: number;
    code: string;
    name: string;
    description?: string;
    ediCode?: string;
    customerId?: number;
    customerName?: string;
    spreadsheetConfigJson?: string;
    deliveryRulesJson?: string;
    fileType: string;
    routesCount: number;
    productsCount: number;
    isActive: boolean;
    createdAt: string;
}

export interface EdiClientInput {
    code: string;
    name: string;
    description?: string;
    ediCode?: string;
    customerId?: number;
    spreadsheetConfigJson?: string;
    deliveryRulesJson?: string;
    fileType?: string;
}

export interface EdiRoute {
    id: number;
    ediClientId: number;
    clientName: string;
    code: string;
    name: string;
    routeType: string;
    daysOfWeekJson?: string;
    frequencyPerWeek?: number;
    frequencyDays?: number;
    description?: string;
    isDefault: boolean;
    isActive: boolean;
    createdAt: string;
}

export interface EdiProduct {
    id: number;
    ediClientId: number;
    clientName: string;
    description: string;
    reference?: string;
    code?: string;
    value?: number;
    productId?: number;
    productReference?: string;
    isActive: boolean;
    createdAt: string;
}

export interface EdiConversion {
    id: number;
    ediClientId: number;
    ediRouteId: number;
    clientCode: string;
    clientName: string;
    routeName: string;
    code: string;
    convertedAt: string;
    convertedByName?: string;
    inputFileName: string;
    outputFileName?: string;
    startDate?: string;
    endDate?: string;
    totalProductsProcessed: number;
    totalLinesGenerated: number;
    productsNotFound: number;
    status: string;
    errorMessage?: string;
}

export interface EdiConversionResult {
    conversion: EdiConversion;
    outputContent: string;
    productsNotFound: string[];
    warnings: string[];
}

export interface EdiConvertInput {
    clientId: number;
    routeId: number;
    startDate?: string;
    endDate?: string;
}

export interface EdiProductInput {
    ediClientId: number;
    description: string;
    reference?: string;
    code?: string;
    value?: number;
    productId?: number;
}

export interface Customer {
    id: number;
    code: string;
    name: string;
    companyName?: string;
    taxId?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
    email?: string;
    notes?: string;
    emitterCode?: string;
    latitude?: number;
    longitude?: number;
    hasCoordinates?: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface CustomerInput {
    code: string;
    name: string;
    companyName?: string;
    taxId?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
    email?: string;
    notes?: string;
    emitterCode?: string;
}

export interface EdifactDetectedCustomer {
    customerId: number;
    customerCode: string;
    customerName: string;
    emitterCode?: string;
    detectedBy: string;
}

export interface Product {
    id: number;
    reference: string;
    description: string;
    unitsPerBox: number;
    boxesPerPallet?: number;
    unitWeight?: number;
    unitPrice?: number;
    barcode?: string;
    notes?: string;
    defaultPackagingId?: number;
    defaultPackagingName?: string;
    isActive: boolean;
    createdAt: string;
}

export interface ProductInput {
    reference: string;
    description: string;
    unitsPerBox: number;
    boxesPerPallet?: number;
    unitWeight?: number;
    unitPrice?: number;
    barcode?: string;
    notes?: string;
    defaultPackagingId?: number;
}


export interface BillingRequest {
    id: number;
    code: string;
    importedAt: string;
    fileName: string;
    totalItems: number;
    totalCustomers: number;
    totalValue: number;
    totalQuantity: number;
    importedByName?: string;
    notes?: string;
    isProcessed: boolean;
    items: BillingRequestItem[];
}

export interface BillingRequestItem {
    id: number;
    customerId?: number;
    customerCode?: string;
    customerName?: string;
    productId?: number;
    productReference?: string;
    productDescription?: string;
    quantity: number;
    pendingQuantity: number;
    processedQuantity: number;
    unitPrice: number;
    totalValue: number;
    isCustomerTotal: boolean;
    notes?: string;
}

export interface CustomerPendingSummary {
    customerId: number;
    customerCode: string;
    customerName: string;
    totalItems: number;
    totalPendingQuantity: number;
    totalPendingValue: number;
}

export type PackingListStatus =
    | "Pending"
    | "InSeparation"
    | "AwaitingConference"
    | "InConference"
    | "AwaitingInvoicing"
    | "Invoiced"
    | "Dispatched"
    | "Delivered"
    | "InTransit"
    | "Cancelled";

export interface PackingList {
    id: number;
    code: string;
    customerId: number;
    customerCode: string;
    customerName: string;
    status: PackingListStatus;
    statusName: string;
    requestedAt: string;
    separatedAt?: string;
    conferencedAt?: string;
    invoicedAt?: string;
    deliveredAt?: string;
    createdByName?: string;
    separatedByName?: string;
    conferencedByName?: string;
    invoicedByName?: string;
    driverName?: string;
    deliverySignaturePath?: string;
    deliveryLatitude?: number;
    deliveryLongitude?: number;
    hasInvoicePdf?: boolean;
    canhotoPath?: string | null;
    totalVolumes: number;
    totalWeight: number;
    totalValue: number;
    totalItems: number;
    invoiceNumber?: string;
    invoiceDate?: string;
    notes?: string;
    items: PackingListItem[];
    nfPdfs: NfPdfItem[];
}

export interface NfPdfItem {
    id: number;
    nfNumber: string;
    hasPdf: boolean;
    hasCanhoto: boolean;
    uploadedAt: string;
}

export interface PackingListItem {
    id: number;
    productId: number;
    reference: string;
    description: string;
    edi: number;
    quantity: number;
    unitsPerBox: number;
    volumes: number;
    batch?: string;
    unitPrice: number;
    totalValue: number;
    unitWeight: number;
    totalWeight: number;
    isConferenced: boolean;
    conferencedAt?: string;
    notes?: string;
}

export interface PackingListSummary {
    id: number;
    code: string;
    customerId: number;
    customerCode: string;
    customerName: string;
    status: PackingListStatus;
    statusName: string;
    requestedAt: string;
    totalItems: number;
    totalValue: number;
    invoiceNumber?: string;
    separatedByName?: string;
    deliveredAt?: string;
    driverName?: string;
    hasInvoicePdf?: boolean;
    hasCanhoto?: boolean;
}


export interface CreatePackingListInput {
    customerId: number;
    billingRequestId?: number;
    items: CreatePackingListItemInput[];
    notes?: string;
}

export interface CreatePackingListItemInput {
    productId: number;
    billingRequestItemId?: number;
    edi: number;
    quantity: number;
    unitPrice?: number;
    notes?: string;
}

export interface ConferenceItemInput {
    itemId: number;
    batch?: string;
    actualQuantity?: number;
    notes?: string;
}

export interface InvoiceInput {
    invoiceNumber: string;
}

export interface DashboardSummary {
    totalPending: number;
    totalInSeparation: number;
    totalAwaitingConference: number;
    totalInConference: number;
    totalAwaitingInvoicing: number;
    totalInvoicedToday: number;
    totalValuePending: number;
    customersPending: CustomerPendingSummary[];
}

// Legacy type alias for backwards compatibility
export interface PackingListInput {
    customerId: number;
    notes?: string;
    items: PackingListItemInput[];
}

export interface PackingListItemInput {
    billingRequestItemId: number;
    productId: number;
    quantity: number;
    unitPrice: number;
    notes?: string;
}

export interface ImportResult {
    success: boolean;
    errorMessage?: string;
    totalLinesRead: number;
    totalItemsCreated: number;
    totalCustomers: number;
    newCustomersCreated: number;
    newProductsCreated: number;
    warnings: string[];
}

// ==== packagin (embalagem novo)

// ==== PACKAGING (EMBALAGEM) ====

export interface PackagingType {
    id: number;
    code: string;
    name: string;
    description?: string;
}

export interface Packaging {
    id: number;
    code: string;
    name: string;
    description?: string;
    packagingTypeId: number;
    packagingTypeName: string;
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
    maxWeight?: number;
    maxUnits?: number;
    notes?: string;
    isActive: boolean;
    createdAt: string;
}

export interface PackagingInput {
    code: string;
    name: string;
    packagingTypeId: number;
    description?: string;
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
    maxWeight?: number;
    maxUnits?: number;
    notes?: string;
}

export interface PreValidateImportResult {
    canImport: boolean;
    errorMessage?: string;
    totalLines: number;
    totalProducts: number;
    totalCustomers: number;
    unregisteredProducts: UnregisteredProduct[];
    unregisteredCustomers: UnregisteredCustomer[];
    warnings: string[];
}

export interface UnregisteredProduct {
    reference: string;
    description?: string;
    occurrences: number;
    shouldCreate: boolean;
}

export interface UnregisteredCustomer {
    code: string;
    name?: string;
    occurrences: number;
    shouldCreate: boolean;
}

export interface ProductToCreate {
    reference: string;
    description: string;
    defaultPackagingId?: number;
}

export interface CustomerToCreate {
    code: string;
    name: string;
}


 //endereçamento
export interface WarehouseStreet {
    id: number;
    code: string;
    name: string;
    description?: string;
    sortOrder: number;
    rackCount: number;
    color?: string;
    locationCount: number;
    isActive: boolean;
    createdAt: string;
}

export interface WarehouseStreetInput {
    code: string;
    name: string;
    description?: string;
    sortOrder?: number;
    rackCount?: number;
    color?: string;
}

export interface WarehouseLocation {
    id: number;
    streetId: number;
    streetName: string;
    code: string;
    street: string;
    rack: string;
    level: number;
    position: string;
    description?: string;
    capacity?: number;
    isAvailable: boolean;
    productCount: number;
    isActive: boolean;
    createdAt: string;
}

export interface WarehouseLocationInput {
    streetId: number;
    street: string;
    rack: string;
    level: number;
    position: string;
    description?: string;
    capacity?: number;
}

export interface BulkCreateLocationsInput {
    streetId: number;
    street: string;
    rackStart: number;
    rackEnd: number;
    levelStart: number;
    levelEnd: number;
    positionStart: number;
    positionEnd: number;
}

export interface ProductLocation {
    id: number;
    productId: number;
    productReference: string;
    productDescription: string;
    locationId: number;
    locationCode: string;
    isPrimary: boolean;
    quantity?: number;
    notes?: string;
}

export interface AssignProductLocationInput {
    productId: number;
    locationId: number;
    isPrimary?: boolean;
    quantity?: number;
    notes?: string;
}

export interface WarehouseMap {
    streets: WarehouseStreet[];
    locations: WarehouseLocation[];
    totalStreets: number;
    totalLocations: number;
    occupiedLocations: number;
    availableLocations: number;
}


// === EDIFACT (Importação Automática EDI) ===
export interface EdifactFile {
    id: number;
    customerId: number;
    customerName: string;
    fileName: string;
    originalFileName: string;
    messageType: number;
    messageTypeName: string;
    status: number;
    statusName: string;
    receivedAt: string;
    processedAt?: string;
    errorMessage?: string;
    totalSegments: number;
    totalItemsProcessed: number;
    totalItemsWithError: number;
    isActive: boolean;
    createdAt: string;
}

export interface EdifactFileSummary {
    id: number;
    customerName: string;
    originalFileName: string;
    messageTypeName: string;
    statusName: string;
    receivedAt: string;
    totalItemsProcessed: number;
    totalItemsWithError: number;
}

export interface EdifactFileDetail {
    id: number;
    customerId: number;
    customerName: string;
    fileName: string;
    originalFileName: string;
    messageType: number;
    messageTypeName: string;
    status: number;
    statusName: string;
    receivedAt: string;
    processedAt?: string;
    errorMessage?: string;
    totalSegments: number;
    totalItemsProcessed: number;
    totalItemsWithError: number;
    items: EdifactItem[];
}

export interface EdifactItem {
    id: number;
    edifactFileId: number;
    productId?: number;
    productReference?: string;
    itemCode: string;
    buyerItemCode?: string;
    supplierItemCode?: string;
    description?: string;
    quantity: number;
    unitOfMeasure?: string;
    deliveryStart?: string;
    deliveryEnd?: string;
    deliveryLocation?: string;
    documentNumber?: string;
    lineNumber: number;
    isProcessed: boolean;
    errorMessage?: string;
}

export interface EdifactProcessingResult {
    fileId: number;
    success: boolean;
    totalItemsProcessed: number;
    totalItemsWithError: number;
    errors: string[];
    warnings: string[];
}


// CUSTOMER PRODUCTS
export interface CustomerProduct {
  id: number;
  customerId: number;
  customerName: string;
  productId: number;
  productReference: string;
  productDescription: string;
  customerCode: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CustomerProductInput {
  customerId: number;
  productId: number;
  customerCode: string;
  notes?: string;
}
export interface ProjectedBalancePoint {
  date: string;
  demandQty: number;
  cumulativeDemand: number;
  projectedBalance: number;
}

export interface MissingPart {
  productId: number;
  productReference: string;
  productDescription: string;
  currentStock: number;
  totalDemand: number;
  projectedBalance: number;
  shortageDate: string | null;
  shortageQuantity: number;
  daysUntilShortage: number;
  riskLevel: "Critical" | "Warning" | "OK";
  missingReason: string | null;
  timeline: ProjectedBalancePoint[];
}

export interface MissingPartsSummary {
  totalProducts: number;
  criticalCount: number;
  warningCount: number;
  okCount: number;
  items: MissingPart[];
}

// ===== STOCK =====
export interface StockMovement {
  id: number;
  productId: number;
  productReference: string;
  productDescription: string;
  type: string;
  quantity: number;
  notes?: string;
  createdByUserId?: number;
  createdByUserName?: string;
  packingListId?: number;
  createdAt: string;
}

export interface StockSummary {
  productId: number;
  productReference: string;
  productDescription: string;
  currentStock: number;
  lastMovementAt?: string;
}

export interface StockSummaryPage {
  totalProducts: number;
  productsWithStock: number;
  productsWithoutStock: number;
  items: StockSummary[];
}

export interface CreateStockMovement {
  productId: number;
  type: "Entry" | "Exit" | "Adjustment";
  quantity: number;
  notes?: string;
}

// ===== ETIQUETAS =====
export interface PendingLabelItem {
  itemId: number;
  packingListId: number;
  packingListCode: string;
  customerId: number;
  customerName: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  reference: string;
  description: string;
  quantity: number;
  batch?: string;
  operatorName: string;
  operatorEmployeeId?: string;
}

