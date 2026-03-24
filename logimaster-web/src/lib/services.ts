import { getAPI, postAPI, putAPI, deleteAPI, BASE_URL } from "./api";
import {
  Customer,
  CustomerInput,
  Product,
  ProductInput,
  BillingRequest,
  BillingRequestItem,
  CustomerPendingSummary,
  PackingList,
  PackingListSummary,
  CreatePackingListInput,
  ConferenceItemInput,
  InvoiceInput,
  DashboardSummary,
  ImportResult,
  PackingListStatus,
  Packaging,
  PackagingInput,
  PackagingType,
  PreValidateImportResult,
  ProductToCreate,
  CustomerToCreate,
  EdiClient,
  EdiClientInput,
  EdiRoute,
  EdiProduct,
  EdiConversion,
  EdiConversionResult,
  EdiProductInput,
  WarehouseStreet,
  WarehouseStreetInput,
  WarehouseLocation,
  WarehouseLocationInput,
  BulkCreateLocationsInput,
  ProductLocation,
  AssignProductLocationInput,
  WarehouseMap,
  EdifactFileSummary,
  EdifactFileDetail,
  EdifactFile,
  EdifactProcessingResult,
  EdifactDetectedCustomer,
  CustomerProduct,
  CustomerProductInput,
  NfPdfItem,
  MissingPart,
  MissingPartsSummary,
  StockSummaryPage,
  StockMovement,
  CreateStockMovement,
  PendingLabelItem,
  AuditLogPage,
} from "./types";

// CUSTOMERS
export const customerService = {
  getAll: () => getAPI<Customer[]>("/customers"),
  getById: (id: number) => getAPI<Customer>(`/customers/${id}`),
  create: (data: CustomerInput) => postAPI<Customer>("/customers", data),
  update: (id: number, data: CustomerInput) => putAPI<Customer>(`/customers/${id}`, data),
  delete: (id: number) => deleteAPI<void>(`/customers/${id}`),
  geocode: (id: number) => postAPI<void>(`/map/geocode/${id}`, null),
};

// PRODUCTS
export const productService = {
  getAll: () => getAPI<Product[]>("/products"),
  getById: (id: number) => getAPI<Product>(`/products/${id}`),
  create: (data: ProductInput) => postAPI<Product>("/products", data),
  update: (id: number, data: ProductInput) => putAPI<Product>(`/products/${id}`, data),
  delete: (id: number) => deleteAPI<void>(`/products/${id}`),
};

// BILLING REQUESTS
export const billingRequestService = {
  getAll: () => getAPI<BillingRequest[]>("/billingrequests"),
  getById: (id: number) => getAPI<BillingRequest>(`/billingrequests/${id}`),

  getPendingSummary: (billingRequestId?: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (billingRequestId) params.append("billingRequestId", billingRequestId.toString());
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const query = params.toString() ? `?${params.toString()}` : "";
    return getAPI<CustomerPendingSummary[]>(`/billingrequests/pending-summary${query}`);
  },

  getPendingItemsByCustomer: (customerId: number) =>
    getAPI<BillingRequestItem[]>(`/billingrequests/pending-items/${customerId}`),

  delete: (id: number) => deleteAPI<void>(`/billingrequests/${id}`),

  // Pré-validação do arquivo
  preValidate: async (file: File): Promise<PreValidateImportResult> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${BASE_URL}/api/billingrequests/pre-validate`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok && !data.unregisteredProducts) {
      throw new Error(data.errorMessage || data.message || "Erro ao validar arquivo");
    }
    return data;
  },

  // Importação com confirmação
  importWithConfirmation: async (
    file: File,
    productsToCreate: ProductToCreate[],
    customersToCreate: CustomerToCreate[]
  ): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("productsToCreateJson", JSON.stringify(productsToCreate));
    formData.append("customersToCreateJson", JSON.stringify(customersToCreate));

    const response = await fetch(`${BASE_URL}/api/billingrequests/import-with-confirmation`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errorMessage || error.message || "Erro ao importar arquivo");
    }
    return response.json();
  },

  // Importação automática (legado)
  import: async (file: File): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${BASE_URL}/api/billingrequests/import`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errorMessage || error.message || "Erro ao importar arquivo");
    }
    return response.json();
  },
};


