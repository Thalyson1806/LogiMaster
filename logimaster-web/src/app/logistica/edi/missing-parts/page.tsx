"use client";
import React, { useEffect, useState } from "react";
import { MissingPart, MissingPartsSummary, ProjectedBalancePoint } from "@/lib/types";
import { missingPartsService } from "@/lib/services";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Search,
  TrendingDown,
} from "lucide-react";

const REASON_LABELS: Record<string, string> = {
  SEM_ESTOQUE: "Sem estoque",
  DEMANDA_EXCEDE_ESTOQUE: "Demanda excede estoque",
  ESTOQUE_INSUFICIENTE: "Estoque insuficiente",
};

export default function MissingPartsPage() {
  const [summary, setSummary] = useState<MissingPartsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState<"all" | "Critical" | "Warning" | "OK">("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const data = await missingPartsService.getAll();
      setSummary(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = summary?.items.filter((item) => {
    const matchSearch =
      !search ||
      item.productReference.toLowerCase().includes(search.toLowerCase()) ||
      item.productDescription.toLowerCase().includes(search.toLowerCase());
    const matchRisk = filterRisk === "all" || item.riskLevel === filterRisk;
    return matchSearch && matchRisk;
  }) ?? [];

  function getRiskBadge(level: string) {
    switch (level) {
      case "Critical":
        return (
          <span className="flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
            <XCircle className="w-3 h-3" /> Crítico
          </span>
        );
      case "Warning":
        return (
          <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" /> Atenção
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            <CheckCircle className="w-3 h-3" /> OK
          </span>
        );
    }
  }

  function getBalanceColor(balance: number) {
    if (balance < 0) return "text-red-600 font-bold";
    if (balance === 0) return "text-amber-600 font-bold";
    return "text-emerald-600";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
          <span>Calculando projeções...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Missing Parts</h1>
            <p className="text-sm text-slate-500">Previsão de falta de material</p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-slate-800">{summary?.totalProducts ?? 0}</p>
          <p className="text-sm text-slate-500">Part Numbers monitorados</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-red-600">{summary?.criticalCount ?? 0}</p>
          <p className="text-sm text-red-500">Críticos (&lt; 7 dias)</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-amber-600">{summary?.warningCount ?? 0}</p>
          <p className="text-sm text-amber-500">Atenção (7–30 dias)</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-emerald-600">{summary?.okCount ?? 0}</p>
          <p className="text-sm text-emerald-500">OK (sem falta prevista)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por referência ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg"
          />
        </div>
        {(["all", "Critical", "Warning", "OK"] as const).map((level) => (
          <button
            key={level}
            onClick={() => setFilterRisk(level)}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
              filterRisk === level
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
            }`}
          >
            {level === "all" ? "Todos" : level === "Critical" ? "Crítico" : level === "Warning" ? "Atenção" : "OK"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="w-8 px-4 py-3" />
              <th className="text-left px-4 py-3 font-medium text-slate-600">Referência</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Estoque Atual</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Demanda Total</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Saldo Projetado</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Data da Falta</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Motivo</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Risco</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-300" />
                  <p className="font-medium">Nenhum item encontrado</p>
                  <p className="text-sm">Sem faltas previstas para os filtros selecionados</p>
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <React.Fragment key={item.productId}>
                  <tr
                    className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${
                      item.riskLevel === "Critical" ? "bg-red-50/30" : ""
                    }`}
                    onClick={() => setExpanded(expanded === item.productId ? null : item.productId)}
                  >
                    <td className="px-4 py-3 text-slate-400">
                      {expanded === item.productId ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono font-semibold text-slate-800">{item.productReference}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[220px]">{item.productDescription}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{item.currentStock.toLocaleString("pt-BR")}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{item.totalDemand.toLocaleString("pt-BR")}</td>
                    <td className={`px-4 py-3 text-right font-mono ${getBalanceColor(item.projectedBalance)}`}>
                      {item.projectedBalance.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.shortageDate
                        ? new Date(item.shortageDate).toLocaleDateString("pt-BR")
                        : <span className="text-emerald-500">—</span>}
                      {item.shortageDate && (
                        <span className="text-xs text-slate-400 ml-1">
                          ({item.daysUntilShortage}d)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {item.missingReason ? REASON_LABELS[item.missingReason] ?? item.missingReason : "—"}
                    </td>
                    <td className="px-4 py-3">{getRiskBadge(item.riskLevel)}</td>
                  </tr>

                  {/* Timeline expandida */}
                  {expanded === item.productId && (
                    <tr key={`timeline-${item.productId}`} className="border-b border-slate-200 bg-slate-50">
                      <td colSpan={8} className="px-8 py-4">
                        <p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide">
                          Projeção de saldo por data
                        </p>
                        <div className="overflow-x-auto">
                          <table className="text-xs w-full">
                            <thead>
                              <tr className="text-slate-400">
                                <th className="text-left pb-1 pr-6">Data</th>
                                <th className="text-right pb-1 pr-6">Demanda</th>
                                <th className="text-right pb-1 pr-6">Demanda Acumulada</th>
                                <th className="text-right pb-1">Saldo Projetado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {item.timeline.map((point, idx) => (
                                <tr key={idx} className={point.projectedBalance < 0 ? "text-red-600" : "text-slate-600"}>
                                  <td className="pr-6 py-0.5 font-medium">
                                    {new Date(point.date).toLocaleDateString("pt-BR")}
                                  </td>
                                  <td className="pr-6 py-0.5 text-right font-mono">
                                    {point.demandQty.toLocaleString("pt-BR")}
                                  </td>
                                  <td className="pr-6 py-0.5 text-right font-mono">
                                    {point.cumulativeDemand.toLocaleString("pt-BR")}
                                  </td>
                                  <td className={`py-0.5 text-right font-mono font-semibold ${point.projectedBalance < 0 ? "text-red-600" : "text-emerald-600"}`}>
                                    {point.projectedBalance.toLocaleString("pt-BR")}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
