"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EdiClient, EdiConversion } from "@/lib/types";
import { ediClientService, ediConversionService } from "@/lib/services";
import {
  History,
  ArrowLeft,
  Download,
  CheckCircle,
  AlertTriangle,
  Clock,
  XCircle,
  Filter,
} from "lucide-react";

export default function EdiHistoryPage() {
  const [clients, setClients] = useState<EdiClient[]>([]);
  const [conversions, setConversions] = useState<EdiConversion[]>([]);
  const [filteredConversions, setFilteredConversions] = useState<EdiConversion[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      setFilteredConversions(conversions.filter((c) => c.ediClientId === selectedClientId));
    } else {
      setFilteredConversions(conversions);
    }
  }, [selectedClientId, conversions]);

  async function loadData() {
    try {
      setLoading(true);
      const [clientsRes, conversionsRes] = await Promise.allSettled([
        ediClientService.getAll(),
        ediConversionService.getAll(),
      ]);
      if (clientsRes.status === "fulfilled") setClients(clientsRes.value);
      if (conversionsRes.status === "fulfilled") { setConversions(conversionsRes.value); setFilteredConversions(conversionsRes.value); }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(conversion: EdiConversion) {
    try {
      const blob = await ediConversionService.download(conversion.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = conversion.outputFileName || `edi_${conversion.code}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Erro ao baixar arquivo");
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "Completed":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "CompletedWithWarnings":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "Error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "Processing":
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case "Completed": return "Concluído";
      case "CompletedWithWarnings": return "Com avisos";
      case "Error": return "Erro";
      case "Processing": return "Processando";
      default: return "Pendente";
    }
  }

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case "Completed":
        return "bg-emerald-100 text-emerald-700";
      case "CompletedWithWarnings":
        return "bg-amber-100 text-amber-700";
      case "Error":
        return "bg-red-100 text-red-700";
      case "Processing":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
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
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/logistica/edi"
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
            <History className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Histórico de Conversões</h1>
            <p className="text-sm text-slate-500">{conversions.length} conversões realizadas</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-slate-400" />
          <select
            value={selectedClientId || ""}
            onChange={(e) => setSelectedClientId(e.target.value ? parseInt(e.target.value) : null)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="">Todos os clientes</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.code} - {client.name}
              </option>
            ))}
          </select>
          <span className="text-sm text-slate-500">
            {filteredConversions.length} resultado(s)
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Código</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Cliente</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Roteiro</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Arquivo</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Data</th>
              <th className="text-center px-4 py-3 font-medium text-slate-600">Produtos</th>
              <th className="text-center px-4 py-3 font-medium text-slate-600">Linhas</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredConversions.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                  <History className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium">Nenhuma conversão encontrada</p>
                  <p className="text-sm">Faça sua primeira conversão</p>
                </td>
              </tr>
            ) : (
              filteredConversions.map((conv) => (
                <tr key={conv.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                      {conv.code}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-teal-600">{conv.clientCode}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{conv.routeName}</td>
                  <td className="px-4 py-3">
                    <span className="text-slate-600 truncate max-w-[150px] block" title={conv.inputFileName}>
                      {conv.inputFileName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(conv.convertedAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-slate-700">{conv.totalProductsProcessed}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-slate-700">{conv.totalLinesGenerated}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(conv.status)}`}>
                      {getStatusIcon(conv.status)}
                      {getStatusText(conv.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {(conv.status === "Completed" || conv.status === "CompletedWithWarnings") && (
                      <button
                        onClick={() => handleDownload(conv)}
                        className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        title="Baixar arquivo"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

