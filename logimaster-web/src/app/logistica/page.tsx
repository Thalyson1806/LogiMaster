"use client";

import { useEffect, useState } from "react";
import { CustomerPendingSummary } from "@/lib/types";
import { customerService, productService, billingRequestService } from "@/lib/services";
import {
  Users,
  Package,
  Truck,
  TrendingUp,
  Upload,
  ArrowRight,
  Clock,
  DollarSign,
  Calendar,
  Filter,
  Building2,
  RefreshCw
} from "lucide-react";

export default function LogisticsDashboard() {
  const [stats, setStats] = useState({
    customers: 0,
    products: 0,
    pendingValue: 0,
    pendingItems: 0,
  });
  const [pendingSummary, setPendingSummary] = useState<CustomerPendingSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    loadStats();
  }, []);

  function getUserPerms(): { role: string; bits: number } {
    try {
      const s = localStorage.getItem("logimaster_user");
      if (s) {
        const u = JSON.parse(s);
        let bits = 0;
        if (u.token) {
          const payload = JSON.parse(atob(u.token.split(".")[1]));
          bits = parseInt(payload["permissions"] ?? "0", 10);
        }
        return { role: u.role ?? "", bits };
      }
    } catch {}
    return { role: "", bits: 0 };
  }

  function hasBit(bits: number, bit: number, role: string) {
    return role === "Administrator" || (bits & bit) !== 0;
  }

  async function loadStats() {
    try {
      setLoading(true);
      const { role, bits } = getUserPerms();

      const canClientes    = hasBit(bits, 1 << 12, role);
      const canProdutos    = hasBit(bits, 1 << 16, role);
      const canFaturamento = hasBit(bits, 1 << 8,  role);

      const [customersRes, productsRes, summaryRes] = await Promise.allSettled([
        canClientes    ? customerService.getAll()                    : Promise.resolve([]),
        canProdutos    ? productService.getAll()                     : Promise.resolve([]),
        canFaturamento ? billingRequestService.getPendingSummary()   : Promise.resolve([]),
      ]);

      const customers = customersRes.status === "fulfilled" ? customersRes.value : [];
      const products  = productsRes.status  === "fulfilled" ? productsRes.value  : [];
      const summary   = summaryRes.status   === "fulfilled" ? summaryRes.value   : [];

      const sortedSummary = [...summary].sort((a, b) => b.totalPendingValue - a.totalPendingValue);
      setPendingSummary(sortedSummary);

      const totalPending = summary.reduce((sum, item) => sum + item.totalPendingValue, 0);
      const totalItems   = summary.reduce((sum, item) => sum + item.totalItems, 0);

      setStats({
        customers: customers.length,
        products: products.length,
        pendingValue: totalPending,
        pendingItems: totalItems,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(value: number): string {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function formatCompactCurrency(value: number): string {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
    return formatCurrency(value);
  }

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
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Dashboard de Expedição</h1>
            <p className="text-slate-500">Visão geral dos pedidos pendentes</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">DE:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm text-slate-700 border-0 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">ATÉ:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-sm text-slate-700 border-0 focus:outline-none"
              />
            </div>
            <button
              onClick={loadStats}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filtrar
            </button>
            <button
              onClick={loadStats}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />Ativo
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.customers}</p>
          <p className="text-sm text-slate-500">Clientes cadastrados</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />Ativo
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.products}</p>
          <p className="text-sm text-slate-500">Produtos cadastrados</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs text-amber-600 font-medium">Pendente</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.pendingItems}</p>
          <p className="text-sm text-slate-500">Itens pendentes</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs text-emerald-100 font-medium">Total</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats.pendingValue)}</p>
          <p className="text-sm text-emerald-100">Valor total pendente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-800">Clientes com Pendências</h2>
                <p className="text-xs text-slate-500">{pendingSummary.length} clientes</p>
              </div>
            </div>
            <a href="/logistica/packing-lists" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </a>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {pendingSummary.length === 0 ? (
              <div className="px-5 py-12 text-center text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-medium">Nenhuma pendência</p>
                <p className="text-sm">Importe um arquivo para ver as pendências</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingSummary.map((customer, index) => (
                  <div key={customer.customerId} className="px-5 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${index < 3 ? 'bg-gradient-to-br from-amber-400 to-amber-500' : 'bg-slate-400'}`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{customer.customerName}</p>
                        <p className="text-xs text-slate-500">{customer.totalItems} itens | {customer.totalPendingQuantity} unidades</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${customer.totalPendingValue > 100000 ? 'text-emerald-600' : customer.totalPendingValue > 50000 ? 'text-blue-600' : 'text-slate-700'}`}>
                        {formatCompactCurrency(customer.totalPendingValue)}
                      </p>
                      <a href="/logistica/packing-lists" className="text-xs text-blue-600 hover:underline">Criar romaneio</a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800">Ações Rápidas</h2>
            </div>
            <div className="p-3 space-y-2">
              <a href="/logistica/billing-requests" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                  <Upload className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800 text-sm">Importar Pedidos</p>
                  <p className="text-xs text-slate-500">Excel ou TXT</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </a>
              <a href="/logistica/packing-lists" className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 transition-colors group">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                  <Truck className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800 text-sm">Criar Romaneio</p>
                  <p className="text-xs text-slate-500">Nova entrega</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </a>
              <a href="/cadastros/customers" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-600 transition-colors">
                  <Users className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800 text-sm">Clientes</p>
                  <p className="text-xs text-slate-500">Gerenciar cadastros</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </a>
              <a href="/cadastros/products" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                  <Package className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800 text-sm">Produtos</p>
                  <p className="text-xs text-slate-500">Gerenciar cadastros</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
              </a>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden text-white">
            <div className="px-5 py-4 border-b border-slate-700">
              <h2 className="font-semibold">Top 5 Maiores Valores</h2>
              <p className="text-xs text-slate-400">Clientes com maior pendência</p>
            </div>
            <div className="p-4 space-y-3">
              {pendingSummary.slice(0, 5).map((customer, index) => (
                <div key={customer.customerId} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded text-xs flex items-center justify-center font-bold ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-amber-700' : 'bg-slate-600'}`}>
                      {index + 1}
                    </span>
                    <span className="text-sm truncate max-w-[120px]" title={customer.customerName}>
                      {customer.customerName}
                    </span>
                  </div>
                  <span className="text-emerald-400 font-semibold text-sm">
                    {formatCompactCurrency(customer.totalPendingValue)}
                  </span>
                </div>
              ))}
              {pendingSummary.length === 0 && (
                <p className="text-center text-slate-500 text-sm py-4">Sem dados</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
