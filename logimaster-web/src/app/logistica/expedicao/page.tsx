"use client";

import { useEffect, useState } from "react";
import {
  startConnection,
  onPackingListUpdated,
  offPackingListUpdated,
} from "@/lib/signalr";
import {
  PackingListSummary,
  PackingList,
  PackingListStatus,
} from "@/lib/types";
import { packingListService } from "@/lib/services";
import {
  PackageSearch,
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
  Play,
  Check,
  Eye,
  Box,
  Boxes,
  ClipboardList,
  Wifi,
  WifiOff,
} from "lucide-react";

export default function ExpedicaoPage() {
  const [packingLists, setPackingLists] = useState<PackingListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PackingListStatus | "all">("all");
  const [connected, setConnected] = useState(false);

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPackingList, setSelectedPackingList] = useState<PackingList | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();

    // Conecta ao SignalR
    startConnection().then(() => {
      setConnected(true);
    });

    // Escuta atualizações em tempo real
    onPackingListUpdated((data) => {
      console.log("Romaneio atualizado via SignalR:", data);
      loadData(); // Recarrega a lista automaticamente
    });

    return () => {
      offPackingListUpdated();
    };
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const lists = await packingListService.getAll();
      const expeditionLists = (lists as PackingListSummary[]).filter(
        (pl) => pl.status !== "Invoiced" && pl.status !== "Cancelled"
      );
      setPackingLists(expeditionLists);
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

  // ========== FILTERS ==========

  const filteredLists = packingLists
    .filter((pl) => {
      if (statusFilter !== "all" && pl.status !== statusFilter) return false;
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
      const priority: Record<string, number> = {
        InSeparation: 1,
        Pending: 2,
        AwaitingConference: 3,
        InConference: 4,
        AwaitingInvoicing: 5,
      };
      return (priority[a.status] || 99) - (priority[b.status] || 99);
    });

  const statusCounts = {
    pending: packingLists.filter((pl) => pl.status === "Pending").length,
    inSeparation: packingLists.filter((pl) => pl.status === "InSeparation").length,
    awaitingConference: packingLists.filter((pl) => pl.status === "AwaitingConference").length,
  };

  // ========== HELPERS ==========

  function formatDate(dateStr: string | undefined): string {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("pt-BR");
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

    return (
      <div className="flex gap-2 flex-wrap">
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

        {status === "InSeparation" && (
          <button
            onClick={() => handleCompleteSeparation(id)}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Finalizar Separação
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
          <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
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
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <PackageSearch className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Expedição</h1>
            <p className="text-sm text-slate-500">Separação de pedidos</p>
          </div>
        </div>

        {/* Indicador de conexão SignalR */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${
          connected ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
        }`}>
          {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {connected ? "Tempo real ativo" : "Desconectado"}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setStatusFilter(statusFilter === "Pending" ? "all" : "Pending")}
          className={`bg-white border rounded-xl p-4 hover:shadow-md transition-all text-left ${
            statusFilter === "Pending" ? "border-slate-500 ring-2 ring-slate-200" : "border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-slate-600" />
            </div>
            <span className="text-2xl font-bold text-slate-800">{statusCounts.pending}</span>
          </div>
          <p className="text-sm font-medium text-slate-700">Pendentes</p>
          <p className="text-xs text-slate-500">Aguardando separação</p>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === "InSeparation" ? "all" : "InSeparation")}
          className={`bg-white border rounded-xl p-4 hover:shadow-md transition-all text-left ${
            statusFilter === "InSeparation" ? "border-blue-500 ring-2 ring-blue-200" : "border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            </div>
            <span className="text-2xl font-bold text-blue-600">{statusCounts.inSeparation}</span>
          </div>
          <p className="text-sm font-medium text-slate-700">Em Separação</p>
          <p className="text-xs text-slate-500">Sendo separados agora</p>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === "AwaitingConference" ? "all" : "AwaitingConference")}
          className={`bg-white border rounded-xl p-4 hover:shadow-md transition-all text-left ${
            statusFilter === "AwaitingConference" ? "border-indigo-500 ring-2 ring-indigo-200" : "border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-2xl font-bold text-indigo-600">{statusCounts.awaitingConference}</span>
          </div>
          <p className="text-sm font-medium text-slate-700">Separados</p>
          <p className="text-xs text-slate-500">Aguardando conferência</p>
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
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <th className="text-left px-4 py-3 font-medium text-slate-600">Responsável</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredLists.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  <PackageSearch className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium">Nenhum romaneio para separar</p>
                  <p className="text-sm">Todos os romaneios foram processados</p>
                </td>
              </tr>
            ) : (
              filteredLists.map((pl) => (
                <tr key={pl.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{pl.code}</span>
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
                      <Boxes className="w-3 h-3 text-slate-400" />
                      {pl.totalItems}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {pl.separatedByName ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                        <Users className="w-3 h-3" />
                        {pl.separatedByName}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
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
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700 transition-colors flex items-center gap-1.5 ml-auto"
                    >
                      <Eye className="w-3 h-3" />
                      Ver Itens
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ========== MODAL: DETALHES PARA SEPARAÇÃO ========== */}
      {showDetailModal && selectedPackingList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-blue-700">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Romaneio {selectedPackingList.code}</h2>
                  <p className="text-sm text-blue-100">
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
                <p className="text-xs text-slate-500">Total de Volumes</p>
                <p className="font-medium text-slate-800">{selectedPackingList.totalVolumes || "-"}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <p className="text-xs text-slate-500">Peso Total</p>
                <p className="font-medium text-slate-800">
                  {selectedPackingList.totalWeight ? `${selectedPackingList.totalWeight.toFixed(2)} kg` : "-"}
                </p>
              </div>
            </div>

            {/* Responsáveis pelo Romaneio */}
            {(selectedPackingList.createdByName || selectedPackingList.separatedByName || selectedPackingList.conferencedByName) && (
              <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200">
                {selectedPackingList.createdByName && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Criado por</p>
                      <p className="text-sm font-medium text-slate-700">{selectedPackingList.createdByName}</p>
                    </div>
                  </div>
                )}
                {selectedPackingList.separatedByName && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Separado por</p>
                      <p className="text-sm font-medium text-blue-700">{selectedPackingList.separatedByName}</p>
                      {selectedPackingList.separatedAt && (
                        <p className="text-xs text-slate-400">{formatDate(selectedPackingList.separatedAt)}</p>
                      )}
                    </div>
                  </div>
                )}
                {selectedPackingList.conferencedByName && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Conferido por</p>
                      <p className="text-sm font-medium text-emerald-700">{selectedPackingList.conferencedByName}</p>
                      {selectedPackingList.conferencedAt && (
                        <p className="text-xs text-slate-400">{formatDate(selectedPackingList.conferencedAt)}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}


            {/* Aviso de Status */}
            {selectedPackingList.status === "Pending" && (
              <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <p className="text-sm text-amber-700">
                  <strong>Aguardando início:</strong> Clique em "Iniciar Separação" para começar.
                </p>
              </div>
            )}

            {selectedPackingList.status === "InSeparation" && (
              <div className="mx-6 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <p className="text-sm text-blue-700">
                  <strong>Em separação:</strong> Separe os itens abaixo e clique em "Finalizar Separação" quando terminar.
                </p>
              </div>
            )}

            {/* Itens para Separar */}
            <div className="px-6 py-4 overflow-auto max-h-[40vh]">
              <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Itens para Separar
              </h3>
              <table className="w-full text-sm">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-slate-600">Referência</th>
                    <th className="text-left px-3 py-2 font-medium text-slate-600">Descrição</th>
                    <th className="text-center px-3 py-2 font-medium text-slate-600">Quantidade</th>
                    <th className="text-center px-3 py-2 font-medium text-slate-600">Unid/Caixa</th>
                    <th className="text-center px-3 py-2 font-medium text-slate-600">Volumes</th>
                    <th className="text-center px-3 py-2 font-medium text-slate-600">Embalagem</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPackingList.items.map((item, index) => (
                    <tr key={item.id} className={`border-b border-slate-100 ${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                      <td className="px-3 py-3">
                        <span className="font-mono text-sm bg-slate-200 px-2 py-1 rounded text-slate-800">{item.reference}</span>
                      </td>
                      <td className="px-3 py-3 text-slate-800">{item.description}</td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-[50px] px-3 py-1 bg-blue-100 text-blue-800 font-bold rounded-lg">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-slate-600">{item.unitsPerBox || "-"}</td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-[40px] px-2 py-1 bg-amber-100 text-amber-800 font-bold rounded">
                          {item.volumes || Math.ceil(item.quantity / (item.unitsPerBox || 1))}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                          <Box className="w-3 h-3" />
                          Caixa
                        </span>
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
    </div>
  );
}
