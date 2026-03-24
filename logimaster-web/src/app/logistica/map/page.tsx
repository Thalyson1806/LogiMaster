"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Navigation, MapPin, Package, Truck } from "lucide-react";
import { customerService, packingListService } from "@/lib/services";
import { Customer, PackingListSummary } from "@/lib/types";
import {
  startConnection,
  onPackingListUpdated,
  offPackingListUpdated,
  onDriverLocationUpdated,
  offDriverLocationUpdated,
  DriverLocation,
} from "@/lib/signalr";
import { BASE_URL } from "@/lib/api";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });

export default function MapPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [packingLists, setPackingLists] = useState<PackingListSummary[]>([]);
  const [driverLocations, setDriverLocations] = useState<Record<number, DriverLocation>>({});
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "geocoded">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);
  const [showIncidents, setShowIncidents] = useState(false);
  const [mapStyle, setMapStyle] = useState<"road" | "satellite" | "hybrid">("road");

  useEffect(() => {
    loadData();
    if (typeof window !== "undefined") {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
      setMapReady(true);
    }

    // SignalR
    startConnection().then(() => {
      onDriverLocationUpdated((data) => {
        setDriverLocations((prev) => ({ ...prev, [data.packingListId]: data }));
      });
      onPackingListUpdated((data) => {
        if (data.status === "Delivered" || data.status === "Cancelled") {
          setDriverLocations((prev) => {
            const next = { ...prev };
            delete next[data.id];
            return next;
          });
        }
      });
    });

    // Carrega motoristas já em rota
    fetch(`${BASE_URL}/api/packinglists/active-drivers`)
      .then((r) => r.json())
      .then((drivers: DriverLocation[]) => {
        const map: Record<number, DriverLocation> = {};
        drivers.forEach((d) => (map[d.packingListId] = d));
        setDriverLocations(map);
      })
      .catch(() => {});

    return () => {
      offDriverLocationUpdated();
      offPackingListUpdated();
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [customersRes, packingListsRes] = await Promise.allSettled([
        customerService.getAll(),
        packingListService.getAll(),
      ]);
      if (customersRes.status === "fulfilled") setCustomers(customersRes.value);
      if (packingListsRes.status === "fulfilled") setPackingLists(packingListsRes.value);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const geocodeCustomer = async (customerId: number) => {
    try {
      setGeocoding(true);
      await fetch(`${BASE_URL}/api/map/geocode/${customerId}`, { method: "POST" });
      await loadData();
    } catch {
    } finally {
      setGeocoding(false);
    }
  };

  const geocodeAll = async () => {
    for (const customer of customers.filter((c) => !c.hasCoordinates && c.address)) {
      await geocodeCustomer(customer.id);
    }
  };

  const customersWithCoords = useMemo(() => customers.filter((c) => c.hasCoordinates), [customers]);
  const customersWithoutCoords = useMemo(() => customers.filter((c) => !c.hasCoordinates), [customers]);
  const pendingDeliveries = useMemo(
    () => packingLists.filter((pl) => pl.status === "Pending" || pl.status === "InTransit"),
    [packingLists]
  );

  const filteredCustomers = useMemo(() => {
    let result = customers;
    if (filter === "pending") {
      const ids = new Set(pendingDeliveries.map((pl) => pl.customerId));
      result = result.filter((c) => ids.has(c.id));
    } else if (filter === "geocoded") {
      result = result.filter((c) => c.hasCoordinates);
    }
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(t) ||
          c.code.toLowerCase().includes(t) ||
          c.city?.toLowerCase().includes(t)
      );
    }
    return result.filter((c) => c.hasCoordinates);
  }, [customers, filter, searchTerm, pendingDeliveries]);

  const activeDriversList = Object.values(driverLocations);
  const center: [number, number] = [-23.55, -46.63];

  // Ícone de caminhão via divIcon (carregado apenas no cliente)
  const getTruckIcon = () => {
    if (typeof window === "undefined") return undefined;
    const L = require("leaflet");
    return L.divIcon({
      html: `<div style="font-size:28px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4))">🚚</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      className: "",
    });
  };

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
              {customersWithCoords.length} com coordenadas · {activeDriversList.length} motorista(s) em rota
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
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Entregas Pendentes</p>
              <p className="text-xl font-bold text-slate-800">{pendingDeliveries.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Em Rota Agora</p>
              <p className="text-xl font-bold text-slate-800">{activeDriversList.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "geocoded", "pending"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f === "all" ? "Todos" : f === "geocoded" ? "Com Coordenadas" : "Com Entregas Pendentes"}
              </button>
            ))}
          </div>
          {/* Estilo do mapa */}
          <div className="flex gap-1 border border-slate-200 rounded-lg p-1">
            {(["road", "satellite", "hybrid"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setMapStyle(s)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  mapStyle === s ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {s === "road" ? "🗺 Mapa" : s === "satellite" ? "🛰 Satélite" : "🛰 Híbrido"}
              </button>
            ))}
          </div>
          {/* Camadas de tráfego */}
          <div className="flex gap-2 border-l border-slate-200 pl-4">
            <button
              onClick={() => setShowTraffic((v) => !v)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                showTraffic ? "bg-red-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-current opacity-80" />
              Tráfego
            </button>
            <button
              onClick={() => setShowIncidents((v) => !v)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                showIncidents ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              ⚠ Incidentes
            </button>
          </div>
        </div>
        {/* Legenda tráfego */}
        {showTraffic && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span className="font-medium">Fluxo:</span>
            <span className="flex items-center gap-1"><span className="w-4 h-2 rounded bg-green-500 inline-block" /> Livre</span>
            <span className="flex items-center gap-1"><span className="w-4 h-2 rounded bg-yellow-400 inline-block" /> Moderado</span>
            <span className="flex items-center gap-1"><span className="w-4 h-2 rounded bg-orange-500 inline-block" /> Lento</span>
            <span className="flex items-center gap-1"><span className="w-4 h-2 rounded bg-red-600 inline-block" /> Congestionado</span>
          </div>
        )}
      </div>

      {/* Mapa */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6" style={{ height: "500px" }}>
        {mapReady && (
          <MapContainer center={center} zoom={5} style={{ height: "100%", width: "100%" }}>
            {mapStyle === "road" && (
              <TileLayer
                attribution='&copy; <a href="https://www.tomtom.com" target="_blank">TomTom</a>'
                url={`https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=${process.env.NEXT_PUBLIC_TOMTOM_KEY}&tileSize=256&language=pt-BR`}
              />
            )}
            {mapStyle === "satellite" && (
              <TileLayer
                attribution='&copy; <a href="https://www.tomtom.com" target="_blank">TomTom</a>'
                url={`https://api.tomtom.com/map/1/tile/sat/main/{z}/{x}/{y}.jpg?key=${process.env.NEXT_PUBLIC_TOMTOM_KEY}&tileSize=256`}
              />
            )}
            {mapStyle === "hybrid" && (
              <>
                <TileLayer
                  attribution='&copy; <a href="https://www.tomtom.com" target="_blank">TomTom</a>'
                  url={`https://api.tomtom.com/map/1/tile/sat/main/{z}/{x}/{y}.jpg?key=${process.env.NEXT_PUBLIC_TOMTOM_KEY}&tileSize=256`}
                />
                <TileLayer
                  url={`https://api.tomtom.com/map/1/tile/hybrid/main/{z}/{x}/{y}.png?key=${process.env.NEXT_PUBLIC_TOMTOM_KEY}&tileSize=256&language=pt-BR`}
                />
              </>
            )}
            {showTraffic && (
              <TileLayer
                url={`https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${process.env.NEXT_PUBLIC_TOMTOM_KEY}`}
                opacity={0.7}
              />
            )}
            {showIncidents && (
              <TileLayer
                url={`https://api.tomtom.com/traffic/map/4/tile/incidents/s3/{z}/{x}/{y}.png?key=${process.env.NEXT_PUBLIC_TOMTOM_KEY}`}
                opacity={0.9}
              />
            )}

            {/* Marcadores de clientes */}
            {filteredCustomers.map((customer) => (
              <Marker key={`c-${customer.id}`} position={[customer.latitude!, customer.longitude!]}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold">{customer.name}</p>
                    <p className="text-slate-600">{customer.code}</p>
                    {customer.city && (
                      <p className="text-slate-500">{customer.city}, {customer.state}</p>
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

            {/* Marcadores de motoristas em rota */}
            {activeDriversList.map((driver) => (
              <Marker
                key={`d-${driver.packingListId}`}
                position={[driver.latitude, driver.longitude]}
                icon={getTruckIcon()}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold">🚚 {driver.driverName}</p>
                    <p className="text-slate-600">Romaneio: {driver.code}</p>
                    <p className="text-slate-400 text-xs mt-1">
                      Atualizado às {new Date(driver.timestamp).toLocaleTimeString("pt-BR")}
                    </p>
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
              <div key={customer.id} className="px-4 py-3 flex justify-between items-center hover:bg-slate-50">
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
                  className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
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
