"use client";

import { useEffect, useState } from "react";
import { WarehouseStreet, WarehouseLocation, WarehouseStreetInput } from "@/lib/types";
import { warehouseService } from "@/lib/services";
import {
  Warehouse,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  MapPin,
  Layers,
  ChevronRight,
  Map
} from "lucide-react";
import Link from "next/link";

type TabType = "streets" | "locations" | "map";

export default function WarehousePage() {
  const [activeTab, setActiveTab] = useState<TabType>("streets");
  const [streets, setStreets] = useState<WarehouseStreet[]>([]);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingStreet, setEditingStreet] = useState<WarehouseStreet | null>(null);
  const [formData, setFormData] = useState<WarehouseStreetInput>({
    code: "",
    name: "",
    sortOrder: 0,
    rackCount: 0,
    color: "#3B82F6"
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [streetsData, locationsData] = await Promise.all([
        warehouseService.getStreets(),
        warehouseService.getLocations()
      ]);
      setStreets(streetsData);
      setLocations(locationsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredStreets = streets.filter(s =>
    s.code.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLocations = locations.filter(l =>
    l.code.toLowerCase().includes(search.toLowerCase()) ||
    l.streetName.toLowerCase().includes(search.toLowerCase())
  );

  function handleNewStreet() {
    setEditingStreet(null);
    setFormData({ code: "", name: "", sortOrder: streets.length, rackCount: 10, color: "#3B82F6" });
    setShowModal(true);
  }

  function handleEditStreet(street: WarehouseStreet) {
    setEditingStreet(street);
    setFormData({
      code: street.code,
      name: street.name,
      description: street.description,
      sortOrder: street.sortOrder,
      rackCount: street.rackCount,
      color: street.color || "#3B82F6"
    });
    setShowModal(true);
  }

  async function handleSaveStreet() {
    try {
      setSaving(true);
      if (editingStreet) {
        await warehouseService.updateStreet(editingStreet.id, {
          name: formData.name,
          description: formData.description,
          sortOrder: formData.sortOrder,
          rackCount: formData.rackCount,
          color: formData.color
        });
      } else {
        await warehouseService.createStreet(formData);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar rua");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteStreet(street: WarehouseStreet) {
    if (!confirm(`Excluir rua ${street.name}?`)) return;
    try {
      await warehouseService.deleteStreet(street.id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Erro ao excluir rua");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin" />
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
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Warehouse className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Armazém</h1>
            <p className="text-sm text-slate-500">
              {streets.length} ruas • {locations.length} locais
            </p>
          </div>
        </div>
        {activeTab === "streets" && (
          <button
            onClick={handleNewStreet}
            className="bg-emerald-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Rua
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("streets")}
          className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
            activeTab === "streets"
              ? "bg-white text-emerald-600 shadow-sm"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          Ruas
        </button>
        <button
          onClick={() => setActiveTab("locations")}
          className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
            activeTab === "locations"
              ? "bg-white text-emerald-600 shadow-sm"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <MapPin className="w-4 h-4" />
          Locais
        </button>
        <button
          onClick={() => setActiveTab("map")}
          className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
            activeTab === "map"
              ? "bg-white text-emerald-600 shadow-sm"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <Map className="w-4 h-4" />
          Mapa
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === "streets" ? "Buscar ruas..." : "Buscar locais..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Content */}
      {activeTab === "streets" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Código</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Prateleiras</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Locais</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredStreets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    <Warehouse className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">Nenhuma rua cadastrada</p>
                    <p className="text-sm">Crie uma rua para começar</p>
                  </td>
                </tr>
              ) : (
                filteredStreets.map((street) => (
                  <tr key={street.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: street.color || "#3B82F6" }}
                        />
                        <span className="font-mono text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                          {street.code}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{street.name}</p>
                      {street.description && (
                        <p className="text-xs text-slate-500">{street.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                        {street.rackCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {street.locationCount} locais
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/warehouse/streets/${street.id}`}
                        className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors inline-block"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleEditStreet(street)}
                        className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStreet(street)}
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
      )}

      {activeTab === "locations" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Código</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Rua</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Prateleira</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Nível</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Posição</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Produtos</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <MapPin className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">Nenhum local cadastrado</p>
                    <p className="text-sm">Crie locais a partir de uma rua</p>
                  </td>
                </tr>
              ) : (
                filteredLocations.map((loc) => (
                  <tr key={loc.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                        {loc.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{loc.streetName}</td>
                    <td className="px-4 py-3 text-slate-600">{loc.rack}</td>
                    <td className="px-4 py-3 text-slate-600">{loc.level}</td>
                    <td className="px-4 py-3 text-slate-600">{loc.position}</td>
                    <td className="px-4 py-3">
                      {loc.productCount > 0 ? (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          {loc.productCount}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {loc.isAvailable ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          Disponível
                        </span>
                      ) : (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                          Indisponível
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "map" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="text-center text-slate-500">
            <Map className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="font-medium text-lg">Mapa do Armazém</p>
            <p className="text-sm mb-4">Visualização gráfica das ruas e locais</p>
            
            {streets.length === 0 ? (
              <p className="text-sm">Cadastre ruas para visualizar o mapa</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 text-left">
                {streets.map((street) => (
                  <div
                    key={street.id}
                    className="border-2 rounded-lg p-4"
                    style={{ borderColor: street.color || "#3B82F6" }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: street.color || "#3B82F6" }}
                      />
                      <span className="font-bold text-slate-800">{street.name}</span>
                    </div>
                    <div className="text-xs text-slate-500 space-y-1">
                      <p>{street.rackCount} prateleiras</p>
                      <p>{street.locationCount} locais cadastrados</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Nova/Editar Rua */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Layers className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="font-semibold text-slate-800">
                  {editingStreet ? "Editar Rua" : "Nova Rua"}
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Código *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    disabled={!!editingStreet}
                    placeholder="Ex: A"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Nome *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Ex: Rua A"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Descrição</label>
                <input
                  type="text"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Descrição opcional"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Ordem</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Prateleiras</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.rackCount}
                    onChange={(e) => setFormData({ ...formData, rackCount: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Cor</label>
                  <input
                    type="color"
                    value={formData.color || "#3B82F6"}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-9 border border-slate-300 rounded-lg cursor-pointer"
                  />
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
                onClick={handleSaveStreet}
                disabled={saving || !formData.code || !formData.name}
                className="bg-emerald-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