// PACKING LISTS
export const packingListService = {
  // Consultas
  getAll: () => getAPI<PackingListSummary[]>("/packinglists"),
  getById: (id: number) => getAPI<PackingList>(`/packinglists/${id}`),
  getByCode: (code: string) => getAPI<PackingList>(`/packinglists/code/${code}`),
  getByStatus: (status: PackingListStatus) => getAPI<PackingListSummary[]>(`/packinglists/status/${status}`),
  getByCustomer: (customerId: number) => getAPI<PackingListSummary[]>(`/packinglists/customer/${customerId}`),
  getPendingForShipping: () => getAPI<PackingListSummary[]>("/packinglists/pending-shipping"),
  getPendingForInvoicing: () => getAPI<PackingListSummary[]>("/packinglists/pending-invoicing"),
  getDashboard: () => getAPI<DashboardSummary>("/packinglists/dashboard"),

  // Criação
  create: (data: CreatePackingListInput) => postAPI<PackingList>("/packinglists", data),

  // Workflow - Separação
  startSeparation: (id: number) => postAPI<PackingList>(`/packinglists/${id}/start-separation`, {}),
  completeSeparation: (id: number) => postAPI<PackingList>(`/packinglists/${id}/complete-separation`, {}),

  // Workflow - Conferência
  startConference: (id: number) => postAPI<PackingList>(`/packinglists/${id}/start-conference`, {}),
  conferenceItem: (id: number, data: ConferenceItemInput) =>
    postAPI<PackingList>(`/packinglists/${id}/conference-item`, data),
  completeConference: (id: number) => postAPI<PackingList>(`/packinglists/${id}/complete-conference`, {}),

  // Workflow - Faturamento
  invoice: (id: number, data: InvoiceInput) => postAPI<PackingList>(`/packinglists/${id}/invoice`, data),

  // Cancelamento
  cancel: (id: number) => postAPI<void>(`/packinglists/${id}/cancel`, {}),

    // NF PDF e Canhoto
  uploadInvoicePdf: async (id: number, file: File): Promise<{ path: string }> => {
    const form = new FormData();
    form.append("file", file);
    const response = await fetch(`${BASE_URL}/api/packinglists/${id}/invoice-pdf`, {
      method: "POST",
      body: form,
    });
    if (!response.ok) throw new Error("Erro ao anexar PDF da NF");
    return response.json();
  },
  getInvoicePdfUrl: (id: number) => `${BASE_URL}/api/packinglists/${id}/invoice-pdf`,
  getCanhotoUrl: (id: number) => `${BASE_URL}/api/packinglists/${id}/canhoto`,

  generateCanhoto: async (id: number): Promise<{ path: string }> => {
    const response = await fetch(`${BASE_URL}/api/packinglists/${id}/generate-canhoto`, {
      method: "POST",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erro ao gerar canhoto");
    }
    return response.json();
  },

  // ── Múltiplas NFs por romaneio ────────────────────────────────────────────

  getNfPdfs: (id: number) => getAPI<NfPdfItem[]>(`/packinglists/${id}/nf-pdfs`),

  uploadNfPdf: async (id: number, nfNumber: string, file: File): Promise<NfPdfItem> => {
    const form = new FormData();
    form.append("file", file);
    const response = await fetch(
      `${BASE_URL}/api/packinglists/${id}/nf-pdfs?nfNumber=${encodeURIComponent(nfNumber)}`,
      { method: "POST", body: form }
    );
    if (!response.ok) throw new Error("Erro ao anexar PDF da NF");
    return response.json();
  },

  getNfPdfFileUrl: (id: number, nfPdfId: number) =>
    `${BASE_URL}/api/packinglists/${id}/nf-pdfs/${nfPdfId}/file`,

  getNfCanhotoUrl: (id: number, nfPdfId: number) =>
    `${BASE_URL}/api/packinglists/${id}/nf-pdfs/${nfPdfId}/canhoto`,

  generateNfCanhoto: async (id: number, nfPdfId: number): Promise<{ path: string }> => {
    const response = await fetch(
      `${BASE_URL}/api/packinglists/${id}/nf-pdfs/${nfPdfId}/generate-canhoto`,
      { method: "POST" }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erro ao gerar canhoto");
    }
    return response.json();
  },

};

//PACKAGING
export const packagingService = {
  getAll: () => getAPI<Packaging[]>("/packagings"),
  getById: (id: number) => getAPI<Packaging>(`/packagings/${id}`),
  getByCode: (code: string) => getAPI<Packaging>(`/packagings/code/${code}`),
  getByType: (typeId: number) => getAPI<Packaging[]>(`/packagings/type/${typeId}`),
  getTypes: () => getAPI<PackagingType[]>("/packagings/types"),
  createType: (data: { code: string; name: string }) =>
    postAPI<PackagingType>("/packagings/types", data),
  search: (term: string) => getAPI<Packaging[]>(`/packagings/search?term=${term}`),
  create: (data: PackagingInput) => postAPI<Packaging>("/packagings", data),
  update: (id: number, data: PackagingInput) => putAPI<Packaging>(`/packagings/${id}`, data),
  deactivate: (id: number) => postAPI<void>(`/packagings/${id}/deactivate`, {}),
  activate: (id: number) => postAPI<void>(`/packagings/${id}/activate`, {}),
};

// EDI CLIENTS
export const ediClientService = {
  getAll: () => getAPI<EdiClient[]>("/edi/clients"),
  getById: (id: number) => getAPI<EdiClient>(`/edi/clients/${id}`),
  getByCode: (code: string) => getAPI<EdiClient>(`/edi/clients/code/${code}`),
  create: (data: EdiClientInput) => postAPI<EdiClient>("/edi/clients", data),
  update: (id: number, data: Omit<EdiClientInput, "code">) => putAPI<EdiClient>(`/edi/clients/${id}`, data),
  delete: (id: number) => deleteAPI<void>(`/edi/clients/${id}`),
};

// EDI ROUTES
export const ediRouteService = {
  getByClientId: (clientId: number) => getAPI<EdiRoute[]>(`/edi/routes/client/${clientId}`),
  getById: (id: number) => getAPI<EdiRoute>(`/edi/routes/${id}`),
};

// EDI PRODUCTS
export const ediProductService = {
  getByClientId: (clientId: number) => getAPI<EdiProduct[]>(`/edi/products/client/${clientId}`),
  getById: (id: number) => getAPI<EdiProduct>(`/edi/products/${id}`),
  search: (clientId: number, term: string) => 
    getAPI<EdiProduct[]>(`/edi/products/search?clientId=${clientId}&term=${encodeURIComponent(term)}`),
  create: (data: EdiProductInput) => postAPI<EdiProduct>("/edi/products", data),
  update: (id: number, data: Omit<EdiProductInput, 'ediClientId'>) => 
    putAPI<EdiProduct>(`/edi/products/${id}`, data),
  delete: (id: number) => deleteAPI<void>(`/edi/products/${id}`),
};

// EDI CONVERSIONS
export const ediConversionService = {
  getAll: () => getAPI<EdiConversion[]>("/edi/conversions"),
  getByClientId: (clientId: number) => getAPI<EdiConversion[]>(`/edi/conversions/client/${clientId}`),
  getById: (id: number) => getAPI<EdiConversion>(`/edi/conversions/${id}`),
  
  convert: async (file: File, clientId: number, routeId: number, startDate?: string, endDate?: string): Promise<EdiConversionResult> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("clientId", clientId.toString());
    formData.append("routeId", routeId.toString());
    if (startDate) formData.append("startDate", startDate);
    if (endDate) formData.append("endDate", endDate);

    const response = await fetch(`${BASE_URL}/api/edi/conversions/convert`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errorMessage || error.message || "Erro na conversão");
    }
    return response.json();
  },

  download: async (id: number): Promise<Blob> => {
    const response = await fetch(`${BASE_URL}/api/edi/conversions/${id}/download`);
    if (!response.ok) {
      throw new Error("Erro ao baixar arquivo");
    }
    return response.blob();
  },
};

