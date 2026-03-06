"use client";

import { useEffect, useState } from "react";
import {
  PackingListSummary,
  PackingList,
  PackingListStatus,
  NfPdfItem,
} from "@/lib/types";
import { packingListService } from "@/lib/services";
import {
  Receipt,
  Clock,
  Search,
  Package,
  Users,
  Calendar,
  Loader2,
  CheckCircle2,
  XCircle,
  FileCheck,
  AlertCircle,
  X,
  Eye,
  Box,
  DollarSign,
  FileText,
  ClipboardList,
} from "lucide-react";

export default function FaturamentoPage() {
  const [invoiceNumbers, setInvoiceNumbers] = useState<string[]>([]);
  const [newInvoice, setNewInvoice] = useState("");
  const [packingLists, setPackingLists] = useState<PackingListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"pending" | "invoiced" | "all">("all");

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedPackingList, setSelectedPackingList] = useState<PackingList | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // NF PDFs modal
  const [showNfModal, setShowNfModal] = useState(false);
  const [nfModalId, setNfModalId] = useState<number | null>(null);
  const [nfModalCode, setNfModalCode] = useState("");
  const [nfModalCustomer, setNfModalCustomer] = useState("");
  const [nfModalStatus, setNfModalStatus] = useState<PackingListStatus>("Invoiced");
  const [nfModalPdfs, setNfModalPdfs] = useState<NfPdfItem[]>([]);
  // NF numbers parsed from invoiceNumber field (ex: "5432, 5433")
  const [nfModalInvoiceNumbers, setNfModalInvoiceNumbers] = useState<string[]>([]);
  const [nfUploadNumber, setNfUploadNumber] = useState("");
  const [nfUploadLoading, setNfUploadLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const lists = await packingListService.getAll();
      // Filtra romaneios que estão aguardando faturamento ou já faturados
      const invoiceLists = (lists as PackingListSummary[]).filter(
        (pl) => pl.status === "AwaitingInvoicing" 
        || pl.status === "Invoiced" 
        || pl.status === "Dispatched" 
        || pl.status === "Delivered"
      );
      setPackingLists(invoiceLists);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function openDetailModal(packingListId: number) {
    try {
      const pl = await packingListService.getById(packingListId);
      setSelectedPackingList(pl);
      setShowDetailModal(true);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar romaneio");
    }
  }

  // ========== WORKFLOW ACTIONS ==========

  async function openNfModal(pl: PackingListSummary) {
    setNfModalId(pl.id);
    setNfModalCode(pl.code);
    setNfModalCustomer(pl.customerName);
    setNfModalStatus(pl.status);
    setNfUploadNumber("");
    // Parse números de NF separados por vírgula (ex: "5432, 5433, 5434")
    const parsed = pl.invoiceNumber
      ? pl.invoiceNumber.split(",").map((n) => n.trim()).filter(Boolean)
      : [];
    setNfModalInvoiceNumbers(parsed);
    try {
      const pdfs = await packingListService.getNfPdfs(pl.id);
      setNfModalPdfs(pdfs);
    } catch {
      setNfModalPdfs([]);
    }
    setShowNfModal(true);
  }

  async function handleNfUpload(file: File, nfNumber: string) {
    if (!nfModalId || !nfNumber.trim()) {
      alert("Informe o número da NF antes de anexar o arquivo");
      return;
    }
    try {
      setNfUploadLoading(true);
      const item = await packingListService.uploadNfPdf(nfModalId, nfNumber.trim(), file);
      setNfModalPdfs((prev) => [...prev.filter((p) => p.nfNumber !== item.nfNumber), item]);
      setNfUploadNumber("");
    } catch {
      alert("Erro ao anexar PDF da NF");
    } finally {
      setNfUploadLoading(false);
    }
  }

  async function handleGenerateNfCanhoto(nfPdfId: number) {
    if (!nfModalId) return;
    try {
      await packingListService.generateNfCanhoto(nfModalId, nfPdfId);
      const pdfs = await packingListService.getNfPdfs(nfModalId);
      setNfModalPdfs(pdfs);
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || "Erro ao gerar canhoto");
    }
  }

  async function handleInvoice(id: number, invoices?: string) {
    if (!invoices) {
      alert("Informe o número da nota fiscal");
      return;
    }

  try {
    setActionLoading(true);
    const updated = await packingListService.invoice(id, { invoiceNumber: invoices });
    setSelectedPackingList(updated);
    setShowInvoiceModal(false);
    setInvoiceNumbers([]);
    setNewInvoice("");
    await loadData();
  } catch (err: unknown) {
    const error = err as Error;
    alert(error.message || "Erro ao faturar");
  } finally {
    setActionLoading(false);
  }
}



  // ========== FILTERS ==========

  const filteredLists = packingLists
    .filter((pl) => {
      if (statusFilter === "pending" && pl.status !== "AwaitingInvoicing") return false;
      if (statusFilter === "invoiced" && pl.status !== "Invoiced" && pl.status !== "Dispatched" && pl.status !== "Delivered") return false;
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          pl.code.toLowerCase().includes(searchLower) ||
          pl.customerName.toLowerCase().includes(searchLower) ||
          pl.customerCode?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .sort((a, b) => {
      // Pendentes primeiro
      if (a.status === "AwaitingInvoicing" && b.status !== "AwaitingInvoicing") return -1;
      if (a.status !== "AwaitingInvoicing" && b.status === "AwaitingInvoicing") return 1;
      return 0;
    });

  // Contadores
  const isPostInvoice = (status: string) =>
    status === "Invoiced" || status === "Dispatched" || status === "Delivered";

  const statusCounts = {
    pending: packingLists.filter((pl) => pl.status === "AwaitingInvoicing").length,
    invoiced: packingLists.filter((pl) => isPostInvoice(pl.status)).length,
  };

  // Totais
  const totalPendingValue = packingLists
    .filter((pl) => pl.status === "AwaitingInvoicing")
    .reduce((sum, pl) => sum + pl.totalValue, 0);

  const totalInvoicedValue = packingLists
    .filter((pl) => isPostInvoice(pl.status))
    .reduce((sum, pl) => sum + pl.totalValue, 0);

  // ========== HELPERS ==========

  function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("pt-BR");
  }

  function formatCurrency(value: number): string {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function getStatusIcon(status: PackingListStatus) {
    const icons: Record<PackingListStatus, React.ReactNode> = {
      Pending: <Clock className="w-3 h-3" />,
      InSeparation: <Loader2 className="w-3 h-3 animate-spin" />,
      AwaitingConference: <Package className="w-3 h-3" />,
      InConference: <AlertCircle className="w-3 h-3" />,
      AwaitingInvoicing: <FileCheck className="w-3 h-3" />,
      Invoiced: <CheckCircle2 className="w-3 h-3" />,
      Dispatched: <Package className="w-3 h-3" />,
      Delivered: <CheckCircle2 className="w-3 h-3" />,
      InTransit: <Package className="w-3 h-3" />,
      Cancelled: <XCircle className="w-3 h-3" />,
    };
    return icons[status] || <Clock className="w-3 h-3" />;
  }

  function getStatusStyle(status: PackingListStatus): string {
  const styles: Record<PackingListStatus, string> = {
    Pending: "bg-slate-100 text-slate-700",
    InSeparation: "bg-blue-100 text-blue-700",
    AwaitingConference: "bg-indigo-100 text-indigo-700",
    InConference: "bg-purple-100 text-purple-700",
    AwaitingInvoicing: "bg-amber-100 text-amber-700",
    Invoiced: "bg-emerald-100 text-emerald-700",
    Dispatched: "bg-cyan-100 text-cyan-700",
    Delivered: "bg-teal-100 text-teal-700",
    InTransit: "bg-cyan-100 text-cyan-700",
    Cancelled: "bg-red-100 text-red-700",
  };
  return styles[status] || "bg-slate-100 text-slate-700";
}

function getStatusLabel(status: PackingListStatus): string {
  const labels: Record<PackingListStatus, string> = {
    Pending: "Pendente",
    InSeparation: "Em Separação",
    AwaitingConference: "Aguard. Conferência",
    InConference: "Em Conferência",
    AwaitingInvoicing: "Aguard. Faturamento",
    Invoiced: "Faturado",
    Dispatched: "Despachado",
    Delivered: "Entregue",
    InTransit: "Em Trânsito",
    Cancelled: "Cancelado",
  };
  return labels[status] || status;
}


  // ========== LOADING ==========

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  // ========== MAIN RENDER ==========

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Receipt className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Faturamento</h1>
            <p className="text-sm text-slate-500">Emissão de notas fiscais</p>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")}
          className={`bg-white border rounded-xl p-4 hover:shadow-md transition-all text-left ${
            statusFilter === "pending" ? "border-amber-500 ring-2 ring-amber-200" : "border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-2xl font-bold text-amber-600">{statusCounts.pending}</span>
          </div>
          <p className="text-sm font-medium text-slate-700">Aguardando Faturamento</p>
          <p className="text-lg font-bold text-amber-600">{formatCurrency(totalPendingValue)}</p>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === "invoiced" ? "all" : "invoiced")}
          className={`bg-white border rounded-xl p-4 hover:shadow-md transition-all text-left ${
            statusFilter === "invoiced" ? "border-emerald-500 ring-2 ring-emerald-200" : "border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-2xl font-bold text-emerald-600">{statusCounts.invoiced}</span>
          </div>
          <p className="text-sm font-medium text-slate-700">Faturados</p>
          <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalInvoicedValue)}</p>
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código do romaneio ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Lista de Romaneios */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Romaneio</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Cliente</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Data</th>
              <th className="text-center px-4 py-3 font-medium text-slate-600">Itens</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Valor</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">NF</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredLists.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                  <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium">Nenhum romaneio encontrado</p>
                  <p className="text-sm">Não há romaneios para faturar no momento</p>
                </td>
              </tr>
            ) : (
              filteredLists.map((pl) => (
                <tr key={pl.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">{pl.code}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-slate-600" />
                      </div>
                      <div>
                        <span className="font-medium text-slate-800 block">{pl.customerName}</span>
                        <span className="text-xs text-slate-500">{pl.customerCode}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {formatDate(pl.requestedAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="flex items-center justify-center gap-1.5 text-slate-600">
                      <Box className="w-3 h-3 text-slate-400" />
                      {pl.totalItems}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="flex items-center justify-end gap-1.5 text-emerald-600 font-bold">
                      <DollarSign className="w-3 h-3" />
                      {formatCurrency(pl.totalValue)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusStyle(pl.status)}`}>
                      {getStatusIcon(pl.status)}
                      {getStatusLabel(pl.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      {pl.invoiceNumber ? (
                        <span className="font-mono text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                          {pl.invoiceNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                      {(pl.status === "Invoiced" || pl.status === "Dispatched" || pl.status === "Delivered") && (
                        <button
                          onClick={() => openNfModal(pl)}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200 flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          {pl.hasCanhoto ? "Ver NFs/Canhoto" : "Gerenciar NFs"}
                        </button>
                      )}
                    </div>
                  </td>


                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openDetailModal(pl.id)}
                        className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="w-3 h-3" />
                        Ver
                      </button>
                      {pl.status === "AwaitingInvoicing" && (
                        <button
                          onClick={async () => {
                            const plFull = await packingListService.getById(pl.id);
                            setSelectedPackingList(plFull);
                            setShowInvoiceModal(true);
                          }}
                          className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
                        >
                          <FileText className="w-3 h-3" />
                          Faturar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ========== MODAL: DETALHES DO ROMANEIO ========== */}
      {showDetailModal && selectedPackingList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-600 to-emerald-700">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Romaneio {selectedPackingList.code}</h2>
                  <p className="text-sm text-emerald-100">
                    {selectedPackingList.customerCode} - {selectedPackingList.customerName}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-white/20 text-white`}>
                  {getStatusIcon(selectedPackingList.status)}
                  {getStatusLabel(selectedPackingList.status)}
                </span>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-white/10 rounded-lg text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-4 gap-4 p-6 bg-slate-50 border-b border-slate-200">
              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <p className="text-xs text-slate-500">Data Criação</p>
                <p className="font-medium text-slate-800">{formatDate(selectedPackingList.requestedAt)}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <p className="text-xs text-slate-500">Total de Itens</p>
                <p className="font-medium text-slate-800">{selectedPackingList.totalItems}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <p className="text-xs text-slate-500">Valor Total</p>
                <p className="font-bold text-emerald-600">{formatCurrency(selectedPackingList.totalValue)}</p>
              </div>
              {selectedPackingList.invoiceNumber && (
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                  <p className="text-xs text-emerald-600">Nota Fiscal</p>
                  <p className="font-bold text-emerald-800">{selectedPackingList.invoiceNumber}</p>
                </div>
              )}
            </div>

            {/* Itens */}
            <div className="px-6 py-4 overflow-auto max-h-[40vh]">
              <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Itens do Romaneio
              </h3>
              <table className="w-full text-sm">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-slate-600">Referência</th>
                    <th className="text-left px-3 py-2 font-medium text-slate-600">Descrição</th>
                    <th className="text-center px-3 py-2 font-medium text-slate-600">Qtd</th>
                    <th className="text-right px-3 py-2 font-medium text-slate-600">Preço Unit.</th>
                    <th className="text-right px-3 py-2 font-medium text-slate-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPackingList.items.map((item, index) => (
                    <tr key={item.id} className={`border-b border-slate-100 ${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                      <td className="px-3 py-3">
                        <span className="font-mono text-sm bg-slate-200 px-2 py-1 rounded text-slate-800">{item.reference}</span>
                      </td>
                      <td className="px-3 py-3 text-slate-800">{item.description}</td>
                      <td className="px-3 py-3 text-center text-slate-800">{item.quantity}</td>
                      <td className="px-3 py-3 text-right text-slate-800">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-3 py-3 text-right font-medium text-slate-800">{formatCurrency(item.totalValue)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100">
                  <tr>
                    <td colSpan={4} className="px-3 py-3 font-bold text-slate-700">Total</td>
                    <td className="px-3 py-3 text-right font-bold text-emerald-600">{formatCurrency(selectedPackingList.totalValue)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Actions Footer */}
            <div className="flex justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                Fechar
              </button>
              {selectedPackingList.status === "AwaitingInvoicing" && (
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowInvoiceModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  <FileText className="w-4 h-4" />
                  Faturar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL: FATURAMENTO ========== */}
{showInvoiceModal && selectedPackingList && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-800">Faturar Romaneio</h2>
        <button
          onClick={() => {
            setShowInvoiceModal(false);
            setInvoiceNumbers([]);
            setNewInvoice("");
          }}
          className="p-2 hover:bg-slate-100 rounded-lg"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="p-6">
        <p className="text-sm text-slate-600 mb-4">
          Romaneio: <strong>{selectedPackingList.code}</strong>
          <br />
          Cliente: <strong>{selectedPackingList.customerName}</strong>
          <br />
          Valor: <strong className="text-emerald-600">{formatCurrency(selectedPackingList.totalValue)}</strong>
        </p>

        <label className="block text-sm font-medium text-slate-700 mb-2">Adicionar Nota Fiscal</label>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newInvoice}
            onChange={(e) => setNewInvoice(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newInvoice.trim()) {
                e.preventDefault();
                if (!invoiceNumbers.includes(newInvoice.trim())) {
                  setInvoiceNumbers([...invoiceNumbers, newInvoice.trim()]);
                }
                setNewInvoice("");
              }
            }}
            placeholder="Ex: 123456"
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="button"
            onClick={() => {
              if (newInvoice.trim() && !invoiceNumbers.includes(newInvoice.trim())) {
                setInvoiceNumbers([...invoiceNumbers, newInvoice.trim()]);
                setNewInvoice("");
              }
            }}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
          >
            Adicionar
          </button>
        </div>

        {/* Lista de notas adicionadas */}
        {invoiceNumbers.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500">Notas adicionadas:</p>
            <div className="flex flex-wrap gap-2">
              {invoiceNumbers.map((nf, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm"
                >
                  <FileText className="w-3 h-3" />
                  {nf}
                  <button
                    type="button"
                    onClick={() => setInvoiceNumbers(invoiceNumbers.filter((_, i) => i !== index))}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
        <button
          onClick={() => {
            setShowInvoiceModal(false);
            setInvoiceNumbers([]);
            setNewInvoice("");
          }}
          className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          Cancelar
        </button>
        <button
          onClick={() => {
            if (invoiceNumbers.length > 0) {
              const allInvoices = invoiceNumbers.join(", ");
              handleInvoice(selectedPackingList.id, allInvoices);
            }
          }}
          disabled={actionLoading || invoiceNumbers.length === 0}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
        >
          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Confirmar ({invoiceNumbers.length} {invoiceNumbers.length === 1 ? "nota" : "notas"})
        </button>
      </div>
    </div>
  </div>
)}

{/* ========== MODAL: GERENCIAR NFs ========== */}
{showNfModal && nfModalId && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-blue-700">
        <div>
          <h2 className="text-lg font-bold text-white">Notas Fiscais</h2>
          <p className="text-sm text-blue-100">{nfModalCode} · {nfModalCustomer}</p>
        </div>
        <button onClick={() => setShowNfModal(false)} className="p-2 hover:bg-white/10 rounded-lg text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
        {/* Uma linha por NF registrada no faturamento */}
        {nfModalInvoiceNumbers.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Notas deste romaneio
            </p>
            {nfModalInvoiceNumbers.map((nfNum) => {
              const existing = nfModalPdfs.find((p) => p.nfNumber === nfNum);
              const canUpload = nfModalStatus === "Invoiced" || nfModalStatus === "Dispatched" || nfModalStatus === "Delivered";
              return (
                <div key={nfNum} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-white">
                  <div>
                    <span className="font-mono text-sm font-bold text-slate-800">NF {nfNum}</span>
                    {existing ? (
                      <span className="text-xs text-emerald-600 ml-2">PDF anexado</span>
                    ) : (
                      <span className="text-xs text-amber-500 ml-2">Sem PDF</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Upload inline por NF */}
                    {canUpload && !existing?.hasPdf && (
                      <>
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          id={`nf-upload-row-${nfNum}`}
                          disabled={nfUploadLoading}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleNfUpload(f, nfNum);
                            e.target.value = "";
                          }}
                        />
                        <label
                          htmlFor={`nf-upload-row-${nfNum}`}
                          className={`cursor-pointer text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 ${
                            nfUploadLoading
                              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                        >
                          {nfUploadLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                          Anexar PDF
                        </label>
                      </>
                    )}
                    {existing?.hasPdf && (
                      <a
                        href={packingListService.getNfPdfFileUrl(nfModalId, existing.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        Ver NF
                      </a>
                    )}
                    {nfModalStatus === "Delivered" && existing?.hasPdf && (
                      existing.hasCanhoto ? (
                        <a
                          href={packingListService.getNfCanhotoUrl(nfModalId, existing.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded hover:bg-teal-200 flex items-center gap-1"
                        >
                          ⬇ Canhoto
                        </a>
                      ) : (
                        <button
                          onClick={() => handleGenerateNfCanhoto(existing.id)}
                          className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200"
                        >
                          Gerar Canhoto
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* NF PDFs avulsos (não listados no invoiceNumber) */}
        {nfModalPdfs.filter((p) => !nfModalInvoiceNumbers.includes(p.nfNumber)).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Outros PDFs anexados</p>
            {nfModalPdfs
              .filter((p) => !nfModalInvoiceNumbers.includes(p.nfNumber))
              .map((nf) => (
                <div key={nf.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-white">
                  <div>
                    <span className="font-mono text-sm font-bold text-slate-800">NF {nf.nfNumber}</span>
                    <span className="text-xs text-slate-400 ml-2">
                      {new Date(nf.uploadedAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {nf.hasPdf && (
                      <a
                        href={packingListService.getNfPdfFileUrl(nfModalId, nf.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        Ver NF
                      </a>
                    )}
                    {nfModalStatus === "Delivered" && nf.hasPdf && (
                      nf.hasCanhoto ? (
                        <a
                          href={packingListService.getNfCanhotoUrl(nfModalId, nf.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded hover:bg-teal-200 flex items-center gap-1"
                        >
                          ⬇ Canhoto
                        </a>
                      ) : (
                        <button
                          onClick={() => handleGenerateNfCanhoto(nf.id)}
                          className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200"
                        >
                          Gerar Canhoto
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}

        {nfModalInvoiceNumbers.length === 0 && nfModalPdfs.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6">Nenhuma NF registrada</p>
        )}

        {/* Adicionar NF extra (não listada no faturamento) */}
        {(nfModalStatus === "Invoiced" || nfModalStatus === "Dispatched" || nfModalStatus === "Delivered") && (
          <div className="border border-dashed border-slate-300 rounded-lg p-3 bg-slate-50">
            <p className="text-xs font-medium text-slate-500 mb-2">Adicionar NF extra</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={nfUploadNumber}
                onChange={(e) => setNfUploadNumber(e.target.value)}
                placeholder="Número da NF"
                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                id="nf-modal-upload-extra"
                disabled={nfUploadLoading || !nfUploadNumber.trim()}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleNfUpload(f, nfUploadNumber.trim());
                  e.target.value = "";
                }}
              />
              <label
                htmlFor="nf-modal-upload-extra"
                className={`cursor-pointer text-sm px-3 py-1.5 rounded-lg flex items-center gap-1 ${
                  nfUploadNumber.trim() && !nfUploadLoading
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                {nfUploadLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                Anexar
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end px-6 py-4 border-t border-slate-200 bg-slate-50">
        <button
          onClick={() => setShowNfModal(false)}
          className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          Fechar
        </button>
      </div>
    </div>
  </div>
)}
</div>
  );
}

