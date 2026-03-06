"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EdiClient, EdiProduct, EdiProductInput } from "@/lib/types";
import { ediClientService, ediProductService } from "@/lib/services";
import {
  Package,
  ArrowLeft,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Filter,
} from "lucide-react";

export default function EdiProductsPage() {
  const [clients, setClients] = useState<EdiClient[]>([]);
  const [products, setProducts] = useState<EdiProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<EdiProduct[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<EdiProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<EdiProductInput>({
    ediClientId: 0,
    description: "",
    reference: "",
    code: "",
    value: undefined,
  });

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      loadProducts(selectedClientId);
    } else {
      setProducts([]);
      setFilteredProducts([]);
    }
  }, [selectedClientId]);

  useEffect(() => {
    if (search) {
      const filtered = products.filter(
        (p) =>
          p.description.toLowerCase().includes(search.toLowerCase()) ||
          p.reference?.toLowerCase().includes(search.toLowerCase()) ||
          p.code?.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [search, products]);

  async function loadClients() {
    try {
      setLoading(true);
      const data = await ediClientService.getAll();
      setClients(data);
      if (data.length > 0) {
        setSelectedClientId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts(clientId: number) {
    try {
      const data = await ediProductService.getByClientId(clientId);
      setProducts(data);
      setFilteredProducts(data);
    } catch (err) {
      console.error(err);
    }
  }

  function handleNew() {
    if (!selectedClientId) return;
    setEditingProduct(null);
    setFormData({
      ediClientId: selectedClientId,
      description: "",
      reference: "",
      code: "",
      value: undefined,
    });
    setShowModal(true);
  }

  function handleEdit(product: EdiProduct) {
    setEditingProduct(product);
    setFormData({
      ediClientId: product.ediClientId,
      description: product.description,
      reference: product.reference || "",
      code: product.code || "",
      value: product.value,
    });
    setShowModal(true);
  }

  async function handleSave() {
    try {
      setSaving(true);
      if (editingProduct) {
        await ediProductService.update(editingProduct.id, {
          description: formData.description,
          reference: formData.reference,
          code: formData.code,
          value: formData.value,
        });
      } else {
        await ediProductService.create(formData);
      }
      setShowModal(false);
      if (selectedClientId) {
        loadProducts(selectedClientId);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar produto");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product: EdiProduct) {
    if (!confirm(`Excluir produto "${product.description}"?`)) return;
    try {
      await ediProductService.delete(product.id);
      if (selectedClientId) {
        loadProducts(selectedClientId);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir produto");
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
        <div className="flex items-center gap-4">
          <Link
            href="/logistica/edi"
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Produtos EDI</h1>
              <p className="text-sm text-slate-500">{products.length} produtos</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleNew}
          disabled={!selectedClientId}
          className="bg-teal-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-slate-400" />
          <select
            value={selectedClientId || ""}
            onChange={(e) => setSelectedClientId(e.target.value ? parseInt(e.target.value) : null)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="">Selecione um cliente</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.code} - {client.name}
              </option>
            ))}
          </select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por descrição, referência ou código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Descrição</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Referência</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Código</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Valor</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {!selectedClientId ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                  <Filter className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium">Selecione um cliente</p>
                  <p className="text-sm">Escolha um cliente para ver os produtos</p>
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium">Nenhum produto encontrado</p>
                  <p className="text-sm">Cadastre um novo produto</p>
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{product.description}</p>
                  </td>
                  <td className="px-4 py-3">
                    {product.reference ? (
                      <span className="font-mono text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded">
                        {product.reference}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {product.code ? (
                      <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                        {product.code}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {product.value ? (
                      <span className="text-emerald-600 font-medium">
                        {product.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-teal-600" />
                </div>
                <h2 className="font-semibold text-slate-800">
                  {editingProduct ? "Editar Produto" : "Novo Produto"}
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Descrição *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Descrição do produto EDI"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Referência</label>
                  <input
                    type="text"
                    value={formData.reference || ""}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Ex: 10MF01-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Código</label>
                  <input
                    type="text"
                    value={formData.code || ""}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Código alternativo"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.value || ""}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="0,00"
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
                disabled={saving || !formData.description}
                className="bg-teal-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

