"use client";

import { useEffect, useState } from "react";
import { EdifactFileSummary, EdifactFileDetail, Customer, EdifactDetectedCustomer } from "@/lib/types";
import { edifactService, customerService } from "@/lib/services";
import {
  FileText,
  Upload,
  Play,
  CheckCircle,
  AlertTriangle,
  Clock,
  XCircle,
  Eye,
  X,
  RefreshCw,
  Zap,
} from "lucide-react";

const MESSAGE_TYPES = [
  { value: 1, label: "DELFOR" },
  { value: 2, label: "DELJIT" },
  { value: 3, label: "RND" },
];

export default function EdifactPage() {
  const [files, setFiles] = useState<EdifactFileSummary[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<EdifactFileDetail | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCustomerId, setUploadCustomerId] = useState<number>(0);
  const [uploadMessageType, setUploadMessageType] = useState<number>(1);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [detectedCustomer, setDetectedCustomer] = useState<EdifactDetectedCustomer | null>(null);

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

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedUploadFile(file);
    setDetectedCustomer(null);

    // Auto-detectar cliente
    try {
      setDetecting(true);
      const detected = await edifactService.detectCustomer(file, uploadMessageType);
      if (detected) {
        setDetectedCustomer(detected);
        setUploadCustomerId(detected.customerId);
      }
    } catch {
      // silencioso — usuário seleciona manualmente
    } finally {
      setDetecting(false);
    }
  }

  async function handleUpload() {
    if (!selectedUploadFile || !uploadCustomerId) return;

    try {
      setUploading(true);
      await edifactService.upload(selectedUploadFile, uploadCustomerId, uploadMessageType);
      setShowUploadModal(false);
      setUploadCustomerId(0);
      setSelectedUploadFile(null);
      setDetectedCustomer(null);
      loadData();
    } catch (err: any) {
      alert(err.message || "Erro no upload");
    } finally {
      setUploading(false);
    }
  }

  function handleCloseUploadModal() {
    setShowUploadModal(false);
    setUploadCustomerId(0);
    setSelectedUploadFile(null);
    setDetectedCustomer(null);
  }

  async function handleProcess(id: number) {
    try {
      setProcessing(id);
      const result = await edifactService.process(id);
      if (result.errors.length > 0) {
        alert(`Processado com erros:\n${result.errors.join("\n")}`);
      }
      loadData();
    } catch (err: any) {
      alert(err.message || "Erro ao processar");
    } finally {
      setProcessing(null);
    }
  }

  async function handleViewDetails(id: number) {
    try {
      const detail = await edifactService.getById(id);
      setSelectedFile(detail);
    } catch (err) {
      console.error(err);
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
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "Completed": return "bg-emerald-100 text-emerald-700";
      case "PartialError": return "bg-amber-100 text-amber-700";
      case "Error": return "bg-red-100 text-red-700";
      case "Processing": return "bg-blue-100 text-blue-700";
      default: return "bg-slate-100 text-slate-700";
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">EDIFACT</h1>
            <p className="text-sm text-slate-500">Arquivos DELFOR recebidos</p>
          </div>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload EDIFACT
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-slate-800">{files.length}</p>
          <p className="text-sm text-slate-500">Total de Arquivos</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-emerald-600">
            {files.filter(f => f.statusName === "Completed").length}
          </p>
          <p className="text-sm text-slate-500">Processados</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-amber-600">
            {files.filter(f => f.statusName === "Pending").length}
          </p>
          <p className="text-sm text-slate-500">Pendentes</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-red-600">
            {files.filter(f => f.statusName === "Error").length}
          </p>
          <p className="text-sm text-slate-500">Com Erro</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Arquivo</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Cliente</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Tipo</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Recebido</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Itens</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {files.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium">Nenhum arquivo EDIFACT</p>
                  <p className="text-sm">Faça upload de um arquivo para começar</p>
                </td>
              </tr>
            ) : (
              files.map((file) => (
                <tr key={file.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 truncate max-w-[200px]">
                      {file.originalFileName}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{file.customerName}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                      {file.messageTypeName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(file.receivedAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-emerald-600">{file.totalItemsProcessed}</span>
                    {file.totalItemsWithError > 0 && (
                      <span className="text-red-500 ml-1">/ {file.totalItemsWithError} err</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 w-fit ${getStatusColor(file.statusName)}`}>
                      {getStatusIcon(file.statusName)}
                      {file.statusName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleViewDetails(file.id)}
                      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {file.statusName === "Pending" && (
                      <button
                        onClick={() => handleProcess(file.id)}
                        disabled={processing === file.id}
                        className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-50"
                        title="Processar"
                      >
                        {processing === file.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                    )}
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
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Upload EDIFACT</h2>
              <button onClick={handleCloseUploadModal} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Formato *</label>
                <select
                  value={uploadMessageType}
                  onChange={(e) => { setUploadMessageType(Number(e.target.value)); setDetectedCustomer(null); }}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  {MESSAGE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Arquivo *</label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {detecting && (
                  <p className="text-xs text-indigo-500 mt-1 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Detectando cliente...
                  </p>
                )}
                {detectedCustomer && (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Detectado: <strong>{detectedCustomer.customerName}</strong>
                    <span className="text-slate-400">({detectedCustomer.detectedBy})</span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Cliente *
                  {detectedCustomer && <span className="ml-1 text-emerald-500">(auto-detectado)</span>}
                </label>
                <select
                  value={uploadCustomerId}
                  onChange={(e) => { setUploadCustomerId(Number(e.target.value)); setDetectedCustomer(null); }}
                  className={`w-full border rounded-lg px-3 py-2 text-sm ${detectedCustomer ? "border-emerald-400 ring-1 ring-emerald-300" : "border-slate-300"}`}
                >
                  <option value={0}>Selecione...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={handleCloseUploadModal} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedUploadFile || !uploadCustomerId || uploading}
                className="bg-indigo-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Enviando...</>
                ) : (
                  <><Upload className="w-4 h-4" /> Enviar</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-800">{selectedFile.originalFileName}</h2>
                <p className="text-sm text-slate-500">{selectedFile.customerName}</p>
              </div>
              <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-5 overflow-auto flex-1">
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Status</p>
                  <p className="font-semibold">{selectedFile.statusName}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Segmentos</p>
                  <p className="font-semibold">{selectedFile.totalSegments}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Itens OK</p>
                  <p className="font-semibold text-emerald-600">{selectedFile.totalItemsProcessed}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Erros</p>
                  <p className="font-semibold text-red-600">{selectedFile.totalItemsWithError}</p>
                </div>
              </div>

              {selectedFile.errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-700">{selectedFile.errorMessage}</p>
                </div>
              )}

              <h3 className="font-semibold text-slate-800 mb-2">Itens ({selectedFile.items.length})</h3>
              <table className="w-full text-xs">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left px-3 py-2">#</th>
                    <th className="text-left px-3 py-2">Código</th>
                    <th className="text-left px-3 py-2">Descrição</th>
                    <th className="text-right px-3 py-2">Qtd</th>
                    <th className="text-left px-3 py-2">Entrega</th>
                    <th className="text-left px-3 py-2">Produto</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedFile.items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-slate-400">{item.lineNumber}</td>
                      <td className="px-3 py-2 font-mono">{item.itemCode}</td>
                      <td className="px-3 py-2 truncate max-w-[200px]">{item.description || "-"}</td>
                      <td className="px-3 py-2 text-right font-semibold">{item.quantity}</td>
                      <td className="px-3 py-2">
                        {item.deliveryStart ? new Date(item.deliveryStart).toLocaleDateString("pt-BR") : "-"}
                      </td>
                      <td className="px-3 py-2">
                        {item.productReference ? (
                          <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-xs">
                            {item.productReference}
                          </span>
                        ) : (
                          <span className="text-slate-400">Não vinculado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
