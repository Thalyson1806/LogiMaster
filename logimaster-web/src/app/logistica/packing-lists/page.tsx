"use client";

import { useEffect, useState } from "react";
import {
  PackingListSummary,
  PackingList,
  CustomerPendingSummary,
  BillingRequestItem,
  CreatePackingListInput,
  CreatePackingListItemInput,
  PackingListStatus,
} from "@/lib/types";
import { packingListService, billingRequestService } from "@/lib/services";
import {
  Truck,
  Clock,
  Search,
  Package,
  Users,
  DollarSign,
  Calendar,
  Plus,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Loader2,
  FileCheck,
  AlertCircle,
  X,
  Play,
  Check,
  FileText,
  Eye,
  ArrowRight,
  Ban,
} from "lucide-react";

export default function PackingListsPage() {
  const [packingLists, setPackingLists] = useState<PackingListSummary[]>([]);
  const [pendingSummary, setPendingSummary] = useState<CustomerPendingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"lists" | "pending">("pending");
  const [search, setSearch] = useState("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerPendingSummary | null>(null);
  const [selectedPackingList, setSelectedPackingList] = useState<PackingList | null>(null);
  const [pendingItems, setPendingItems] = useState<BillingRequestItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<number, number>>({});
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [conferenceLoading, setConferenceLoading] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [lists, summary] = await Promise.all([
        packingListService.getAll(),
        billingRequestService.getPendingSummary(),
      ]);
      setPackingLists(lists as PackingListSummary[]);
      setPendingSummary(summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function openCreateModal(customer: CustomerPendingSummary) {
    setSelectedCustomer(customer);
    setSelectedItems({});
    try {
      const items = await billingRequestService.getPendingItemsByCustomer(customer.customerId);
      setPendingItems(items.filter((i) => i.pendingQuantity > 0));
      const allSelected: Record<number, number> = {};
      items.forEach((item) => {
        if (item.pendingQuantity > 0) {
          allSelected[item.id] = item.pendingQuantity;
        }
      });
      setSelectedItems(allSelected);
      setShowCreateModal(true);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar itens pendentes");
    }
  }

  async function openDetailModal(packingListId: number) {
    try {
      const pl = await packingListService.getById(packingListId);
      console.log("PackingList carregado:", pl);
      setSelectedPackingList(pl);
      setShowDetailModal(true);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar romaneio");
    }
  }

  function toggleItemSelection(itemId: number, maxQty: number) {
    setSelectedItems((prev) => {
      if (prev[itemId]) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: maxQty };
    });
  }

  function updateItemQuantity(itemId: number, qty: number, maxQty: number) {
    if (qty <= 0) {
      const { [itemId]: _, ...rest } = selectedItems;
      setSelectedItems(rest);
    } else {
      setSelectedItems((prev) => ({
        ...prev,
        [itemId]: Math.min(qty, maxQty),
      }));
    }
  }

  async function createPackingList() {
    if (!selectedCustomer) return;

    const items: CreatePackingListItemInput[] = Object.entries(selectedItems)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, qty]) => {
        const item = pendingItems.find((i) => i.id === Number(itemId));
        return {
          productId: item?.productId || 0,
          billingRequestItemId: Number(itemId),
          edi: 0,
          quantity: qty,
          unitPrice: item?.unitPrice,
        };
      });

    if (items.length === 0) {
      alert("Selecione pelo menos um item");
      return;
    }

    const data: CreatePackingListInput = {
      customerId: selectedCustomer.customerId,
      items,
    };

    try {
      setActionLoading(true);
      await packingListService.create(data);
      setShowCreateModal(false);
      await loadData();
      setActiveTab("lists");
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || "Erro ao criar romaneio");
    } finally {
      setActionLoading(false);
    }
  }

  // ========== WORKFLOW ACTIONS ==========

  async function handleStartSeparation(id: number) {
    try {
      setActionLoading(true);
      const updated = await packingListService.startSeparation(id);
      setSelectedPackingList(updated);
      await loadData();
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || "Erro ao iniciar separação");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCompleteSeparation(id: number) {
    try {
      setActionLoading(true);
      const updated = await packingListService.completeSeparation(id);
      setSelectedPackingList(updated);
      await loadData();
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || "Erro ao completar separação");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStartConference(id: number) {
    try {
      setActionLoading(true);
      const updated = await packingListService.startConference(id);
      setSelectedPackingList(updated);
      await loadData();
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || "Erro ao iniciar conferência");
    } finally {
      setActionLoading(false);
    }
  }

  // Conferir um item individualmente
  async function handleConferenceItem(packingListId: number, itemId: number) {
    try {
      setConferenceLoading(itemId);
      const updated = await packingListService.conferenceItem(packingListId, {
        itemId: itemId,
      });
      setSelectedPackingList(updated);
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || "Erro ao conferir item");
    } finally {
      setConferenceLoading(null);
    }
  }

  // Conferir TODOS os itens de uma vez
  async function handleConferenceAllItems(packingListId: number) {
    if (!selectedPackingList) return;
    
    const itemsToConference = selectedPackingList.items.filter(i => !i.isConferenced);
    
    try {
      setActionLoading(true);
      
      for (const item of itemsToConference) {
        await packingListService.conferenceItem(packingListId, {
          itemId: item.id,
        });
      }
      
      // Recarrega o romaneio atualizado
      const updated = await packingListService.getById(packingListId);
      setSelectedPackingList(updated);
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || "Erro ao conferir itens");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCompleteConference(id: number) {
    try {
      setActionLoading(true);
      const updated = await packingListService.completeConference(id);
      setSelectedPackingList(updated);
      await loadData();
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || "Erro ao completar conferência");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleInvoice(id: number) {
    if (!invoiceNumber.trim()) {
      alert("Informe o número da nota fiscal");
      return;
    }

    try {
      setActionLoading(true);
      const updated = await packingListService.invoice(id, { invoiceNumber: invoiceNumber.trim() });
      setSelectedPackingList(updated);
      setShowInvoiceModal(false);
      setInvoiceNumber("");
      await loadData();
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || "Erro ao faturar");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel(id: number) {
    if (!confirm("Tem certeza que deseja cancelar este romaneio?")) return;

    try {
      setActionLoading(true);
      await packingListService.cancel(id);
      setShowDetailModal(false);
      await loadData();
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || "Erro ao cancelar");
    } finally {
      setActionLoading(false);
    }
  }

  // ========== FILTERS ==========

  const filteredPending = search
    ? pendingSummary.filter(
        (s) =>
          s.customerCode.toLowerCase().includes(search.toLowerCase()) ||
          s.customerName.toLowerCase().includes(search.toLowerCase())
      )
    : pendingSummary;

  const filteredLists = search
    ? packingLists.filter(
        (pl) =>
          pl.code.toLowerCase().includes(search.toLowerCase()) ||
          pl.customerName.toLowerCase().includes(search.toLowerCase())
      )
    : packingLists;

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
      InTransit: "Em Trânsito",
      Cancelled: "Cancelado",
    };
    return labels[status] || status;
  }

  // ========== RENDER WORKFLOW BUTTONS ==========

  function renderWorkflowActions() {
    if (!selectedPackingList) return null;

    const status = selectedPackingList.status;
    const id = selectedPackingList.id;
    
    // Conta quantos itens faltam conferir
    const itemsNotConferenced = selectedPackingList.items.filter(i => !i.isConferenced).length;
    const allConferenced = itemsNotConferenced === 0;

    return (
      <div className="flex gap-2 flex-wrap">
        {/* PENDENTE -> Iniciar Separação */}
        {status === "Pending" && (
          <button
            onClick={() => handleStartSeparation(id)}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Iniciar Separação
          </button>
        )}

        {/* EM SEPARAÇÃO -> Finalizar Separação */}
        {status === "InSeparation" && (
          <button
            onClick={() => handleCompleteSeparation(id)}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Finalizar Separação
          </button>
        )}

        {/* AGUARDANDO CONFERÊNCIA -> Iniciar Conferência */}
        {status === "AwaitingConference" && (
          <button
            onClick={() => handleStartConference(id)}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
            Iniciar Conferência
          </button>
        )}

        {/* EM CONFERÊNCIA -> Conferir Todos + Finalizar */}
        {status === "InConference" && (
          <>
            {!allConferenced && (
              <button
                onClick={() => handleConferenceAllItems(id)}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Conferir Todos ({itemsNotConferenced})
              </button>
            )}
            <button
              onClick={() => handleCompleteConference(id)}
              disabled={actionLoading || !allConferenced}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg disabled:opacity-50 ${
                allConferenced 
                  ? "bg-pink-600 text-white hover:bg-pink-700" 
                  : "bg-slate-200 text-slate-500 cursor-not-allowed"
              }`}
              title={!allConferenced ? `Falta conferir ${itemsNotConferenced} item(s)` : ""}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Finalizar Conferência
            </button>
          </>
        )}

        {/* AGUARDANDO FATURAMENTO -> Faturar */}
        {status === "AwaitingInvoicing" && (
          <button
            onClick={() => setShowInvoiceModal(true)}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Faturar
          </button>
        )}

        {/* CANCELAR */}
        {status !== "Invoiced" && status !== "Cancelled" && (
          <button
            onClick={() => handleCancel(id)}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
          >
            <Ban className="w-4 h-4" />
            Cancelar
          </button>
        )}
      </div>
    );
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
            <Truck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Romaneios</h1>
            <p className="text-sm text-slate-500">Gerencie os romaneios de entrega</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors ${
            activeTab === "pending"
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Clock className="w-4 h-4" />
          Pendências
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === "pending" ? "bg-white/20" : "bg-slate-200"}`}>
            {pendingSummary.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("lists")}
          className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors ${
            activeTab === "lists"
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Truck className="w-4 h-4" />
          Romaneios
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === "lists" ? "bg-white/20" : "bg-slate-200"}`}>
            {packingLists.length}
          </span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === "pending" ? "Buscar por código ou cliente..." : "Buscar romaneio..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tab: Pendências */}
      {activeTab === "pending" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Código</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Itens</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Quantidade</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Valor</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredPending.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">Nenhuma pendência encontrada</p>
                    <p className="text-sm">Todos os itens foram processados</p>
                  </td>
                </tr>
              ) : (
                filteredPending.map((summary) => (
                  <tr key={summary.customerId} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{summary.customerCode}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-slate-800">{summary.customerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <Package className="w-3 h-3 text-slate-400" />
                        {summary.totalItems}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-600">{summary.totalPendingQuantity}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                        <DollarSign className="w-3 h-3" />
                        {formatCurrency(summary.totalPendingValue)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openCreateModal(summary)}
                        className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-700 transition-colors flex items-center gap-1.5 ml-auto"
                      >
                        <Plus className="w-3 h-3" />
                        Criar Romaneio
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Romaneios */}
      {activeTab === "lists" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Código</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Data</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Itens</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Valor</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredLists.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <Truck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">Nenhum romaneio criado</p>
                    <p className="text-sm">Crie um romaneio a partir das pendências</p>
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
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-slate-800">{pl.customerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDate(pl.requestedAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <Package className="w-3 h-3 text-slate-400" />
                        {pl.totalItems}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
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
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openDetailModal(pl.id)}
                        className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs hover:bg-slate-200 transition-colors flex items-center gap-1.5 ml-auto"
                      >
                        <Eye className="w-3 h-3" />
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ========== MODAL: CRIAR ROMANEIO ========== */}
      {showCreateModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Criar Romaneio</h2>
                <p className="text-sm text-slate-500">
                  Cliente: {selectedCustomer.customerCode} - {selectedCustomer.customerName}
                </p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 overflow-auto max-h-[60vh]">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-slate-600">
                      <input
                        type="checkbox"
                        checked={pendingItems.length > 0 && Object.keys(selectedItems).length === pendingItems.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const all: Record<number, number> = {};
                            pendingItems.forEach((item) => {
                              all[item.id] = item.pendingQuantity;
                            });
                            setSelectedItems(all);
                          } else {
                            setSelectedItems({});
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-slate-600">Referência</th>
                    <th className="text-left px-3 py-2 font-medium text-slate-600">Descrição</th>
                    <th className="text-right px-3 py-2 font-medium text-slate-600">Pendente</th>
                    <th className="text-right px-3 py-2 font-medium text-slate-600">Quantidade</th>
                    <th className="text-right px-3 py-2 font-medium text-slate-600">Preço Unit.</th>
                    <th className="text-right px-3 py-2 font-medium text-slate-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingItems.map((item) => (
                    <tr key={item.id} className={`border-b border-slate-100 ${selectedItems[item.id] ? "bg-emerald-50" : ""}`}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={!!selectedItems[item.id]}
                          onChange={() => toggleItemSelection(item.id, item.pendingQuantity)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-gray-900">{item.productReference}</td>
                      <td className="px-3 py-2 text-gray-900">{item.productDescription}</td>
                      <td className="px-3 py-2 text-right text-gray-900">{item.pendingQuantity}</td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          max={item.pendingQuantity}
                          value={selectedItems[item.id] || 0}
                          onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 0, item.pendingQuantity)}
                          disabled={!selectedItems[item.id]}
                          className="w-20 px-2 py-1 border border-slate-200 rounded text-right text-sm text-gray-900 disabled:bg-slate-100"
                        />
                      </td>
                      <td className="px-3 py-2 text-right text-gray-900">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900">
                        {formatCurrency((selectedItems[item.id] || 0) * item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50">
                  <tr>
                    <td colSpan={4} className="px-3 py-2 font-medium text-gray-900">Total Selecionado</td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900">
                      {Object.values(selectedItems).reduce((a, b) => a + b, 0)}
                    </td>
                    <td></td>
                    <td className="px-3 py-2 text-right font-bold text-emerald-600">
                      {formatCurrency(
                        Object.entries(selectedItems).reduce((total, [itemId, qty]) => {
                          const item = pendingItems.find((i) => i.id === Number(itemId));
                          return total + (item?.unitPrice || 0) * qty;
                        }, 0)
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                Cancelar
              </button>
              <button
                onClick={createPackingList}
                disabled={actionLoading || Object.keys(selectedItems).length === 0}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Criar Romaneio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL: DETALHES DO ROMANEIO ========== */}
      {showDetailModal && selectedPackingList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Romaneio {selectedPackingList.code}</h2>
                  <p className="text-sm text-slate-500">
                    {selectedPackingList.customerCode} - {selectedPackingList.customerName}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${getStatusStyle(selectedPackingList.status)}`}>
                  {getStatusIcon(selectedPackingList.status)}
                  {getStatusLabel(selectedPackingList.status)}
                </span>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Timeline */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                  selectedPackingList.status !== "Pending" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                }`}>
                  <ClipboardList className="w-4 h-4" />
                  <span className="text-xs font-medium">Criado</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300" />
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                  ["InSeparation", "AwaitingConference", "InConference", "AwaitingInvoicing", "Invoiced"].includes(selectedPackingList.status)
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-400"
                }`}>
                  <Package className="w-4 h-4" />
                  <span className="text-xs font-medium">Separação</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300" />
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                  ["InConference", "AwaitingInvoicing", "Invoiced"].includes(selectedPackingList.status)
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-400"
                }`}>
                  <FileCheck className="w-4 h-4" />
                  <span className="text-xs font-medium">Conferência</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300" />
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                  selectedPackingList.status === "Invoiced" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                }`}>
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-medium">Faturado</span>
                </div>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-4 gap-4 p-6">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Data Criação</p>
                <p className="font-medium text-slate-800">{formatDate(selectedPackingList.requestedAt)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Total Itens</p>
                <p className="font-medium text-slate-800">{selectedPackingList.totalItems}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">Valor Total</p>
                <p className="font-medium text-emerald-600">{formatCurrency(selectedPackingList.totalValue)}</p>
              </div>
              {selectedPackingList.invoiceNumber && (
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-xs text-emerald-600">Nota Fiscal</p>
                  <p className="font-medium text-emerald-800">{selectedPackingList.invoiceNumber}</p>
                </div>
              )}
            </div>

            {/* Itens - Com botão de conferir quando em conferência */}
            <div className="px-6 pb-4 overflow-auto max-h-[30vh]">
              {selectedPackingList.status === "InConference" && (
                <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-700">
                    <strong>Em Conferência:</strong> Confira cada item clicando no botão ou use "Conferir Todos" abaixo.
                  </p>
                </div>
              )}
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-slate-600">Referência</th>
                    <th className="text-left px-3 py-2 font-medium text-slate-600">Descrição</th>
                    <th className="text-right px-3 py-2 font-medium text-slate-600">Qtd</th>
                    <th className="text-right px-3 py-2 font-medium text-slate-600">Preço</th>
                    <th className="text-right px-3 py-2 font-medium text-slate-600">Total</th>
                    <th className="text-center px-3 py-2 font-medium text-slate-600">Conferido</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPackingList.items.map((item) => (
                    <tr key={item.id} className={`border-b border-slate-100 ${item.isConferenced ? "bg-emerald-50/50" : ""}`}>
                      <td className="px-3 py-2 font-mono text-xs text-gray-900">{item.reference}</td>
                      <td className="px-3 py-2 text-gray-900">{item.description}</td>
                      <td className="px-3 py-2 text-right text-gray-900">{item.quantity}</td>
                      <td className="px-3 py-2 text-right text-gray-900">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900">{formatCurrency(item.totalValue)}</td>
                      <td className="px-3 py-2 text-center">
                        {item.isConferenced ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                        ) : selectedPackingList.status === "InConference" ? (
                          <button
                            onClick={() => handleConferenceItem(selectedPackingList.id, item.id)}
                            disabled={conferenceLoading === item.id}
                            className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 disabled:opacity-50"
                          >
                            {conferenceLoading === item.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              "Conferir"
                            )}
                          </button>
                        ) : (
                          <div className="w-5 h-5 border-2 border-slate-200 rounded-full mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions Footer */}
            <div className="flex justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                Fechar
              </button>
              {renderWorkflowActions()}
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
                  setInvoiceNumber("");
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
                Valor: <strong>{formatCurrency(selectedPackingList.totalValue)}</strong>
              </p>

              <label className="block text-sm font-medium text-slate-700 mb-2">Número da Nota Fiscal</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Ex: 123456"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => {
                  setShowInvoiceModal(false);
                  setInvoiceNumber("");
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleInvoice(selectedPackingList.id)}
                disabled={actionLoading || !invoiceNumber.trim()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Confirmar Faturamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