// WAREHOUSE (ENDEREÇAMENTO)
export const warehouseService = {
  // Streets
  getStreets: () => getAPI<WarehouseStreet[]>("/warehouse/streets"),
  getStreetById: (id: number) => getAPI<WarehouseStreet>(`/warehouse/streets/${id}`),
  createStreet: (data: WarehouseStreetInput) => postAPI<WarehouseStreet>("/warehouse/streets", data),
  updateStreet: (id: number, data: Omit<WarehouseStreetInput, 'code'>) => 
    putAPI<WarehouseStreet>(`/warehouse/streets/${id}`, data),
  deleteStreet: (id: number) => deleteAPI<void>(`/warehouse/streets/${id}`),

  // Locations
  getLocations: () => getAPI<WarehouseLocation[]>("/warehouse/locations"),
  getLocationById: (id: number) => getAPI<WarehouseLocation>(`/warehouse/locations/${id}`),
  getLocationByCode: (code: string) => getAPI<WarehouseLocation>(`/warehouse/locations/code/${code}`),
  getLocationsByStreet: (streetId: number) => getAPI<WarehouseLocation[]>(`/warehouse/locations/street/${streetId}`),
  createLocation: (data: WarehouseLocationInput) => postAPI<WarehouseLocation>("/warehouse/locations", data),
  bulkCreateLocations: (data: BulkCreateLocationsInput) => 
    postAPI<WarehouseLocation[]>("/warehouse/locations/bulk", data),
  deleteLocation: (id: number) => deleteAPI<void>(`/warehouse/locations/${id}`),

  // Product Locations
  getProductLocations: (productId?: number, locationId?: number) => {
    const params = new URLSearchParams();
    if (productId) params.append("productId", productId.toString());
    if (locationId) params.append("locationId", locationId.toString());
    const query = params.toString() ? `?${params.toString()}` : "";
    return getAPI<ProductLocation[]>(`/warehouse/product-locations${query}`);
  },
  assignProductLocation: (data: AssignProductLocationInput) => 
    postAPI<ProductLocation>("/warehouse/product-locations", data),
  deleteProductLocation: (id: number) => deleteAPI<void>(`/warehouse/product-locations/${id}`),

  // Map
  getMap: () => getAPI<WarehouseMap>("/warehouse/map"),
};


