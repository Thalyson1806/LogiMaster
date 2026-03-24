"use client";

import { useEffect, useState } from "react";
import { stockService } from "@/lib/services";
import type { StockSummary, StockMovement, CreateStockMovement } from "@/lib/types";

type Tab = "summary" | "movement";

export default function EstoquePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [tab, setTab] = useState<Tab>("summary");
  const [items, setItems] = useState<StockSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // movimento
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<StockSummary | null>(null);
  const [form, setForm] = useState<CreateStockMovement>({
    productId: 0,
    type: "Entry",
    quantity: 0,
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [displayQuantity, setDisplayQuantity] = useState("");

  useEffect(() => {
    stockService.getSummary().then((res) => {
      setItems(res.items);
      setLoading(false);
    });
  }, []);

  // filtro
  const filtered = items.filter(
    (i) =>
      i.productReference.toLowerCase().includes(search.toLowerCase()) ||
      i.productDescription.toLowerCase().includes(search.toLowerCase())
  );

  // paginação
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);

  // resetar página ao pesquisar
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  async function openMovements(item: StockSummary) {
    setSelectedProduct(item);
    setForm({ productId: item.productId, type: "Entry", quantity: 0, notes: "" });
    setDisplayQuantity("");

    const movs = await stockService.getMovements(item.productId);
    setMovements(movs);

    setTab("movement");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.quantity === 0) return;

    setSaving(true);

    await stockService.registerMovement(form);

    const movs = await stockService.getMovements(form.productId);
    setMovements(movs);

    const res = await stockService.getSummary();
    setItems(res.items);

    setSelectedProduct(res.items.find((i) => i.productId === form.productId) ?? null);

    setForm((f) => ({ ...f, quantity: 0, notes: "" }));
    setDisplayQuantity("");

    setSuccessMsg("Movimento registrado!");
    setTimeout(() => setSuccessMsg(""), 3000);

    setSaving(false);
  }

  async function handleDeleteMovement(id: number) {
    if (!confirm("Excluir este movimento? O estoque será recalculado.")) return;
    await stockService.deleteMovement(id);
    const movs = await stockService.getMovements(form.productId);
    setMovements(movs);
    const res = await stockService.getSummary();
    setItems(res.items);
    setSelectedProduct(res.items.find((i) => i.productId === form.productId) ?? null);
  }

  const typeLabel: Record<string, string> = {
    Entry: "Entrada",
    Exit: "Saída",
    Adjustment: "Ajuste",
    Dispatch: "Expedição",
  };

  const typeBadge: Record<string, string> = {
    Entry: "bg-green-100 text-green-700",
    Exit: "bg-red-100 text-red-700",
    Adjustment: "bg-yellow-100 text-yellow-700",
    Dispatch: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Gestão de Estoque</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200">
        <button
          onClick={() => setTab("summary")}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            tab === "summary"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500"
          }`}
        >
          Posição de Estoque
        </button>

        {selectedProduct && (
          <button
            onClick={() => setTab("movement")}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              tab === "movement"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500"
            }`}
          >
            Movimentos — {selectedProduct.productReference}
          </button>
        )}
      </div>

      {/* TAB: POSIÇÃO */}
      {tab === "summary" && (
        <>
          <input
            type="text"
            placeholder="Buscar por referência ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full mb-4 px-4 py-2 border border-slate-300 rounded-lg text-sm"
          />

          {loading ? (
            <p className="text-slate-500 text-sm">Carregando...</p>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Referência</th>
                      <th className="px-4 py-3 text-left">Descrição</th>
                      <th className="px-4 py-3 text-right">Estoque Atual</th>
                      <th className="px-4 py-3 text-center">Ações</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {currentItems.map((item) => (
                      <tr key={item.productId} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono font-medium">
                          {item.productReference}
                        </td>

                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                          {item.productDescription}
                        </td>

                        <td
                          className={`px-4 py-3 text-right font-semibold ${
                            item.currentStock > 0
                              ? "text-green-600"
                              : "text-red-500"
                          }`}
                        >
                          {item.currentStock.toLocaleString("pt-BR")}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => openMovements(item)}
                            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                          >
                            Movimentar
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-slate-400">
                          Nenhum produto encontrado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINAÇÃO */}
              <div className="flex justify-center items-center gap-2 mt-4">

                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-3 py-1 border rounded disabled:opacity-40"
                >
                  Anterior
                </button>

                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 border rounded ${
                      currentPage === i + 1
                        ? "bg-blue-600 text-white"
                        : "bg-white"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-3 py-1 border rounded disabled:opacity-40"
                >
                  Próximo
                </button>

              </div>
            </>
          )}
        </>
      )}

      {/* TAB MOVIMENTO */}
      {tab === "movement" && selectedProduct && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário de movimento */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">
                Registrar Movimento
              </h2>

              <div className="mb-4 p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
                <div className="font-semibold text-slate-800">{selectedProduct.productReference}</div>
                <div className="mt-0.5">{selectedProduct.productDescription}</div>
                <div className="mt-2 text-base font-bold text-blue-600">
                  Estoque atual: {selectedProduct.currentStock.toLocaleString("pt-BR")}
                </div>
              </div>

              {successMsg && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg">
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Tipo
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="Entry">Entrada</option>
                    <option value="Exit">Saída</option>
                    <option value="Adjustment">Ajuste</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Quantidade
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={displayQuantity}
                    onChange={(e) => {
                      // permite dígitos e uma vírgula (separador decimal pt-BR)
                      let raw = e.target.value.replace(/[^\d,]/g, "");
                      const firstComma = raw.indexOf(",");
                      if (firstComma !== -1) {
                        raw = raw.slice(0, firstComma + 1) + raw.slice(firstComma + 1).replace(/,/g, "");
                      }
                      const num = raw === "" || raw === "," ? 0 : parseFloat(raw.replace(",", "."));
                      setDisplayQuantity(raw);
                      setForm((f) => ({ ...f, quantity: isNaN(num) ? 0 : num }));
                    }}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="0,00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Observação
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none"
                    rows={3}
                    placeholder="Opcional..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving || form.quantity === 0}
                  className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Registrar"}
                </button>
              </form>
            </div>
          </div>

          {/* Histórico de movimentos */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-700">Histórico de Movimentos</h2>
              </div>

              {movements.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  Nenhum movimento registrado
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Data</th>
                      <th className="px-4 py-3 text-left">Tipo</th>
                      <th className="px-4 py-3 text-right">Qtd</th>
                      <th className="px-4 py-3 text-left">Por</th>
                      <th className="px-4 py-3 text-left">Observação</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {movements.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {new Date(m.createdAt).toLocaleString("pt-BR", {
                            day: "2-digit", month: "2-digit", year: "2-digit",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeBadge[m.type] ?? "bg-slate-100 text-slate-600"}`}>
                            {typeLabel[m.type] ?? m.type}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold ${
                          m.quantity > 0 ? "text-green-600" :
                          m.quantity < 0 ? "text-red-500" :
                          "text-yellow-600"
                        }`}>
                          {m.quantity > 0 ? "+" : ""}{m.quantity.toLocaleString("pt-BR")}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {m.createdByUserName ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                          {m.notes || "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteMovement(m.id)}
                            className="text-xs text-red-400 hover:text-red-600"
                            title="Excluir movimento"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}