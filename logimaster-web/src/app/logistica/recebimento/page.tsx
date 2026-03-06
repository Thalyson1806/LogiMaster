"use client";

import { useEffect, useState } from "react";
import { stockService, productService } from "@/lib/services";
import type { StockSummary, StockMovement, CreateStockMovement, ProductInput } from "@/lib/types";
import {
  FlaskConical, Plus, Search, X, ArrowDownToLine,
  ArrowUpFromLine, SlidersHorizontal, History, Package,
} from "lucide-react";

type Tab = "estoque" | "historico";

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

export default function RecebimentoPage() {
  const [tab, setTab] = useState<Tab>("estoque");
  const [items, setItems] = useState<StockSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Painel direito — produto selecionado
  const [selected, setSelected] = useState<StockSummary | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingMovs, setLoadingMovs] = useState(false);

  // Formulário de movimento
  const [movForm, setMovForm] = useState<CreateStockMovement>({
    productId: 0,
    type: "Entry",
    quantity: 0,
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Modal novo produto MP
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState<ProductInput>({
    reference: "",
    description: "",
    unitsPerBox: 1,
    unitPrice: 0,
    productType: "RawMaterial",
  });
  const [savingNew, setSavingNew] = useState(false);

  useEffect(() => {
    loadStock();
  }, []);

  async function loadStock() {
    setLoading(true);
    try {
      const res = await stockService.getSummary("RawMaterial");
      setItems(res.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function selectItem(item: StockSummary) {
    setSelected(item);
    setMovForm({ productId: item.productId, type: "Entry", quantity: 0, notes: "" });
    setSuccessMsg("");
    setLoadingMovs(true);
    try {
      const movs = await stockService.getMovements(item.productId);
      setMovements(movs);
    } finally {
      setLoadingMovs(false);
    }
  }

  async function handleMovimento(e: React.FormEvent) {
    e.preventDefault();
    if (!movForm.quantity || movForm.quantity === 0) return;
    setSaving(true);
    try {
      await stockService.registerMovement(movForm);
      const [movs, res] = await Promise.all([
        stockService.getMovements(movForm.productId),
        stockService.getSummary("RawMaterial"),
      ]);
      setMovements(movs);
      setItems(res.items);
      const updated = res.items.find((i) => i.productId === movForm.productId);
      if (updated) setSelected(updated);
      setMovForm((f) => ({ ...f, quantity: 0, notes: "" }));
      setSuccessMsg(movForm.type === "Entry" ? "Entrada registrada!" : "Saída registrada!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function handleNovoMP(e: React.FormEvent) {
    e.preventDefault();
    setSavingNew(true);
    try {
      await productService.create({ ...newForm, productType: "RawMaterial" });
      setShowNewModal(false);
      setNewForm({ reference: "", description: "", unitsPerBox: 1, unitPrice: 0, productType: "RawMaterial" });
      await loadStock();
    } finally {
      setSavingNew(false);
    }
  }

  const filtered = items.filter(
    (i) =>
      i.productReference.toLowerCase().includes(search.toLowerCase()) ||
      i.productDescription.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex gap-6 h-full">
      {/* ── Painel esquerdo: lista de MPS ── */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-4">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Recebimento MP</h1>
              <p className="text-xs text-slate-500">{items.length} matérias-primas</p>
            </div>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova MP
          </button>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar referência ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {loading ? (
            <div className="text-center py-10 text-slate-400 text-sm">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <Package className="w-12 h-12 text-slate-300" />
              <p className="text-slate-500 text-sm font-medium">Nenhuma matéria-prima encontrada</p>
              <p className="text-xs text-slate-400">Cadastre uma nova MP para começar</p>
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.productId}
                onClick={() => selectItem(item)}
                className={`w-full text-left px-3 py-3 rounded-xl border transition-all ${
                  selected?.productId === item.productId
                    ? "bg-emerald-50 border-emerald-300 shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-emerald-700">
                    {item.productReference}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      item.currentStock > 0 ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {item.currentStock.toLocaleString("pt-BR")}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">{item.productDescription}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Painel direito: operações ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center text-slate-400">
            <FlaskConical className="w-16 h-16 text-slate-200" />
            <p className="font-medium text-slate-500">Selecione uma matéria-prima</p>
            <p className="text-sm">O histórico e os controles de movimentação aparecerão aqui</p>
          </div>
        ) : (
          <>
            {/* Header do produto selecionado */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-sm font-bold text-emerald-700">
                    {selected.productReference}
                  </span>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                    Matéria Prima
                  </span>
                </div>
                <p className="text-sm text-slate-600">{selected.productDescription}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 mb-0.5">Estoque atual</p>
                <p
                  className={`text-2xl font-bold ${
                    selected.currentStock > 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {selected.currentStock.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>

            {/* Abas */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-4">
              <button
                onClick={() => setTab("estoque")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  tab === "estoque"
                    ? "bg-white shadow text-emerald-700"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Movimentar
              </button>
              <button
                onClick={() => setTab("historico")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  tab === "historico"
                    ? "bg-white shadow text-emerald-700"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <History className="w-4 h-4" />
                Histórico
                {movements.length > 0 && (
                  <span className="bg-slate-400 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {movements.length}
                  </span>
                )}
              </button>
            </div>

            {/* ABA: MOVIMENTAR */}
            {tab === "estoque" && (
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <form onSubmit={handleMovimento} className="space-y-4">
                  {/* Tipo */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">
                      Tipo de Movimento
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["Entry", "Exit", "Adjustment"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setMovForm((f) => ({ ...f, type: t }))}
                          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                            movForm.type === t
                              ? t === "Entry"
                                ? "bg-green-600 text-white border-green-600"
                                : t === "Exit"
                                ? "bg-red-500 text-white border-red-500"
                                : "bg-yellow-500 text-white border-yellow-500"
                              : "border-slate-300 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {t === "Entry" ? (
                            <ArrowDownToLine className="w-4 h-4" />
                          ) : t === "Exit" ? (
                            <ArrowUpFromLine className="w-4 h-4" />
                          ) : (
                            <SlidersHorizontal className="w-4 h-4" />
                          )}
                          {typeLabel[t]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantidade */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={movForm.quantity || ""}
                      onChange={(e) =>
                        setMovForm((f) => ({ ...f, quantity: Number(e.target.value) }))
                      }
                      placeholder="0"
                      required
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Observação */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Observação
                    </label>
                    <input
                      type="text"
                      value={movForm.notes || ""}
                      onChange={(e) => setMovForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder={
                        movForm.type === "Entry" ? "Ex: NF 12345, Fornecedor XYZ" : "Opcional"
                      }
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {successMsg && (
                    <p className="text-green-600 text-sm font-medium">{successMsg}</p>
                  )}

                  <button
                    type="submit"
                    disabled={saving || !movForm.quantity}
                    className="w-full bg-emerald-600 text-white py-2.5 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                  >
                    {saving ? (
                      "Salvando..."
                    ) : movForm.type === "Entry" ? (
                      <>
                        <ArrowDownToLine className="w-4 h-4" />
                        Registrar Entrada
                      </>
                    ) : movForm.type === "Exit" ? (
                      <>
                        <ArrowUpFromLine className="w-4 h-4" />
                        Registrar Saída
                      </>
                    ) : (
                      <>
                        <SlidersHorizontal className="w-4 h-4" />
                        Ajustar Estoque
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ABA: HISTÓRICO */}
            {tab === "historico" && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex-1">
                {loadingMovs ? (
                  <div className="text-center py-10 text-slate-400 text-sm">Carregando...</div>
                ) : movements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                    <History className="w-10 h-10 text-slate-200" />
                    <p className="text-slate-400 text-sm">Nenhum movimento registrado</p>
                  </div>
                ) : (
                  <div className="overflow-y-auto max-h-[500px]">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left">Data</th>
                          <th className="px-4 py-3 text-left">Tipo</th>
                          <th className="px-4 py-3 text-right">Qtd</th>
                          <th className="px-4 py-3 text-left">Observação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {movements.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 text-slate-500 text-xs whitespace-nowrap">
                              {new Date(m.createdAt).toLocaleString("pt-BR")}
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  typeBadge[m.type] ?? "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {typeLabel[m.type] ?? m.type}
                              </span>
                            </td>
                            <td
                              className={`px-4 py-2.5 text-right font-semibold ${
                                m.quantity > 0 ? "text-green-600" : "text-red-500"
                              }`}
                            >
                              {m.quantity > 0 ? "+" : ""}
                              {m.quantity.toLocaleString("pt-BR")}
                            </td>
                            <td className="px-4 py-2.5 text-slate-500 text-xs">
                              {m.notes ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal: Nova Matéria Prima ── */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <FlaskConical className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="font-semibold text-slate-800">Nova Matéria Prima</h2>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleNovoMP} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Referência *
                </label>
                <input
                  type="text"
                  value={newForm.reference}
                  onChange={(e) => setNewForm({ ...newForm, reference: e.target.value })}
                  placeholder="Ex: MP-001"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Descrição *
                </label>
                <input
                  type="text"
                  value={newForm.description}
                  onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                  placeholder="Ex: Aço SAE 1020 Ø25mm"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Un/Caixa
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newForm.unitsPerBox}
                    onChange={(e) =>
                      setNewForm({ ...newForm, unitsPerBox: parseInt(e.target.value) || 1 })
                    }
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Preço Unit.
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newForm.unitPrice || ""}
                    onChange={(e) =>
                      setNewForm({ ...newForm, unitPrice: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0,00"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingNew || !newForm.reference || !newForm.description}
                  className="bg-emerald-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {savingNew ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Cadastrar MP"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
