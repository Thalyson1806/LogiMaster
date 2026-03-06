"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  EdifactFileSummary,
  EdifactFileDetail,
  Customer,
} from "@/lib/types";
import { edifactService, customerService } from "@/lib/services";
import {
  FileInput,
  Upload,
  CheckCircle,
  AlertTriangle,
  Clock,
  XCircle,
  Eye,
  X,
  ArrowLeft,
  FolderInput,
  RefreshCw,
  Loader2,
  Zap,
  FileText,
} from "lucide-react";

export default function EdiImportPage() {
  const [files, setFiles] = useState<EdifactFileSummary[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Upload manual
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(0);
  const [selectedMessageType, setSelectedMessageType] = useState<number>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Detalhe
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [fileDetail, setFileDetail] = useState<EdifactFileDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [filesData, customersData] = await Promise.all([
        edifactService.getAll(),
        customerService.getAll(),
      ]);
      setFiles(filesData);
      setCustomers(customersData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    try {
      setRefreshing(true);
      const filesData = await edifactService.getAll();
      setFiles(filesData);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleUpload() {
    if (!selectedFile || !selectedCustomerId) return;
    try {
      setUploading(true);
      const uploaded = await edifactService.upload(selectedFile, selectedCustomerId, selectedMessageType);
      // Processar imediatamente
      await edifactService.process(uploaded.id);
      setShowUploadModal(false);
      setSelectedFile(null);
      setSelectedCustomerId(0);
      await handleRefresh();
    } catch (err: any) {
      alert(err.message || "Erro ao importar arquivo");
    } finally {
      setUploading(false);
    }
  }

  async function handleViewDetail(id: number) {
    try {
      setLoadingDetail(true);
      setShowDetailModal(true);
      const detail = await edifactService.getById(id);
      setFileDetail(detail);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "Completed":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "PartialError":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "Error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "Processing":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  }

  function getStatusBadge(status: string) {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      Completed: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Concluído" },
      PartialError: { bg: "bg-amber-100", text: "text-amber-700", label: "Parcial" },
      Error: { bg: "bg-red-100", text: "text-red-700", label: "Erro" },
      Processing: { bg: "bg-blue-100", text: "text-blue-700", label: "Processando" },
      Pending: { bg: "bg-slate-100", text: "text-slate-600", label: "Pendente" },
    };
    const s = map[status] || map.Pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${s.bg} ${s.text}`}>
        {getStatusIcon(status)}
        {s.label}
      </span>
    );
  }

  function getMessageTypeBadge(type: string) {
    const colors: Record<string, string> = {
      DELFOR: "bg-blue-100 text-blue-700",
      DELJIT: "bg-purple-100 text-purple-700",
      RND: "bg-teal-100 text-teal-700",
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${colors[type] || "bg-slate-100 text-slate-600"}`}>
        {type}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-teal-600 rounded-full animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Link href="/edi" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
            <FileInput className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">EDI Automático</h1>
            <p className="text-sm text-slate-500">Importação automática de arquivos DELFOR, DELJIT e RND</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="border border-slate-300 text-slate-600 px-3 py-2 text-sm rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-teal-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Manual
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <FolderInput className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-teal-800">Monitoramento automático ativo</p>
          <p className="text-xs text-teal-600 mt-1">
            Arquivos <code className="bg-teal-100 px-1 rounded">.edi</code> colocados em{" "}
            <code className="bg-teal-100 px-1 rounded">C:\EDI\Entrada</code>{" "}
            são importados automaticamente. Formatos suportados: DELFOR, DELJIT e RND/ANFAVEA.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-slate-800">{files.length}</p>
          <p className="text-xs text-slate-500">Total de arquivos</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-emerald-600">
            {files.filter((f) => f.statusName === "Completed").length}
          </p>
          <p className="text-xs text-slate-500">Processados com sucesso</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-amber-600">
            {files.filter((f) => f.statusName === "PartialError").length}
          </p>
          <p className="text-xs text-slate-500">Com avisos</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-red-600">
            {files.filter((f) => f.statusName === "Error").length}
          </p>
          <p className="text-xs text-slate-500">Com erro</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">Arquivos Importados</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Arquivo</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Cliente</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Formato</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Recebido</th>
              <th className="text-center px-4 py-3 font-medium text-slate-600">Itens</th>
              <th className="text-center px-4 py-3 font-medium text-slate-600">Erros</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="text-center px-4 py-3 font-medium text-slate-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {files.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                  <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p>Nenhum arquivo EDI importado ainda</p>
                  <p className="text-xs mt-1">Coloque arquivos .edi em C:\EDI\Entrada ou use o upload manual</p>
                </td>
              </tr>
            ) : (
              files.map((file) => (
                <tr key={file.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-800">{file.originalFileName}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{file.customerName}</td>
                  <td className="px-4 py-3">{getMessageTypeBadge(file.messageTypeName)}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(file.receivedAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono text-sm">{file.totalItemsProcessed}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {file.totalItemsWithError > 0 ? (
                      <span className="font-mono text-sm text-red-600">{file.totalItemsWithError}</span>
                    ) : (
                      <span className="font-mono text-sm text-slate-400">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(file.statusName)}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleViewDetail(file.id)}
                      className="text-teal-600 hover:text-teal-800 transition-colors p-1"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">Upload Manual de Arquivo EDI</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value={0}>Selecione...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Formato</label>
                <select
                  value={selectedMessageType}
                  onChange={(e) => setSelectedMessageType(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value={1}>DELFOR</option>
                  <option value={6}>DELJIT</option>
                  <option value={7}>RND/ANFAVEA</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Arquivo .edi</label>
                <input
                  type="file"
                  accept=".edi,.txt"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-teal-50 file:text-teal-700"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-200">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !selectedFile || !selectedCustomerId}
                className="bg-teal-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Importar e Processar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">
                Detalhes do Arquivo
                {fileDetail && (
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    {fileDetail.originalFileName}
                  </span>
                )}
              </h3>
              <button
                onClick={() => { setShowDetailModal(false); setFileDetail(null); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-5 h-5 border-2 border-slate-300 border-t-teal-600 rounded-full animate-spin" />
              </div>
            ) : fileDetail ? (
              <div className="overflow-y-auto flex-1">
                {/* File Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5 border-b border-slate-200 bg-slate-50">
                  <div>
                    <p className="text-xs text-slate-500">Cliente</p>
                    <p className="text-sm font-medium">{fileDetail.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Formato</p>
                    <p className="text-sm">{getMessageTypeBadge(fileDetail.messageTypeName)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Status</p>
                    <p className="text-sm">{getStatusBadge(fileDetail.statusName)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Processado em</p>
                    <p className="text-sm font-medium">
                      {fileDetail.processedAt
                        ? new Date(fileDetail.processedAt).toLocaleString("pt-BR")
                        : "—"}
                    </p>
                  </div>
                </div>

                {fileDetail.errorMessage && (
                  <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {fileDetail.errorMessage}
                  </div>
                )}

                {/* Items Table */}
                <div className="p-5">
                  <h4 className="font-medium text-slate-800 mb-3">
                    Itens ({fileDetail.items.length})
                  </h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium text-slate-600">Referência</th>
                          <th className="text-left px-3 py-2 font-medium text-slate-600">Descrição</th>
                          <th className="text-right px-3 py-2 font-medium text-slate-600">Qtd</th>
                          <th className="text-left px-3 py-2 font-medium text-slate-600">Entrega</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fileDetail.items.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                              Nenhum item processado
                            </td>
                          </tr>
                        ) : (
                          fileDetail.items.map((item) => (
                            <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="px-3 py-2">
                                {item.productReference ? (
                                  <span className="font-mono font-medium text-emerald-600">{item.productReference}</span>
                                ) : (
                                  <span className="font-mono text-slate-800">{item.itemCode}</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-slate-600 max-w-[250px] truncate">
                                {item.description || "—"}
                              </td>
                              <td className="px-3 py-2 text-right font-mono font-medium">
                                {item.quantity.toLocaleString("pt-BR")}
                              </td>
                              <td className="px-3 py-2 text-slate-500">
                                {item.deliveryStart
                                  ? new Date(item.deliveryStart).toLocaleDateString("pt-BR")
                                  : "—"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
