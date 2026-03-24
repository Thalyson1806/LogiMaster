"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EdiClient, EdiConversion } from "@/lib/types";
import { ediClientService, ediConversionService } from "@/lib/services";
import {
  FileSpreadsheet,
  ArrowRight,
  Upload,
  History,
  Package,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap
} from "lucide-react";

export default function EdiPage() {
  const [clients, setClients] = useState<EdiClient[]>([]);
  const [recentConversions, setRecentConversions] = useState<EdiConversion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [clientsRes, conversionsRes] = await Promise.allSettled([
        ediClientService.getAll(),
        ediConversionService.getAll(),
      ]);
      if (clientsRes.status === "fulfilled") setClients(clientsRes.value);
      if (conversionsRes.status === "fulfilled") setRecentConversions(conversionsRes.value.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "Completed":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "CompletedWithWarnings":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "Error":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
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
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">EDI Converter</h1>
            <p className="text-sm text-slate-500">Conversão de planilhas EDI</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Link
          href="/logistica/edi/convert"
          className="bg-white border border-slate-200 p-4 rounded-xl hover:border-teal-300 hover:bg-teal-50 transition-colors flex items-center gap-3"
        >
          <Upload className="w-8 h-8" />
          <div>
            <p className="font-semibold">Nova Conversão</p>
            <p className="text-sm text-teal-100">Converter planilha EDI</p>
          </div>
          <ArrowRight className="w-5 h-5 ml-auto" />
        </Link>

        <Link
          href="/logistica/edi/history"
          className="bg-white border border-slate-200 p-4 rounded-xl hover:border-teal-300 hover:bg-teal-50 transition-colors flex items-center gap-3"
        >
          <History className="w-8 h-8 text-slate-600" />
          <div>
            <p className="font-semibold text-slate-800">Histórico</p>
            <p className="text-sm text-slate-500">Ver conversões anteriores</p>
          </div>
          <ArrowRight className="w-5 h-5 ml-auto text-slate-400" />
        </Link>

        <Link
          href="/logistica/edi/products"
          className="bg-white border border-slate-200 p-4 rounded-xl hover:border-teal-300 hover:bg-teal-50 transition-colors flex items-center gap-3"
        >
          <Package className="w-8 h-8 text-slate-600" />
          <div>
            <p className="font-semibold text-slate-800">Produtos EDI</p>
            <p className="text-sm text-slate-500">Gerenciar produtos</p>
          </div>
          <ArrowRight className="w-5 h-5 ml-auto text-slate-400" />
        </Link>
      </div>
              <Link
          href="/logistica/edi/import"
          className="bg-teal-50 border border-teal-200 p-4 rounded-xl hover:border-teal-400 hover:bg-teal-100 transition-colors flex items-center gap-3"
        >
          <Zap className="w-8 h-8 text-teal-600" />
          <div>
            <p className="font-semibold text-teal-800">EDI Automático</p>
            <p className="text-sm text-teal-600">DELFOR, DELJIT, RND</p>
          </div>
          <ArrowRight className="w-5 h-5 ml-auto text-teal-400" />
        </Link>


      {/* Clients */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-slate-800 mb-4">Clientes Configurados</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {clients.map((client) => (
            <div
              key={client.id}
              className="border border-slate-200 rounded-lg p-3 hover:border-teal-300 transition-colors"
            >
              <p className="font-mono text-sm font-semibold text-teal-600">{client.code}</p>
              <p className="text-xs text-slate-500 truncate">{client.name}</p>
             <p className="text-[10px] text-slate-400 mt-1">{client.fileType?.toUpperCase() || "XLSX"}</p>

            </div>
          ))}
          {clients.length === 0 && (
            <p className="text-slate-500 text-sm col-span-4">Nenhum cliente configurado</p>
          )}
        </div>
      </div>

      {/* Recent Conversions */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-semibold text-slate-800">Conversões Recentes</h2>
          <Link href="/logistica/edi/history" className="text-sm text-teal-600 hover:underline">
            Ver todas
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Código</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Cliente</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Arquivo</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Data</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentConversions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Nenhuma conversão realizada ainda
                </td>
              </tr>
            ) : (
              recentConversions.map((conv) => (
                <tr key={conv.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                      {conv.code}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-teal-600">{conv.clientCode}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{conv.inputFileName}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(conv.convertedAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(conv.status)}
                      <span className="text-xs">{getStatusText(conv.status)}</span>
                    </div>
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