// EDIFACT (Importação Automática)
export const edifactService = {
  getAll: () => getAPI<EdifactFileSummary[]>("/edifact/files"),
  getByCustomer: (customerId: number) => getAPI<EdifactFileSummary[]>(`/edifact/files/customer/${customerId}`),
  getById: (id: number) => getAPI<EdifactFileDetail>(`/edifact/files/${id}`),
  process: (id: number) => postAPI<EdifactProcessingResult>(`/edifact/files/${id}/process`, {}),
  
  upload: async (file: File, customerId: number, messageType: number = 1): Promise<EdifactFile> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(
      `${BASE_URL}/api/edifact/upload?customerId=${customerId}&messageType=${messageType}`,
      { method: "POST", body: formData }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erro ao enviar arquivo");
    }
    return response.json();
  },

  getItems: (start: string, end: string) =>
    getAPI<EdifactFileDetail[]>(`/edifact/items?start=${start}&end=${end}`),

  detectCustomer: async (file: File, messageType: number = 1): Promise<EdifactDetectedCustomer | null> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(
      `${BASE_URL}/api/edifact/detect-customer?messageType=${messageType}`,
      { method: "POST", body: formData }
    );
    if (response.status === 404) return null;
    if (!response.ok) return null;
    return response.json();
  },
};


// CUSTOMER PRODUCTS
export const customerProductService = {
  getAll: () => getAPI<CustomerProduct[]>("/customer-products"),
  getByCustomer: (customerId: number) => getAPI<CustomerProduct[]>(`/customer-products/customer/${customerId}`),
  getByProduct: (productId: number) => getAPI<CustomerProduct[]>(`/customer-products/product/${productId}`),
  getById: (id: number) => getAPI<CustomerProduct>(`/customer-products/${id}`),
  create: (data: CustomerProductInput) => postAPI<CustomerProduct>("/customer-products", data),
  update: (id: number, data: CustomerProductInput) => putAPI<CustomerProduct>(`/customer-products/${id}`, data),
  delete: (id: number) => deleteAPI<void>(`/customer-products/${id}`),
};


//MISSING PARTS
export const missingPartsService = {
  getAll: () => getAPI<MissingPartsSummary>("/missing-parts"),
  getByProduct: (productId: number) => getAPI<MissingPart>(`/missing-parts/${productId}`),
};

//STOCKS
export const stockService = {
  getSummary: () => getAPI<StockSummaryPage>("/stock"),

  getMovements: (productId: number) =>
    getAPI<StockMovement[]>(`/stock/${productId}/movements`),

  registerMovement: (data: CreateStockMovement) =>
    postAPI<StockMovement>("/stock/movement", data),

  deleteMovement: (id: number) => deleteAPI<void>(`/stock/movement/${id}`),
};

// AUDITORIA
export const auditService = {
  getLogs: (params?: { userId?: number; from?: string; to?: string; action?: string; page?: number; pageSize?: number }) => {
    const q = new URLSearchParams();
    if (params?.userId) q.append("userId", params.userId.toString());
    if (params?.from) q.append("from", params.from);
    if (params?.to) q.append("to", params.to);
    if (params?.action) q.append("action", params.action);
    if (params?.page) q.append("page", params.page.toString());
    if (params?.pageSize) q.append("pageSize", params.pageSize.toString());
    const qs = q.toString() ? `?${q.toString()}` : "";
    return getAPI<AuditLogPage>(`/audit${qs}`);
  },
};

// ETIQUETAS
function getStoredUserId(): number {
  try {
    const s = typeof window !== "undefined" ? localStorage.getItem("logimaster_user") : null;
    if (s) return JSON.parse(s).userId ?? 0;
  } catch {}
  return 0;
}

export const labelService = {
  getPending: () => getAPI<PendingLabelItem[]>(`/packinglists/pending-labels?userId=${getStoredUserId()}`),
  markPrinted: (itemId: number) =>
    postAPI<void>(`/packinglists/items/${itemId}/mark-label-printed`, {}),
};




