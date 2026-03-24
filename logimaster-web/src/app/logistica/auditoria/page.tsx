"use client";

import { useEffect, useState } from "react";
import { auditService } from "@/lib/services";
import type { AuditLog } from "@/lib/types";

const ACTION_LABELS: Record<string, string> = {
  Login: "Login",
  CreateUser: "Criar usuário",
  UpdateUser: "Editar usuário",
  DeleteUser: "Excluir usuário",
  UpdatePermissions: "Alterar permissões",
  RegisterMovement: "Movimentação de estoque",
  DeleteMovement: "Excluir movimentação",
  DeleteBillingRequest: "Excluir solicitação",
  ImportBillingRequest: "Importar faturamento",
};

const ACTION_COLOR: Record<string, string> = {
  Login: "bg-blue-100 text-blue-700",
  DeleteMovement: "bg-red-100 text-red-700",
  DeleteBillingRequest: "bg-red-100 text-red-700",
  DeleteUser: "bg-red-100 text-red-700",
  RegisterMovement: "bg-green-100 text-green-700",
  ImportBillingRequest: "bg-purple-100 text-purple-700",
  UpdatePermissions: "bg-yellow-100 text-yellow-700",
};

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [filterAction, setFilterAction] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  async function load(p = 1) {
    setLoading(true);
    try {
      const res = await auditService.getLogs({
        action: filterAction || undefined,
        from: filterFrom || undefined,
        to: filterTo || undefined,
        page: p,
        pageSize,
      });
      setLogs(res.items);
      setTotal(res.total);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Log de Auditoria</h1>
      <p className="text-sm text-slate-500 mb-6">Registro de todas as ações realizadas no sistema.</p>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Filtrar por ação..."
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-48"
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">De</span>
          <input
            type="datetime-local"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Até</span>
          <input
            type="datetime-local"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={() => load(1)}
          className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700"
        >
          Filtrar
        </button>
        <button
          onClick={() => { setFilterAction(""); setFilterFrom(""); setFilterTo(""); setTimeout(() => load(1), 0); }}
          className="border border-slate-300 text-slate-600 px-4 py-2 rounded-lg text-sm hover:bg-slate-50"
        >
          Limpar
        </button>
      </div>

      <div className="text-xs text-slate-400 mb-3">{total} registro(s) encontrado(s)</div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Carregando...</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">Nenhum registro encontrado.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Data/Hora</th>
                <th className="px-4 py-3 text-left">Usuário</th>
                <th className="px-4 py-3 text-left">Ação</th>
                <th className="px-4 py-3 text-left">Entidade</th>
                <th className="px-4 py-3 text-left">Detalhes</th>
                <th className="px-4 py-3 text-left">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                    {new Date(log.createdAt).toLocaleString("pt-BR", {
                      day: "2-digit", month: "2-digit", year: "2-digit",
                      hour: "2-digit", minute: "2-digit", second: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-700">{log.userName ?? "—"}</div>
                    {log.userId && <div className="text-xs text-slate-400">ID {log.userId}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLOR[log.action] ?? "bg-slate-100 text-slate-600"}`}>
                      {ACTION_LABELS[log.action] ?? log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {log.entityType ? `${log.entityType}${log.entityId ? ` #${log.entityId}` : ""}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">
                    {log.details || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{log.ipAddress || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => load(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 text-sm border border-slate-300 rounded-lg disabled:opacity-40"
          >
            ←
          </button>
          <span className="px-3 py-1 text-sm text-slate-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => load(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1 text-sm border border-slate-300 rounded-lg disabled:opacity-40"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
