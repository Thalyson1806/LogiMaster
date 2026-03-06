"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EdiClient, EdiRoute, EdiConversionResult } from "@/lib/types";
import { ediClientService, ediRouteService, ediConversionService } from "@/lib/services";
import {
  FileSpreadsheet,
  ArrowLeft,
  Upload,
  CheckCircle,
  AlertTriangle,
  Download,
  RefreshCw,
} from "lucide-react";

export default function EdiConvertPage() {
  const [clients, setClients] = useState<EdiClient[]>([]);
  const [routes, setRoutes] = useState<EdiRoute[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [result, setResult] = useState<EdiConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      loadRoutes(selectedClientId);
    } else {
      setRoutes([]);
      setSelectedRouteId(null);
    }
  }, [selectedClientId]);

  async function loadClients() {
    try {
      setLoading(true);
      const data = await ediClientService.getAll();
      setClients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadRoutes(clientId: number) {
    try {
      const data = await ediRouteService.getByClientId(clientId);
      setRoutes(data);
      const defaultRoute = data.find((r) => r.isDefault);
      if (defaultRoute) {
        setSelectedRouteId(defaultRoute.id);
      } else if (data.length > 0) {
        setSelectedRouteId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  }

  async function handleConvert() {
    if (!file || !selectedClientId || !selectedRouteId) return;

    try {
      setConverting(true);
      setError(null);
      const conversionResult = await ediConversionService.convert(
        file,
        selectedClientId,
        selectedRouteId,
        startDate || undefined,
        endDate || undefined
      );
      setResult(conversionResult);
    } catch (err: any) {
      setError(err.message || "Erro na conversão");
    } finally {
      setConverting(false);
    }
  }

  function handleDownload() {
    if (!result) return;
    
    const blob = new Blob([result.outputContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.conversion.outputFileName || "edi_output.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleReset() {
    setFile(null);
    setResult(null);
    setError(null);
    setStartDate("");
    setEndDate("");
  }

  const selectedClient = clients.find((c) => c.id === selectedClientId);

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
            <FileSpreadsheet className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Nova Conversão</h1>
            <p className="text-sm text-slate-500">Converter planilha EDI</p>
          </div>
        </div>
      </div>

      {!result ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          {/* Client Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cliente EDI *
            </label>
            <select
              value={selectedClientId || ""}
              onChange={(e) => setSelectedClientId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">Selecione um cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.code} - {client.name}
                </option>
              ))}
            </select>
          </div>

          {/* Route Selection */}
          {selectedClientId && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Roteiro de Entrega *
              </label>
              <select
                value={selectedRouteId || ""}
                onChange={(e) => setSelectedRouteId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">Selecione um roteiro</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.name} {route.isDefault && "(Padrão)"}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Range */}
          {selectedClientId && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Data Início (opcional)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Data Fim (opcional)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* File Upload */}
          {selectedClientId && selectedRouteId && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Arquivo {selectedClient?.fileType.toUpperCase()} *
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-teal-400 transition-colors">
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileSpreadsheet className="w-8 h-8 text-teal-600" />
                    <div className="text-left">
                      <p className="font-medium text-slate-800">{file.name}</p>
                      <p className="text-sm text-slate-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => setFile(null)}
                      className="ml-4 text-sm text-red-600 hover:underline"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-600">
                      Clique para selecionar ou arraste o arquivo
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      {selectedClient?.fileType === "xlsx" ? "Excel (.xlsx, .xls)" : "Texto (.txt)"}
                    </p>
                    <input
                      type="file"
                      accept={selectedClient?.fileType === "xlsx" ? ".xlsx,.xls" : ".txt"}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Erro na conversão</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Convert Button */}
          <button
            onClick={handleConvert}
            disabled={!file || !selectedClientId || !selectedRouteId || converting}
            className="w-full bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {converting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Convertendo...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-5 h-5" />
                Converter
              </>
            )}
          </button>
        </div>
      ) : (
        /* Result */
        <div className="space-y-4">
          {/* Success Card */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-emerald-800">
                  Conversão realizada com sucesso!
                </h2>
                <p className="text-sm text-emerald-600 mt-1">
                  Código: {result.conversion.code}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600">
                  {result.conversion.totalProductsProcessed}
                </p>
                <p className="text-xs text-slate-500">Produtos processados</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600">
                  {result.conversion.totalLinesGenerated}
                </p>
                <p className="text-xs text-slate-500">Linhas geradas</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <p className={`text-2xl font-bold ${result.conversion.productsNotFound > 0 ? "text-amber-500" : "text-emerald-600"}`}>
                  {result.conversion.productsNotFound}
                </p>
                <p className="text-xs text-slate-500">Não encontrados</p>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {result.productsNotFound.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <p className="font-medium text-amber-800">Produtos não encontrados</p>
              </div>
              <div className="max-h-32 overflow-y-auto">
                <ul className="text-sm text-amber-700 space-y-1">
                  {result.productsNotFound.map((p, i) => (
                    <li key={i} className="font-mono text-xs bg-amber-100 px-2 py-1 rounded">
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Baixar Arquivo
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Nova Conversão
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

