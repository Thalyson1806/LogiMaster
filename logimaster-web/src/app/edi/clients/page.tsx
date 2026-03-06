"use client";

import { useEffect, useState } from "react";
import { EdiClient, EdiClientInput, Customer } from "@/lib/types";
import { ediClientService, customerService } from "@/lib/services";
import {
  Building2,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  FileSpreadsheet,
  Link2,
  Hash,
} from "lucide-react";

export default function EdiClientsPage() {
  const [clients, setClients] = useState<EdiClient[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredClients, setFilteredClients] = useState<EdiClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<EdiClient | null>(null);
  const [formData, setFormData] = useState<EdiClientInput>({ code: "", name: "" });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (search) {
      const s = search.toLowerCase();
      const filtered = clients.filter(
        (c) =>
          c.code.toLowerCase().includes(s) ||
          c.name.toLowerCase().includes(s) ||
          c.ediCode?.toLowerCase().includes(s) ||
          c.customerName?.toLowerCase().includes(s)
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients(clients);
    }
  }, [search, clients]);

  async function loadData() {
    try {
      setLoading(true);
      const [clientsData, customersData] = await Promise.all([
        ediClientService.getAll(),
        customerService.getAll(),
      ]);
      setClients(clientsData);
      setFilteredClients(clientsData);
      setCustomers(customersData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleNew() {
    setEditingClient(null);
    setFormData({ code: "", name: "", fileType: "xlsx" });
    setShowModal(true);
  }

  function handleEdit(client: EdiClient) {
    setEditingClient(client);
    setFormData({
      code: client.code,
      name: client.name,
      description: client.description,
      ediCode: client.ediCode,
      customerId: client.customerId,
      fileType: client.fileType,
    });
    setShowModal(true);
  }

  async function handleSave() {
    try {
      setSaving(true);
      if (editingClient) {
        const { code, ...updateData } = formData;
        await ediClientService.update(editingClient.id, updateData);
      } else {
        await ediClientService.create(formData);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(client: EdiClient) {
    if (!confirm(`Excluir cliente EDI ${client.name}?`)) return;
    try {
      await ediClientService.delete(client.id);
      loadData();
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
            <Building2 className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Clientes EDI</h1>
            <p className="text-sm text-slate-500">{clients.length} cadastrados</p>
          </div>
        </div>
        <button
          onClick={handleNew}
          className="bg-teal-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente EDI
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código, nome, código EDI ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
              <th className="text-left px-4 py-3 font-medium text-slate-600">Código EDI (CNPJ)</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Cliente Vinculado</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Tipo</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Rotas</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Produtos</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                  <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium">Nenhum cliente EDI encontrado</p>
                  <p className="text-sm">Cadastre um novo cliente para começar</p>
                </td>
              </tr>
            ) : (
              filteredClients.map((client) => (
                <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{client.code}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{client.name}</p>
                    {client.description && (
                      <p className="text-xs text-slate-500 truncate max-w-[200px]">{client.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {client.ediCode ? (
                      <span className="font-mono text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded">
                        {client.ediCode}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {client.customerName ? (
                      <span className="flex items-center gap-1 text-slate-700">
                        <Link2 className="w-3 h-3 text-teal-500" />
                        {client.customerName}
                      </span>
                    ) : (
                      <span className="text-amber-500 text-xs">Não vinculado</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded uppercase">
                      {client.fileType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600">{client.routesCount}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{client.productsCount}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleEdit(client)}
                      className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(client)}
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
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                </div>
                <h2 className="font-semibold text-slate-800">
                  {editingClient ? "Editar Cliente EDI" : "Novo Cliente EDI"}
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
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    disabled={!!editingClient}
                    placeholder="Ex: POLIMETRI"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Nome *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Nome do cliente"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Descrição</label>
                <input
                  type="text"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Descrição opcional"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    <span className="flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      Código EDI (CNPJ)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.ediCode || ""}
                    onChange={(e) => setFormData({ ...formData, ediCode: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Ex: 50188150000149"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">CNPJ do emissor na SAWLUZ</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Tipo de Arquivo</label>
                  <select
                    value={formData.fileType || "xlsx"}
                    onChange={(e) => setFormData({ ...formData, fileType: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="xlsx">XLSX</option>
                    <option value="xls">XLS</option>
                    <option value="csv">CSV</option>
                    <option value="edi">EDI</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Link2 className="w-3 h-3" />
                    Cliente Vinculado
                  </span>
                </label>
                <select
                  value={formData.customerId || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, customerId: e.target.value ? Number(e.target.value) : undefined })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">-- Selecione um cliente --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Vincula este cliente EDI a um cliente do sistema para importação automática
                </p>
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
                disabled={saving || !formData.code || !formData.name}
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
