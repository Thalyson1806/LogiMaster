"use client";

import { useEffect, useState } from "react";
import { Product, ProductInput, Packaging } from "@/lib/types";
import { productService, packagingService } from "@/lib/services";
import { BASE_URL } from "@/lib/api";
import {
  Package, Plus, Search, Pencil, Trash2, X,
  Tag, DollarSign, Upload, Box, Layers, ChevronLeft, ChevronRight
} from "lucide-react";

const PAGE_SIZE = 20;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [packagings, setPackagings] = useState<Packaging[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductInput>({
    reference: "",
    description: "",
    unitsPerBox: 1,
    boxesPerPallet: undefined,
    unitPrice: 0,
    defaultPackagingId: undefined,
  });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState(false);
  const [importingCatalog, setImportingCatalog] = useState(false);
  const [importingMaster, setImportingMaster] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadProducts();
    loadPackagings();
  }, []);

  useEffect(() => {
    if (search) {
      const filtered = products.filter(
        (p) =>
          p.reference.toLowerCase().includes(search.toLowerCase()) ||
          p.description.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
    setCurrentPage(1);
  }, [search, products]);

  async function loadProducts() {
    try {
      setLoading(true);
      const data = await productService.getAll();
      setProducts(data);
      setFilteredProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadPackagings() {
    try {
      const data = await packagingService.getAll();
      setPackagings(data.filter(p => p.isActive));
    } catch (err) {
      console.error(err);
    }
  }

  function handleNew() {
    setEditingProduct(null);
    setFormData({
      reference: "",
      description: "",
      unitsPerBox: 1,
      boxesPerPallet: undefined,
      unitPrice: 0,
      defaultPackagingId: undefined
    });
    setShowModal(true);
  }

  function handleEdit(product: Product) {
    setEditingProduct(product);
    setFormData({
      reference: product.reference,
      description: product.description,
      unitsPerBox: product.unitsPerBox || 1,
      boxesPerPallet: product.boxesPerPallet,
      unitPrice: product.unitPrice || 0,
      defaultPackagingId: product.defaultPackagingId,
    });
    setShowModal(true);
  }

  async function handleSave() {
    try {
      setSaving(true);
      if (editingProduct) {
        await productService.update(editingProduct.id, formData);
      } else {
        await productService.create(formData);
      }
      setShowModal(false);
      loadProducts();
    } catch (err: any) {
      alert("Erro ao salvar: " + (err?.message || "Erro desconhecido"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Excluir produto ${product.description}?`)) return;
    try {
      await productService.delete(product.id);
      loadProducts();
    } catch (err: any) {
      alert("Erro ao excluir: " + (err?.message || "Erro desconhecido"));
    }
  }

  async function handleImportMaster(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImportingMaster(true);
      const fd = new FormData();
      fd.append("file", file);
      const response = await fetch(`${BASE_URL}/api/products/import-master`, {
        method: "POST",
        body: fd,
      });
      const text = await response.text();
      const result = text ? JSON.parse(text) : {};
      if (response.ok) {
        alert(result.message || "Importação concluída");
        loadProducts();
      } else {
        alert(result.message || `Erro ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao importar arquivo");
    } finally {
      setImportingMaster(false);
      e.target.value = "";
    }
  }

  async function handleImportCatalog(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportingCatalog(true);
      const fd = new FormData();
      fd.append("file", file);

      const response = await fetch(`${BASE_URL}/api/products/import-catalog`, {
        method: "POST",
        body: fd,
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        loadProducts();
      } else {
        alert(result.message || "Erro ao importar catálogo");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao importar arquivo");
    } finally {
      setImportingCatalog(false);
      e.target.value = "";
    }
  }

  async function handleImportSpreadsheet(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const fd = new FormData();
      fd.append("file", file);

      const response = await fetch(`${BASE_URL}/api/products/import-spreadsheet`, {
        method: "POST",
        body: fd,
      });

      const result = await response.json();

      if (response.ok) {
        let msg = `${result.created} criados, ${result.updated} atualizados.`;
        if (result.packagingNotFoundCount > 0) {
          msg += `\n\nEmbalagens não encontradas (${result.packagingNotFoundCount}):\n${result.packagingNotFound.join(", ")}`;
        }
        alert(msg);
        loadProducts();
      } else {
        alert(result.message || "Erro ao importar");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao importar arquivo");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  function formatCurrency(value: number | undefined): string {
    if (!value) return "-";
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function getPageNumbers(): number[] {
    const start = Math.max(1, Math.min(totalPages - 4, currentPage - 2));
    return Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-purple-600 rounded-full animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Produtos</h1>
            <p className="text-sm text-slate-500">{products.length} cadastrados</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="bg-indigo-100 text-indigo-700 px-4 py-2 text-sm rounded-lg hover:bg-indigo-200 transition-colors flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            {importingMaster ? "Importando..." : "Importar Completo"}
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportMaster}
              className="hidden"
              disabled={importingMaster}
            />
          </label>
          <label className="bg-green-100 text-green-700 px-4 py-2 text-sm rounded-lg hover:bg-green-200 transition-colors flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            {importingCatalog ? "Importando..." : "Importar Catálogo"}
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportCatalog}
              className="hidden"
              disabled={importingCatalog}
            />
          </label>
          <label className="bg-slate-100 text-slate-700 px-4 py-2 text-sm rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            {importing ? "Importando..." : "Importar Planilha"}
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportSpreadsheet}
              className="hidden"
              disabled={importing}
            />
          </label>
          <button
            onClick={handleNew}
            className="bg-purple-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Produto
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por referência ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Referência</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Descrição</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Un/Cx</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Cx/Pallet</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Embalagem</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Preço</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium">Nenhum produto encontrado</p>
                  <p className="text-sm">Cadastre ou importe produtos para começar</p>
                </td>
              </tr>
            ) : (
              paginatedProducts.map((product) => (
                <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {product.reference}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{product.description}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                      {product.unitsPerBox}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {product.boxesPerPallet ? (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center gap-1 w-fit">
                        <Layers className="w-3 h-3" />
                        {product.boxesPerPallet}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {product.defaultPackagingName ? (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded flex items-center gap-1 w-fit">
                        <Box className="w-3 h-3" />
                        {product.defaultPackagingName}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {product.unitPrice ? (
                      <span className="text-emerald-600 font-medium">{formatCurrency(product.unitPrice)}</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
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

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-sm text-slate-500">
            Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–
            {Math.min(currentPage * PAGE_SIZE, filteredProducts.length)} de{" "}
            {filteredProducts.length} produtos
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            {getPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 text-sm rounded-lg border transition-colors ${
                  page === currentPage
                    ? "bg-purple-600 text-white border-purple-600"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Tag className="w-4 h-4 text-purple-600" />
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
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Referência *</label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={!!editingProduct}
                  placeholder="Ex: 10MF01-0001"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Descrição *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Descrição do produto"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Un/Caixa</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.unitsPerBox}
                    onChange={(e) => setFormData({ ...formData, unitsPerBox: parseInt(e.target.value) || 1 })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Cx/Pallet</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.boxesPerPallet || ""}
                    onChange={(e) => setFormData({ ...formData, boxesPerPallet: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ex: 10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Preço Unitário</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-10 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0,00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Embalagem Padrão</label>
                  <div className="relative">
                    <Box className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      value={formData.defaultPackagingId || ""}
                      onChange={(e) => setFormData({ ...formData, defaultPackagingId: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="w-full pl-10 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Nenhuma</option>
                      {packagings.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.code} - {pkg.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
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
                disabled={saving || !formData.reference || !formData.description}
                className="bg-purple-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
