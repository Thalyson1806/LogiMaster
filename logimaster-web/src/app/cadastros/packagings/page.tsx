"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Box, Package, X, Ruler, Upload, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { packagingService } from "@/lib/services";
import { Packaging, PackagingInput, PackagingType } from "@/lib/types";
import { BASE_URL } from "@/lib/api";

const PAGE_SIZE = 20;

export default function PackagingsPage() {
  const [packagings, setPackagings] = useState<Packaging[]>([]);
  const [packagingTypes, setPackagingTypes] = useState<PackagingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingPackaging, setEditingPackaging] = useState<Packaging | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingType, setSavingType] = useState(false);
  const [importing, setImporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<PackagingInput>({
    code: "",
    name: "",
    packagingTypeId: 0,
    description: "",
    length: undefined,
    width: undefined,
    height: undefined,
    weight: undefined,
    maxWeight: undefined,
    maxUnits: undefined,
    notes: "",
  });
  const [typeForm, setTypeForm] = useState({ code: "", name: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [packagingsData, typesData] = await Promise.all([
        packagingService.getAll(),
        packagingService.getTypes()
      ]);
      setPackagings(packagingsData);
      setPackagingTypes(typesData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPackaging(null);
    setFormData({
      code: "",
      name: "",
      packagingTypeId: packagingTypes.length > 0 ? packagingTypes[0].id : 0,
      description: "",
      length: undefined,
      width: undefined,
      height: undefined,
      weight: undefined,
      maxWeight: undefined,
      maxUnits: undefined,
      notes: "",
    });
    setShowModal(true);
  };

  const openEditModal = (packaging: Packaging) => {
    setEditingPackaging(packaging);
    setFormData({
      code: packaging.code,
      name: packaging.name,
      packagingTypeId: packaging.packagingTypeId,
      description: packaging.description || "",
      length: packaging.length,
      width: packaging.width,
      height: packaging.height,
      weight: packaging.weight,
      maxWeight: packaging.maxWeight,
      maxUnits: packaging.maxUnits,
      notes: packaging.notes || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingPackaging) {
        await packagingService.update(editingPackaging.id, formData);
      } else {
        await packagingService.create(formData);
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar embalagem");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingType(true);
      const created = await packagingService.createType(typeForm);
      setPackagingTypes(prev => [...prev, created]);
      setFormData(prev => ({ ...prev, packagingTypeId: created.id }));
      setShowTypeModal(false);
      setTypeForm({ code: "", name: "" });
    } catch (error: any) {
      alert(error.message || "Erro ao criar tipo");
    } finally {
      setSavingType(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm("Deseja desativar esta embalagem?")) return;
    try {
      await packagingService.deactivate(id);
      loadData();
    } catch (error) {
      console.error("Erro ao desativar:", error);
    }
  };

  async function handleImportSpreadsheet(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const fd = new FormData();
      fd.append("file", file);

      const response = await fetch(`${BASE_URL}/api/packagings/import-spreadsheet`, {
        method: "POST",
        body: fd,
      });

      const result = await response.json();

      if (response.ok) {
        alert(`${result.created} embalagens criadas!\n${result.skipped > 0 ? `${result.skipped} já existiam e foram ignoradas.` : ""}`);
        loadData();
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

  const filteredPackagings = packagings.filter(
    (p) =>
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.packagingTypeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPackagings.length / PAGE_SIZE);
  const paginatedPackagings = filteredPackagings.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function getPageNumbers(): number[] {
    const start = Math.max(1, Math.min(totalPages - 4, currentPage - 2));
    return Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
  }

  // Reset ao buscar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-amber-600 rounded-full animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <Box className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Embalagens</h1>
            <p className="text-sm text-slate-500">{packagings.length} cadastradas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setTypeForm({ code: "", name: "" }); setShowTypeModal(true); }}
            className="bg-slate-100 text-slate-700 px-4 py-2 text-sm rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
          >
            <Tag className="w-4 h-4" />
            Novo Tipo
          </button>
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
            onClick={openCreateModal}
            className="bg-amber-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Embalagem
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código, nome ou tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Código</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Tipo</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Dimensões</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Capacidade</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPackagings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                  <Box className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium">Nenhuma embalagem encontrada</p>
                  <p className="text-sm">Cadastre ou importe embalagens para começar</p>
                </td>
              </tr>
            ) : (
              paginatedPackagings.map((packaging) => (
                <tr key={packaging.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                      {packaging.code}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{packaging.name}</p>
                    {packaging.description && (
                      <p className="text-xs text-slate-500">{packaging.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full">
                      <Package className="w-3 h-3" />
                      {packaging.packagingTypeName}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {packaging.length && packaging.width && packaging.height ? (
                      <span className="text-slate-600 text-xs">
                        {packaging.length} x {packaging.width} x {packaging.height} cm
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      {packaging.maxWeight && (
                        <span className="text-xs text-slate-600">Peso: {packaging.maxWeight} kg</span>
                      )}
                      {packaging.maxUnits && (
                        <span className="text-xs text-slate-600">Unid: {packaging.maxUnits}</span>
                      )}
                      {!packaging.maxWeight && !packaging.maxUnits && (
                        <span className="text-slate-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEditModal(packaging)}
                      className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeactivate(packaging.id)}
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
            {Math.min(currentPage * PAGE_SIZE, filteredPackagings.length)} de{" "}
            {filteredPackagings.length} embalagens
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
                    ? "bg-amber-600 text-white border-amber-600"
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

      {/* Modal Novo Tipo */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Tag className="w-4 h-4 text-amber-600" />
                </div>
                <h2 className="font-semibold text-slate-800">Novo Tipo de Embalagem</h2>
              </div>
              <button onClick={() => setShowTypeModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreateType} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Código *</label>
                <input
                  type="text"
                  value={typeForm.code}
                  onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value.toUpperCase() })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                  placeholder="Ex: RACK, KLT, CAIXA"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Nome *</label>
                <input
                  type="text"
                  value={typeForm.name}
                  onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                  placeholder="Ex: Rack Metálico, KLT Plástico"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowTypeModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingType || !typeForm.code || !typeForm.name}
                  className="bg-amber-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-amber-700 disabled:bg-slate-300 transition-colors flex items-center gap-2"
                >
                  {savingType ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : "Criar Tipo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Embalagem */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Box className="w-4 h-4 text-amber-600" />
                </div>
                <h2 className="font-semibold text-slate-800">
                  {editingPackaging ? "Editar Embalagem" : "Nova Embalagem"}
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Código *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                    disabled={!!editingPackaging}
                    placeholder="Ex: KLT6421"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Tipo *</label>
                  <div className="flex gap-2">
                    <select
                      value={formData.packagingTypeId}
                      onChange={(e) => setFormData({ ...formData, packagingTypeId: Number(e.target.value) })}
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      required
                    >
                      <option value={0} disabled>Selecione um tipo</option>
                      {packagingTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => { setTypeForm({ code: "", name: "" }); setShowTypeModal(true); }}
                      className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors text-sm font-bold"
                      title="Criar novo tipo"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                  placeholder="Nome da embalagem"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  rows={2}
                  placeholder="Descrição opcional"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                  <Ruler className="w-3 h-3" />
                  Dimensões (cm)
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="number" step="0.01" value={formData.length || ""}
                    onChange={(e) => setFormData({ ...formData, length: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Comprimento"
                  />
                  <input
                    type="number" step="0.01" value={formData.width || ""}
                    onChange={(e) => setFormData({ ...formData, width: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Largura"
                  />
                  <input
                    type="number" step="0.01" value={formData.height || ""}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Altura"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Peso (kg)</label>
                  <input
                    type="number" step="0.01" value={formData.weight || ""}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Peso Máximo (kg)</label>
                  <input
                    type="number" step="0.01" value={formData.maxWeight || ""}
                    onChange={(e) => setFormData({ ...formData, maxWeight: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Máx. Unidades</label>
                  <input
                    type="number" value={formData.maxUnits || ""}
                    onChange={(e) => setFormData({ ...formData, maxUnits: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Observações</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  rows={2}
                  placeholder="Observações opcionais"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !formData.code || !formData.name || !formData.packagingTypeId}
                  className="bg-amber-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-amber-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
