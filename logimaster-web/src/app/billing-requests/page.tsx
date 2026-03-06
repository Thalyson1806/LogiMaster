"use client";

import { useEffect, useState, useRef } from "react";
import { 
  BillingRequest, 
  ImportResult, 
  PreValidateImportResult,
  UnregisteredProduct,
  UnregisteredCustomer,
  ProductToCreate,
  CustomerToCreate,
  Packaging
} from "@/lib/types";
import { billingRequestService, packagingService } from "@/lib/services";
import {
  FileText,
  Upload,
  Search,
  Calendar,
  File,
  Users,
  Package,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  AlertTriangle,
  Plus,
  Check
} from "lucide-react";

export default function BillingRequestsPage() {
  const [requests, setRequests] = useState<BillingRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<BillingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para pré-validação
  const [validating, setValidating] = useState(false);
  const [preValidateResult, setPreValidateResult] = useState<PreValidateImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Estados para seleção de itens a criar
  const [productsToCreate, setProductsToCreate] = useState<Map<string, ProductToCreate>>(new Map());
  const [customersToCreate, setCustomersToCreate] = useState<Map<string, CustomerToCreate>>(new Map());
  
  // Embalagens para o select
  const [packagings, setPackagings] = useState<Packaging[]>([]);

  useEffect(() => {
    loadRequests();
    loadPackagings();
  }, []);

  useEffect(() => {
    if (search) {
      const filtered = requests.filter(
        (r) =>
          r.code.toLowerCase().includes(search.toLowerCase()) ||
          r.fileName.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredRequests(filtered);
    } else {
      setFilteredRequests(requests);
    }
  }, [search, requests]);

  async function loadRequests() {
    try {
      setLoading(true);
      const data = await billingRequestService.getAll();
      setRequests(data);
      setFilteredRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadPackagings() {
    try {
      const data = await packagingService.getAll();
      setPackagings(data.filter(p => p.isActive));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setImportResult(null);

    try {
      setValidating(true);
      const result = await billingRequestService.preValidate(file);
      setPreValidateResult(result);

      // Se tem itens não cadastrados, abre modal de confirmação
      if (result.unregisteredProducts.length > 0 || result.unregisteredCustomers.length > 0) {
        // Inicializa os maps vazios (usuário seleciona quais criar)
        setProductsToCreate(new Map());
        setCustomersToCreate(new Map());
        setShowConfirmModal(true);
      } else if (result.canImport) {
        // Tudo cadastrado, importa direto
        await doImport(file, [], []);
      } else {
        // Erro na validação
        setImportResult({
          success: false,
          errorMessage: result.errorMessage || "Erro ao validar arquivo",
          totalLinesRead: 0,
          totalItemsCreated: 0,
          totalCustomers: 0,
          newCustomersCreated: 0,
          newProductsCreated: 0,
          warnings: result.warnings
        });
      }
    } catch (err: any) {
      console.error(err);
      setImportResult({
        success: false,
        errorMessage: err.message || "Erro ao validar arquivo",
        totalLinesRead: 0,
        totalItemsCreated: 0,
        totalCustomers: 0,
        newCustomersCreated: 0,
        newProductsCreated: 0,
        warnings: []
      });
    } finally {
      setValidating(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function doImport(file: File, products: ProductToCreate[], customers: CustomerToCreate[]) {
    try {
      setImporting(true);
      const result = await billingRequestService.importWithConfirmation(file, products, customers);
      setImportResult(result);
      if (result.success) {
        loadRequests();
      }
    } catch (err: any) {
      setImportResult({
        success: false,
        errorMessage: err.message || "Erro ao importar",
        totalLinesRead: 0,
        totalItemsCreated: 0,
        totalCustomers: 0,
        newCustomersCreated: 0,
        newProductsCreated: 0,
        warnings: []
      });
    } finally {
      setImporting(false);
      setSelectedFile(null);
      setShowConfirmModal(false);
      setPreValidateResult(null);
    }
  }

  function toggleProduct(product: UnregisteredProduct, checked: boolean) {
    const newMap = new Map(productsToCreate);
    if (checked) {
      newMap.set(product.reference, {
        reference: product.reference,
        description: product.description || product.reference,
        defaultPackagingId: undefined
      });
    } else {
      newMap.delete(product.reference);
    }
    setProductsToCreate(newMap);
  }

  function updateProductDescription(reference: string, description: string) {
    const newMap = new Map(productsToCreate);
    const existing = newMap.get(reference);
    if (existing) {
      newMap.set(reference, { ...existing, description });
    }
    setProductsToCreate(newMap);
  }

  function updateProductPackaging(reference: string, packagingId: number | undefined) {
    const newMap = new Map(productsToCreate);
    const existing = newMap.get(reference);
    if (existing) {
      newMap.set(reference, { ...existing, defaultPackagingId: packagingId });
    }
    setProductsToCreate(newMap);
  }

  function toggleCustomer(customer: UnregisteredCustomer, checked: boolean) {
    const newMap = new Map(customersToCreate);
    if (checked) {
      newMap.set(customer.code, {
        code: customer.code,
        name: customer.name || customer.code
      });
    } else {
      newMap.delete(customer.code);
    }
    setCustomersToCreate(newMap);
  }

  function updateCustomerName(code: string, name: string) {
    const newMap = new Map(customersToCreate);
    const existing = newMap.get(code);
    if (existing) {
      newMap.set(code, { ...existing, name });
    }
    setCustomersToCreate(newMap);
  }

  function selectAllProducts() {
    const newMap = new Map<string, ProductToCreate>();
    preValidateResult?.unregisteredProducts.forEach(p => {
      newMap.set(p.reference, {
        reference: p.reference,
        description: p.description || p.reference,
        defaultPackagingId: undefined
      });
    });
    setProductsToCreate(newMap);
  }

  function selectAllCustomers() {
    const newMap = new Map<string, CustomerToCreate>();
    preValidateResult?.unregisteredCustomers.forEach(c => {
      newMap.set(c.code, {
        code: c.code,
        name: c.name || c.code
      });
    });
    setCustomersToCreate(newMap);
  }

  async function handleConfirmImport() {
    if (!selectedFile) return;
    await doImport(
      selectedFile, 
      Array.from(productsToCreate.values()),
      Array.from(customersToCreate.values())
    );
  }

  function handleCancelImport() {
    setShowConfirmModal(false);
    setPreValidateResult(null);
    setSelectedFile(null);
    setProductsToCreate(new Map());
    setCustomersToCreate(new Map());
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatCurrency(value: number): string {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-amber-600 rounded-full animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Solicitações de Faturamento</h1>
            <p className="text-sm text-slate-500">{requests.length} importações</p>
          </div>
        </div>
        <div>
          <input
            type="file"
            accept=".txt,.pdf,.xlsx,.xls"
            onChange={handleFileSelect}
            ref={fileInputRef}
            className="hidden"
            id="file-import"
            disabled={validating || importing}
          />
          <label
            htmlFor="file-import"
            className={`bg-amber-600 text-white px-4 py-2 text-sm rounded-lg cursor-pointer hover:bg-amber-700 transition-colors flex items-center gap-2 ${(validating || importing) ? "opacity-50 cursor-wait" : ""}`}
          >
            {validating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Validando...
              </>
            ) : importing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Importar Arquivo
              </>
            )}
          </label>
        </div>
      </div>

      {importResult && (
        <div className={`${importResult.success ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"} border rounded-xl p-4 mb-4`}>
          <div className="flex items-start gap-3">
            {importResult.success ? (
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            ) : (
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
            )}
            <div className="flex-1">
              {importResult.success ? (
                <>
                  <p className="font-medium text-emerald-800">Importação realizada com sucesso!</p>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <span className="text-sm text-emerald-700 flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {importResult.totalItemsCreated} itens
                    </span>
                    <span className="text-sm text-emerald-700 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {importResult.totalCustomers} clientes
                    </span>
                    {importResult.newCustomersCreated > 0 && (
                      <span className="text-sm text-emerald-700">+{importResult.newCustomersCreated} novos clientes</span>
                    )}
                    {importResult.newProductsCreated > 0 && (
                      <span className="text-sm text-emerald-700">+{importResult.newProductsCreated} novos produtos</span>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-red-800">{importResult.errorMessage}</p>
              )}
            </div>
            <button
              onClick={() => setImportResult(null)}
              className="p-1 hover:bg-black/5 rounded"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código ou arquivo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Código</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Data</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Arquivo</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Itens</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Clientes</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Valor</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium">Nenhuma solicitação encontrada</p>
                  <p className="text-sm">Importe um arquivo Excel (.xlsx) para começar</p>
                </td>
              </tr>
            ) : (
              filteredRequests.map((request) => (
                <tr key={request.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                      {request.code}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <Calendar className="w-3 h-3" />
                      {formatDate(request.importedAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <File className="w-3 h-3" />
                      {request.fileName}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <Package className="w-3 h-3 text-slate-400" />
                      {request.totalItems}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <Users className="w-3 h-3 text-slate-400" />
                      {request.totalCustomers}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                      <DollarSign className="w-3 h-3" />
                      {formatCurrency(request.totalValue)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {request.isProcessed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" />
                        Processado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700">
                        <Clock className="w-3 h-3" />
                        Pendente
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Confirmação */}
      {showConfirmModal && preValidateResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Itens não cadastrados</h2>
                  <p className="text-sm text-slate-500">
                    {selectedFile?.name} - {preValidateResult.totalLines} linhas
                  </p>
                </div>
              </div>
              <button onClick={handleCancelImport} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Warnings */}
              {preValidateResult.warnings.length > 0 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-medium text-amber-800 mb-1">Avisos:</p>
                  <ul className="text-sm text-amber-700 list-disc list-inside">
                    {preValidateResult.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Produtos não cadastrados */}
              {preValidateResult.unregisteredProducts.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-500" />
                      Produtos não cadastrados ({preValidateResult.unregisteredProducts.length})
                    </h3>
                    <button
                      onClick={selectAllProducts}
                      className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      Selecionar todos
                    </button>
                  </div>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="w-10 px-3 py-2"></th>
                          <th className="text-left px-3 py-2 font-medium text-slate-600">Referência</th>
                          <th className="text-left px-3 py-2 font-medium text-slate-600">Descrição</th>
                          <th className="text-left px-3 py-2 font-medium text-slate-600">Embalagem</th>
                          <th className="text-center px-3 py-2 font-medium text-slate-600">Ocorrências</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preValidateResult.unregisteredProducts.map((product) => {
                          const isSelected = productsToCreate.has(product.reference);
                          const selectedProduct = productsToCreate.get(product.reference);
                          return (
                            <tr key={product.reference} className="border-t border-slate-100">
                              <td className="px-3 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => toggleProduct(product, e.target.checked)}
                                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                                />
                              </td>
                              <td className="px-3 py-2 font-mono text-xs">{product.reference}</td>
                              <td className="px-3 py-2">
                                {isSelected ? (
                                  <input
                                    type="text"
                                    value={selectedProduct?.description || ""}
                                    onChange={(e) => updateProductDescription(product.reference, e.target.value)}
                                    className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    placeholder="Descrição do produto"
                                  />
                                ) : (
                                  <span className="text-slate-500">{product.description || "-"}</span>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                {isSelected && (
                                  <select
                                    value={selectedProduct?.defaultPackagingId || ""}
                                    onChange={(e) => updateProductPackaging(product.reference, e.target.value ? Number(e.target.value) : undefined)}
                                    className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  >
                                    <option value="">Sem embalagem</option>
                                    {packagings.map((p) => (
                                      <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                  </select>
                                )}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-100 rounded-full text-xs font-medium">
                                  {product.occurrences}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Clientes não cadastrados */}
              {preValidateResult.unregisteredCustomers.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-500" />
                      Clientes não cadastrados ({preValidateResult.unregisteredCustomers.length})
                    </h3>
                    <button
                      onClick={selectAllCustomers}
                      className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      Selecionar todos
                    </button>
                  </div>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="w-10 px-3 py-2"></th>
                          <th className="text-left px-3 py-2 font-medium text-slate-600">Código</th>
                          <th className="text-left px-3 py-2 font-medium text-slate-600">Nome</th>
                          <th className="text-center px-3 py-2 font-medium text-slate-600">Ocorrências</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preValidateResult.unregisteredCustomers.map((customer) => {
                          const isSelected = customersToCreate.has(customer.code);
                          const selectedCustomer = customersToCreate.get(customer.code);
                          return (
                            <tr key={customer.code} className="border-t border-slate-100">
                              <td className="px-3 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => toggleCustomer(customer, e.target.checked)}
                                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                                />
                              </td>
                              <td className="px-3 py-2 font-mono text-xs">{customer.code}</td>
                              <td className="px-3 py-2">
                                {isSelected ? (
                                  <input
                                    type="text"
                                    value={selectedCustomer?.name || ""}
                                    onChange={(e) => updateCustomerName(customer.code, e.target.value)}
                                    className="w-full px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    placeholder="Nome do cliente"
                                  />
                                ) : (
                                  <span className="text-slate-500">{customer.name || "-"}</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-100 rounded-full text-xs font-medium">
                                  {customer.occurrences}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Info sobre itens não selecionados */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Itens não selecionados serão ignorados na importação. 
                  As linhas do arquivo que referenciam esses itens não serão importadas.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="text-sm text-slate-600">
                <span className="font-medium">{productsToCreate.size}</span> produtos e{" "}
                <span className="font-medium">{customersToCreate.size}</span> clientes serão criados
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelImport}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={importing}
                  className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {importing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Confirmar Importação
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
