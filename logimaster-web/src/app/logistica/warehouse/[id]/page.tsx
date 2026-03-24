"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { WarehouseStreet, WarehouseLocation, BulkCreateLocationsInput, Product, ProductLocation } from "@/lib/types";
import { warehouseService, productService } from "@/lib/services";
import {
  Warehouse,
  ArrowLeft,
  Plus,
  Trash2,
  MapPin,
  Layers,
  Package,
  X,
  Search
} from "lucide-react";
import Link from "next/link";

export default function StreetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const streetId = Number(params.id);

  const [street, setStreet] = useState<WarehouseStreet | null>(null);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal criar locais em massa
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkForm, setBulkForm] = useState<BulkCreateLocationsInput>({
    streetId: streetId,
    street: "",
    rackStart: 1,
    rackEnd: 10,
    levelStart: 1,
    levelEnd: 3,
    positionStart: 1,
    positionEnd: 5
  });
  const [creating, setCreating] = useState(false);

  // Modal vincular produto
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<WarehouseLocation | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productLocations, setProductLocations] = useState<ProductLocation[]>([]);

  useEffect(() => {
    loadData();
  }, [streetId]);

  async function loadData() {
    try {
      setLoading(true);
      const [streetData, locationsData] = await Promise.all([
        warehouseService.getStreetById(streetId),
        warehouseService.getLocationsByStreet(streetId)
      ]);
      
      if (!streetData) {
        router.push("/logistica/warehouse");
        return;
      }

      setStreet(streetData);
      setLocations(locationsData);
      setBulkForm(prev => ({ ...prev, street: streetData.code }));
    } catch (err) {
      console.error(err);
      router.push("/logistica/warehouse");
    } finally {
      setLoading(false);
    }
  }

  const filteredLocations = locations.filter(l =>
    l.code.toLowerCase().includes(search.toLowerCase())
  );

  // Agrupar por rack
  const locationsByRack = filteredLocations.reduce((acc, loc) => {
    if (!acc[loc.rack]) acc[loc.rack] = [];
    acc[loc.rack].push(loc);
    return acc;
  }, {} as Record<string, WarehouseLocation[]>);

  async function handleBulkCreate() {
    try {
      setCreating(true);
      const created = await warehouseService.bulkCreateLocations(bulkForm);
      alert(`${created.length} locais criados com sucesso!`);
      setShowBulkModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Erro ao criar locais");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteLocation(loc: WarehouseLocation) {
    if (!confirm(`Excluir local ${loc.code}?`)) return;
    try {
      await warehouseService.deleteLocation(loc.id);
      loadData();
    } catch (err: any) {
      alert(err.message || "Erro ao excluir local");
    }
  }

  async function openProductModal(loc: WarehouseLocation) {
    setSelectedLocation(loc);
    setShowProductModal(true);
    setProductSearch("");
    
    // Carregar produtos e vínculos
    const [prods, plocs] = await Promise.all([
      productService.getAll(),
      warehouseService.getProductLocations(undefined, loc.id)
    ]);
    setProducts(prods);
    setProductLocations(plocs);
  }

  async function handleAssignProduct(productId: number) {
    if (!selectedLocation) return;
    try {
      await warehouseService.assignProductLocation({
        productId,
        locationId: selectedLocation.id,
        isPrimary: true
      });
      
      // Recarregar vínculos
      const plocs = await warehouseService.getProductLocations(undefined, selectedLocation.id);
      setProductLocations(plocs);
      loadData();
    } catch (err: any) {
      alert(err.message || "Erro ao vincular produto");
    }
  }

  async function handleRemoveProductLocation(plId: number) {
    try {
      await warehouseService.deleteProductLocation(plId);
      const plocs = await warehouseService.getProductLocations(undefined, selectedLocation?.id);
      setProductLocations(plocs);
      loadData();
    } catch (err: any) {
      alert(err.message || "Erro ao remover vínculo");
    }
  }

  const filteredProducts = products.filter(p =>
    p.reference.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.description.toLowerCase().includes(productSearch.toLowerCase())
  );


  // Calcular quantos locais serão criados
  const bulkCount = 
    (bulkForm.rackEnd - bulkForm.rackStart + 1) *
    (bulkForm.levelEnd - bulkForm.levelStart + 1) *
    (bulkForm.positionEnd - bulkForm.positionStart + 1);

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

  if (!street) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/logistica/warehouse"
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Link>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: street.color || "#3B82F6" }}
          >
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{street.name}</h1>
            <p className="text-sm text-slate-500">
              Código: {street.code} • {locations.length} locais
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowBulkModal(true)}
          className="bg-emerald-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Criar Locais em Massa
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar local..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Locais agrupados por rack */}
      {Object.keys(locationsByRack).length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <MapPin className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-medium text-slate-600">Nenhum local cadastrado</p>
          <p className="text-sm text-slate-500 mb-4">Crie locais em massa para esta rua</p>
          <button
            onClick={() => setShowBulkModal(true)}
            className="bg-emerald-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-emerald-700"
          >
            Criar Locais
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(locationsByRack)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([rack, locs]) => (
              <div key={rack} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                  <span className="font-medium text-slate-700">Prateleira {rack}</span>
                  <span className="text-sm text-slate-500 ml-2">({locs.length} locais)</span>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {locs
                    .sort((a, b) => {
                      if (a.level !== b.level) return a.level - b.level;
                      return a.position.localeCompare(b.position);
                    })
                    .map((loc) => (
                      <div
                        key={loc.id}
                        className={`
                          relative p-2 rounded-lg border-2 text-center cursor-pointer transition-all
                          ${loc.productCount > 0
                            ? "border-purple-300 bg-purple-50 hover:border-purple-400"
                            : "border-slate-200 bg-slate-50 hover:border-emerald-400"
                          }
                        `}
                        onClick={() => openProductModal(loc)}
                      >
                        <div className="font-mono text-xs font-bold text-slate-700">
                          {loc.level}-{loc.position}
                        </div>
                        {loc.productCount > 0 && (
                          <div className="text-[10px] text-purple-600 flex items-center justify-center gap-0.5">
                            <Package className="w-3 h-3" />
                            {loc.productCount}
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLocation(loc);
                          }}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Modal Criar em Massa */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Plus className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="font-semibold text-slate-800">Criar Locais em Massa</h2>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-sm text-slate-600">
                  Serão criados <span className="font-bold text-emerald-600">{bulkCount}</span> locais
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Formato: {street.code}-[RACK]-[NÍVEL]-[POSIÇÃO]
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Prateleira (Rack)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500">De</label>
                    <input
                      type="number"
                      min="1"
                      value={bulkForm.rackStart}
                      onChange={(e) => setBulkForm({ ...bulkForm, rackStart: parseInt(e.target.value) || 1 })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Até</label>
                    <input
                      type="number"
                      min="1"
                      value={bulkForm.rackEnd}
                      onChange={(e) => setBulkForm({ ...bulkForm, rackEnd: parseInt(e.target.value) || 1 })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Nível (Altura)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500">De</label>
                    <input
                      type="number"
                      min="0"
                      value={bulkForm.levelStart}
                      onChange={(e) => setBulkForm({ ...bulkForm, levelStart: parseInt(e.target.value) || 0 })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Até</label>
                    <input
                      type="number"
                      min="0"
                      value={bulkForm.levelEnd}
                      onChange={(e) => setBulkForm({ ...bulkForm, levelEnd: parseInt(e.target.value) || 0 })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Posição</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500">De</label>
                    <input
                      type="number"
                      min="1"
                      value={bulkForm.positionStart}
                      onChange={(e) => setBulkForm({ ...bulkForm, positionStart: parseInt(e.target.value) || 1 })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Até</label>
                    <input
                      type="number"
                      min="1"
                      value={bulkForm.positionEnd}
                      onChange={(e) => setBulkForm({ ...bulkForm, positionEnd: parseInt(e.target.value) || 1 })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkCreate}
                disabled={creating || bulkCount <= 0}
                className="bg-emerald-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {creating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Criando...
                  </>
                ) : (
                  `Criar ${bulkCount} Locais`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Vincular Produto */}
      {showProductModal && selectedLocation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[80vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800">Local {selectedLocation.code}</h2>
                  <p className="text-xs text-slate-500">Vincular produtos</p>
                </div>
              </div>
              <button onClick={() => setShowProductModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Produtos vinculados */}
            {productLocations.length > 0 && (
              <div className="px-5 py-3 border-b border-slate-200 bg-purple-50">
                <p className="text-xs font-medium text-purple-700 mb-2">Produtos neste local:</p>
                <div className="space-y-1">
                  {productLocations.map((pl) => (
                    <div key={pl.id} className="flex items-center justify-between bg-white rounded px-2 py-1">
                      <div>
                        <span className="font-mono text-xs text-purple-600">{pl.productReference}</span>
                        <span className="text-xs text-slate-500 ml-2">{pl.productDescription}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveProductLocation(pl.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Buscar produto */}
            <div className="p-5 flex-1 overflow-auto">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar produto por referência ou descrição..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="space-y-1 max-h-60 overflow-auto">
                {filteredProducts.slice(0, 20).map((product) => {
                  const isLinked = productLocations.some(pl => pl.productId === product.id);
                  return (
                    <div
                      key={product.id}
                      className={`
                        flex items-center justify-between p-2 rounded-lg border transition-colors
                        ${isLinked
                          ? "border-purple-200 bg-purple-50 cursor-not-allowed"
                          : "border-slate-200 hover:border-emerald-400 cursor-pointer"
                        }
                      `}
                      onClick={() => !isLinked && handleAssignProduct(product.id)}
                    >
                      <div>
                        <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                          {product.reference}
                        </span>
                        <span className="text-sm text-slate-600 ml-2">{product.description}</span>
                      </div>
                      {isLinked ? (
                        <span className="text-xs text-purple-600">Vinculado</span>
                      ) : (
                        <Plus className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowProductModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
