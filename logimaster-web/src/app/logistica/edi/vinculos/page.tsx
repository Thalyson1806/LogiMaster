"use client";

import { useEffect, useState } from "react";
import { CustomerProduct, CustomerProductInput, Customer, Product } from "@/lib/types";
import { customerProductService, customerService, productService } from "@/lib/services";
import { Link2, Plus, Search, Trash2, X, Tag, Pencil, Check } from "lucide-react";

export default function CustomerProductLinksPage() {

  const [links, setLinks] = useState<CustomerProduct[]>([]);
  const [filtered, setFiltered] = useState<CustomerProduct[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState<CustomerProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState<CustomerProductInput>({
    customerId: 0,
    productId: 0,
    customerCode: "",
    notes: "",
  });
  // Inline edit state
  const [inlineEditId, setInlineEditId] = useState<number | null>(null);
  const [inlineCode, setInlineCode] = useState("");
  const [inlineNotes, setInlineNotes] = useState("");
  const [inlineSaving, setInlineSaving] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (search) {
      const s = search.toLowerCase();
      setFiltered(
        links.filter(
          (link) =>
            link.customerName.toLowerCase().includes(s) ||
            link.productReference.toLowerCase().includes(s) ||
            link.customerCode.toLowerCase().includes(s) ||
            link.productDescription.toLowerCase().includes(s)
        )
      );
    } else {
      setFiltered(links);
    }
  }, [search, links]);

  async function loadAll() {
    try {
      setLoading(true);
      const [data, c, p] = await Promise.all([
        customerProductService.getAll(),
        customerService.getAll(),
        productService.getAll(),
      ]);
      setLinks(data);
      setFiltered(data);
      setCustomers(c);
      setProducts(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleNew() {
    setFormData({ customerId: 0, productId: 0, customerCode: "", notes: "" });
    setShowModal(true);
  }

  async function handleSave() {
    if (!formData.customerId || !formData.productId || !formData.customerCode) return;
    try {
      setSaving(true);
      await customerProductService.create(formData);
      setShowModal(false);
      loadAll();
    } catch (err: any) {
      alert(err.message || "Erro ao salvar vínculo");
    } finally {
      setSaving(false);
    }
  }

  function startInlineEdit(link: CustomerProduct) {
    setInlineEditId(link.id);
    setInlineCode(link.customerCode);
    setInlineNotes(link.notes || "");
  }

  async function saveInlineEdit(link: CustomerProduct) {
    if (!inlineCode.trim()) return;
    try {
      setInlineSaving(true);
      await customerProductService.update(link.id, {
        customerId: link.customerId,
        productId: link.productId,
        customerCode: inlineCode.trim().toUpperCase(),
        notes: inlineNotes.trim() || undefined,
      });
      setInlineEditId(null);
      loadAll();
    } catch (err: any) {
      alert(err.message || "Erro ao atualizar vínculo");
    } finally {
      setInlineSaving(false);
    }
  }

  async function handleDelete(link: CustomerProduct) {
    if (!confirm(`Excluir vínculo ${link.customerName} → ${link.customerCode}?`)) return;
    try {
      await customerProductService.delete(link.id);
      loadAll();
    } catch (err) {
      console.error(err);
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
            <Link2 className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Vínculos Produto-Cliente</h1>
            <p className="text-sm text-slate-500">{links.length} vínculos cadastrados</p>
          </div>
        </div>
        <button
          onClick={handleNew}
          className="bg-teal-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Vínculo
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, produto ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Cliente</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Código do Cliente (EDI)</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Produto Interno</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Obs</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                  <Link2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium">Nenhum vínculo cadastrado</p>
                  <p className="text-sm">Cadastre o código do cliente para cada produto</p>
                </td>
              </tr>
            ) : (
              filtered.map((link) => {
                const isEditing = inlineEditId === link.id;
                return (
                  <tr key={link.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{link.customerName}</td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          autoFocus
                          type="text"
                          value={inlineCode}
                          onChange={e => setInlineCode(e.target.value.toUpperCase())}
                          onKeyDown={e => { if (e.key === "Enter") saveInlineEdit(link); if (e.key === "Escape") setInlineEditId(null); }}
                          className="font-mono text-xs border border-teal-400 rounded px-2 py-1 w-40 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      ) : (
                        <span className="font-mono text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-1 rounded">
                          {link.customerCode}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-700">{link.productReference}</p>
                      <p className="text-xs text-slate-500">{link.productDescription}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {isEditing ? (
                        <input
                          type="text"
                          value={inlineNotes}
                          onChange={e => setInlineNotes(e.target.value)}
                          placeholder="Observação..."
                          className="border border-slate-300 rounded px-2 py-1 text-xs w-36 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      ) : (
                        link.notes || "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveInlineEdit(link)}
                              disabled={inlineSaving || !inlineCode.trim()}
                              className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors disabled:opacity-40"
                              title="Salvar (Enter)"
                            >
                              {inlineSaving
                                ? <div className="w-4 h-4 border-2 border-teal-300 border-t-teal-600 rounded-full animate-spin" />
                                : <Check className="w-4 h-4" />
                              }
                            </button>
                            <button
                              onClick={() => setInlineEditId(null)}
                              className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Cancelar (Esc)"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startInlineEdit(link)}
                            className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Editar código EDI"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(link)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Tag className="w-4 h-4 text-teal-600" />
                </div>
                <h2 className="font-semibold text-slate-800">Novo Vínculo</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Cliente *</label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value={0}>Selecione o cliente...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Produto Interno *</label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value={0}>Selecione o produto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.reference} - {p.description}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Código do Cliente no EDI *</label>
                <input
                  type="text"
                  value={formData.customerCode}
                  onChange={(e) => setFormData({ ...formData, customerCode: e.target.value.toUpperCase() })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  placeholder="Ex: BCA359"
                />
                <p className="text-xs text-slate-500 mt-1">Código que aparece no arquivo EDI deste cliente (BuyerItemCode / LIN)</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Observação</label>
                <input
                  type="text"
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Opcional"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.customerId || !formData.productId || !formData.customerCode}
                className="bg-teal-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
