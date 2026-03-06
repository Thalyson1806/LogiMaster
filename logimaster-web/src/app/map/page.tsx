"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Navigation, MapPin, Package, RefreshCw, Search } from "lucide-react";
import { customerService, packingListService } from "@/lib/services";
import { Customer, PackingListSummary } from "@/lib/types";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

export default function MapPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [packingLists, setPackingLists] = useState<PackingListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "geocoded">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    loadData();
    if (typeof window !== "undefined") {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
      setMapReady(true);
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [customersData, packingListsData] = await Promise.all([
        customerService.getAll(),
        packingListService.getAll(),
      ]);
      setCustomers(customersData);
      setPackingLists(packingListsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const geocodeCustomer = async (customerId: number) => {
    try {
      setGeocoding(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/map/geocode/${customerId}`,
        { method: "POST" }
      );
      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error("Erro ao geocodificar:", error);
    } finally {
      setGeocoding(false);
    }
  };

  const geocodeAll = async () => {
    const toGeocode = customers.filter((c) => !c.hasCoordinates && c.address);
    for (const customer of toGeocode) {
      await geocodeCustomer(customer.id);
    }
  };

  const customersWithCoords = useMemo(
    () => customers.filter((c) => c.hasCoordinates),
    [customers]
  );

  const customersWithoutCoords = useMemo(
    () => customers.filter((c) => !c.hasCoordinates),
    [customers]
  );

  const pendingDeliveries = useMemo(
    () => packingLists.filter((pl) => pl.status === "Pending" || pl.status === "InTransit"),
    [packingLists]
  );

  const filteredCustomers = useMemo(() => {
    let result = customers;

    if (filter === "pending") {
      const pendingCustomerIds = new Set(pendingDeliveries.map((pl) => pl.customerId));
      result = result.filter((c) => pendingCustomerIds.has(c.id));
    } else if (filter === "geocoded") {
      result = result.filter((c) => c.hasCoordinates);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.code.toLowerCase().includes(term) ||
          c.city?.toLowerCase().includes(term)
      );
    }

    return result.filter((c) => c.hasCoordinates);
  }, [customers, filter, searchTerm, pendingDeliveries]);

  const center: [number, number] = [-23.55, -46.63];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
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
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Mapa de Clientes</h1>
            <p className="text-sm text-slate-500">
              {customersWithCoords.length} com coordenadas de {customers.length} clientes
            </p>
          </div>
        </div>
        <button
          onClick={geocodeAll}
          disabled={geocoding || customersWithoutCoords.length === 0}
          className="bg-blue-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <Navigation className="w-4 h-4" />
          {geocoding ? "Geocodificando..." : `Geocodificar (${customersWithoutCoords.length})`}
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total de Clientes</p>
              <p className="text-xl font-bold text-slate-800">{customers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Navigation className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Com Coordenadas</p>
              <p className="text-xl font-bold text-slate-800">{customersWithCoords.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Sem Coordenadas</p>
              <p className="text-xl font-bold text-slate-800">{customersWithoutCoords.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Entregas Pendentes</p>
              <p className="text-xl font-bold text-slate-800">{pendingDeliveries.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter("geocoded")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "geocoded"
                  ? "bg-green-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Com Coordenadas
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "pending"
                  ? "bg-orange-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Com Entregas Pendentes
            </button>
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6" style={{ height: "500px" }}>
        {mapReady && (
          <MapContainer
            center={center}
            zoom={5}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredCustomers.map((customer) => (
              <Marker
                key={customer.id}
                position={[customer.latitude!, customer.longitude!]}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold">{customer.name}</p>
                    <p className="text-slate-600">{customer.code}</p>
                    {customer.city && (
                      <p className="text-slate-500">
                        {customer.city}, {customer.state}
                      </p>
                    )}
                    {pendingDeliveries.filter((pl) => pl.customerId === customer.id).length > 0 && (
                      <p className="text-orange-600 font-medium mt-1">
                        {pendingDeliveries.filter((pl) => pl.customerId === customer.id).length} entrega(s) pendente(s)
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      {/* Lista de clientes sem coordenadas */}
      {customersWithoutCoords.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <h2 className="font-semibold text-slate-800">
              Clientes sem Coordenadas ({customersWithoutCoords.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {customersWithoutCoords.slice(0, 10).map((customer) => (
              <div
                key={customer.id}
                className="px-4 py-3 flex justify-between items-center hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-slate-800">{customer.name}</p>
                  <p className="text-sm text-slate-500">
                    {customer.address
                      ? `${customer.address}, ${customer.city}, ${customer.state}`
                      : "Endereço não cadastrado"}
                  </p>
                </div>
                <button
                  onClick={() => geocodeCustomer(customer.id)}
                  disabled={geocoding || !customer.address}
                  className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                  Geocodificar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
