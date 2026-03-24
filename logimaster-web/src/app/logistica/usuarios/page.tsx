"use client";

import { useState, useEffect } from "react";
import { UserCog, Plus, Pencil, Trash2, KeyRound, CheckCircle, XCircle, X, Search, ShieldCheck } from "lucide-react";
import { BASE_URL } from "@/lib/api";

type UserRole = "Administrator" | "LogisticsAnalyst" | "Shipping" | "Invoicing" | "Viewer" | "Driver";

interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  roleName: string;
  employeeId: string | null;
  department: string | null;
  isActive: boolean;
  lastAccessAt: string | null;
  createdAt: string;
  permissions: number;
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "Administrator",    label: "Administrador"        },
  { value: "LogisticsAnalyst", label: "Analista de Logística" },
  { value: "Shipping",         label: "Expedição"            },
  { value: "Invoicing",        label: "Faturamento"          },
  { value: "Viewer",           label: "Visualizador"         },
  { value: "Driver",           label: "Motorista"            },
];

// Mirrors AppModule.cs exactly
const MODULES: {
  label: string;
  view: number;
  create?: number;
  edit?: number;
  del?: number;
}[] = [
  { label: "Romaneios",   view: 1 << 0,  create: 1 << 1,  edit: 1 << 2,  del: 1 << 3  },
  { label: "EDI",         view: 1 << 4,  create: 1 << 5,  edit: 1 << 6,  del: 1 << 7  },
  { label: "Faturamento", view: 1 << 8,  create: 1 << 9,  edit: 1 << 10, del: 1 << 11 },
  { label: "Clientes",    view: 1 << 12, create: 1 << 13, edit: 1 << 14, del: 1 << 15 },
  { label: "Produtos",    view: 1 << 16, create: 1 << 17, edit: 1 << 18, del: 1 << 19 },
  { label: "Estoque",     view: 1 << 20, create: 1 << 21,                del: 1 << 22 },
  { label: "Mapa",        view: 1 << 24 },
  { label: "Email",       view: 1 << 28 },
];

function getAuthHeader() {
  try {
    const s = localStorage.getItem("logimaster_user");
    if (s) {
      const token = JSON.parse(s).token;
      if (token) return { Authorization: `Bearer ${token}` };
    }
  } catch {}
  return {};
}

async function apiUsers(path: string, method = "GET", body?: unknown) {
  const res = await fetch(`${BASE_URL}/api/users${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Erro ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

const emptyForm = { name: "", email: "", password: "", role: "Viewer" as UserRole, employeeId: "", department: "" };

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [passwordModal, setPasswordModal] = useState<{ id: number; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  // Permissions modal
  const [permModal, setPermModal] = useState<{ id: number; name: string; role: UserRole } | null>(null);
  const [permBits, setPermBits] = useState(0);
  const [savingPerm, setSavingPerm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await apiUsers("");
      setUsers(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.employeeId ?? "").includes(search)
  );

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEdit(u: User) {
    setEditingId(u.id);
    setForm({ name: u.name, email: u.email, password: "", role: u.role, employeeId: u.employeeId ?? "", department: u.department ?? "" });
    setError("");
    setShowForm(true);
  }

  function openPermissions(u: User) {
    setPermModal({ id: u.id, name: u.name, role: u.role });
    setPermBits(u.permissions ?? 0);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) { setError("Nome e e-mail são obrigatórios"); return; }
    if (!editingId && !form.password.trim()) { setError("Senha é obrigatória para novo usuário"); return; }
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        const updated = await apiUsers(`/${editingId}`, "PUT", {
          name: form.name, role: form.role,
          employeeId: form.employeeId || null,
          department: form.department || null,
        });
        setUsers(prev => prev.map(u => u.id === editingId ? updated : u));
      } else {
        const created = await apiUsers("", "POST", {
          name: form.name, email: form.email, password: form.password,
          role: form.role,
          employeeId: form.employeeId || null,
          department: form.department || null,
        });
        setUsers(prev => [...prev, created]);
      }
      setShowForm(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(u: User) {
    try {
      if (u.isActive) {
        await apiUsers(`/${u.id}`, "DELETE");
        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isActive: false } : x));
      } else {
        await apiUsers(`/${u.id}/activate`, "POST");
        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isActive: true } : x));
      }
    } catch (e: any) {
      alert("Erro: " + e.message);
    }
  }

  async function handleResetPassword() {
    if (!newPassword.trim() || !passwordModal) return;
    setSavingPw(true);
    try {
      await apiUsers(`/${passwordModal.id}/password`, "PUT", { newPassword });
      setPasswordModal(null);
      setNewPassword("");
    } catch (e: any) {
      alert("Erro: " + e.message);
    } finally {
      setSavingPw(false);
    }
  }

  async function handleSavePermissions() {
    if (!permModal) return;
    setSavingPerm(true);
    try {
      const updated = await apiUsers(`/${permModal.id}/permissions`, "PUT", { permissions: permBits });
      setUsers(prev => prev.map(u => u.id === permModal.id ? updated : u));
      setPermModal(null);
    } catch (e: any) {
      alert("Erro: " + e.message);
    } finally {
      setSavingPerm(false);
    }
  }

  function toggleBit(bit: number) {
    setPermBits(prev => prev ^ bit);
  }

  function hasBit(bit: number) {
    return (permBits & bit) !== 0;
  }

  function toggleModule(mod: typeof MODULES[number]) {
    const bits = [mod.view, mod.create, mod.edit, mod.del].filter((b): b is number => b !== undefined);
    const allSet = bits.every(b => hasBit(b));
    if (allSet) {
      setPermBits(prev => bits.reduce((acc, b) => acc & ~b, prev));
    } else {
      setPermBits(prev => bits.reduce((acc, b) => acc | b, prev));
    }
  }

  function markAll() {
    const allBits = MODULES.reduce((acc, m) => {
      const bits = [m.view, m.create, m.edit, m.del].filter((b): b is number => b !== undefined);
      return bits.reduce((a, b) => a | b, acc);
    }, 0);
    setPermBits(allBits);
  }

  function clearAll() {
    setPermBits(0);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <UserCog className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Usuários</h1>
            <p className="text-sm text-slate-500">{users.length} cadastrado{users.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Usuário
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou RE..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">E-mail</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Cargo</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">RE</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Último acesso</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  <UserCog className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium">Nenhum usuário encontrado</p>
                  <p className="text-sm">Crie um novo usuário para começar</p>
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${!u.isActive ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{u.name}</p>
                    {u.department && <p className="text-xs text-slate-400">{u.department}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-medium">{u.roleName}</span>
                  </td>
                  <td className="px-4 py-3">
                    {u.employeeId
                      ? <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{u.employeeId}</span>
                      : <span className="text-slate-400">—</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    {u.isActive
                      ? <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium"><CheckCircle className="w-3.5 h-3.5" /> Ativo</span>
                      : <span className="flex items-center gap-1 text-red-500 text-xs font-medium"><XCircle className="w-3.5 h-3.5" /> Inativo</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {u.lastAccessAt ? new Date(u.lastAccessAt).toLocaleString("pt-BR") : "Nunca"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openPermissions(u)}
                      title="Permissões"
                      className={`p-2 rounded-lg transition-colors ${u.permissions ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:bg-slate-100"}`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                    </button>
                    <button onClick={() => openEdit(u)} title="Editar" className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setPasswordModal({ id: u.id, name: u.name }); setNewPassword(""); }} title="Redefinir senha" className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                      <KeyRound className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(u)}
                      title={u.isActive ? "Desativar" : "Ativar"}
                      className={`p-2 rounded-lg transition-colors ${u.isActive ? "text-slate-500 hover:text-red-600 hover:bg-red-50" : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"}`}
                    >
                      {u.isActive ? <Trash2 className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal criar/editar */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UserCog className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="font-semibold text-slate-800">
                  {editingId ? "Editar Usuário" : "Novo Usuário"}
                </h2>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Nome completo *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nome do usuário"
                  />
                </div>
                {!editingId && (
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">E-mail *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="usuario@empresa.com"
                    />
                  </div>
                )}
                {!editingId && (
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">Senha *</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Cargo *</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(p => ({ ...p, role: e.target.value as UserRole }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">RE / Chapa</label>
                  <input
                    value={form.employeeId}
                    onChange={e => setForm(p => ({ ...p, employeeId: e.target.value }))}
                    placeholder="Ex: 139"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Departamento</label>
                  <input
                    value={form.department}
                    onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                    placeholder="Ex: Logística"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Criar usuário"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal redefinir senha */}
      {passwordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                </div>
                <h2 className="font-semibold text-slate-800">Redefinir Senha</h2>
              </div>
              <button onClick={() => setPasswordModal(null)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-slate-500">
                Definir nova senha para <strong className="text-slate-700">{passwordModal.name}</strong>
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Nova senha</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex gap-3">
              <button onClick={() => setPasswordModal(null)} className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleResetPassword}
                disabled={savingPw || !newPassword.trim()}
                className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {savingPw ? "Salvando..." : "Redefinir senha"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal permissões */}
      {permModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800">Permissões de Acesso</h2>
                  <p className="text-xs text-slate-500">{permModal.name}</p>
                </div>
              </div>
              <button onClick={() => setPermModal(null)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {permModal.role === "Administrator" && (
                <div className="mb-4 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                  Administradores têm acesso total independente das permissões abaixo.
                </div>
              )}

              <div className="flex gap-2 mb-4">
                <button
                  onClick={markAll}
                  className="text-xs border border-slate-300 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Marcar todos
                </button>
                <button
                  onClick={clearAll}
                  className="text-xs border border-slate-300 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Limpar todos
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600 w-32">Módulo</th>
                      <th className="text-center px-2 py-2 text-xs font-semibold text-slate-600">Visualizar</th>
                      <th className="text-center px-2 py-2 text-xs font-semibold text-slate-600">Criar</th>
                      <th className="text-center px-2 py-2 text-xs font-semibold text-slate-600">Editar</th>
                      <th className="text-center px-2 py-2 text-xs font-semibold text-slate-600">Excluir</th>
                      <th className="text-center px-2 py-2 text-xs font-semibold text-slate-600">Todos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {MODULES.map((mod) => {
                      const bits = [mod.view, mod.create, mod.edit, mod.del].filter((b): b is number => b !== undefined);
                      const allSet = bits.every(b => hasBit(b));
                      const someSet = bits.some(b => hasBit(b));
                      return (
                        <tr key={mod.label} className="hover:bg-slate-50">
                          <td className="px-3 py-2.5 text-slate-700 font-medium text-xs">{mod.label}</td>
                          <td className="text-center px-2 py-2.5">
                            <input
                              type="checkbox"
                              checked={hasBit(mod.view)}
                              onChange={() => toggleBit(mod.view)}
                              className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                            />
                          </td>
                          <td className="text-center px-2 py-2.5">
                            {mod.create !== undefined ? (
                              <input
                                type="checkbox"
                                checked={hasBit(mod.create)}
                                onChange={() => toggleBit(mod.create!)}
                                className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                              />
                            ) : <span className="text-slate-200">—</span>}
                          </td>
                          <td className="text-center px-2 py-2.5">
                            {mod.edit !== undefined ? (
                              <input
                                type="checkbox"
                                checked={hasBit(mod.edit)}
                                onChange={() => toggleBit(mod.edit!)}
                                className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                              />
                            ) : <span className="text-slate-200">—</span>}
                          </td>
                          <td className="text-center px-2 py-2.5">
                            {mod.del !== undefined ? (
                              <input
                                type="checkbox"
                                checked={hasBit(mod.del)}
                                onChange={() => toggleBit(mod.del!)}
                                className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                              />
                            ) : <span className="text-slate-200">—</span>}
                          </td>
                          <td className="text-center px-2 py-2.5">
                            <input
                              type="checkbox"
                              checked={allSet}
                              ref={el => { if (el) el.indeterminate = someSet && !allSet; }}
                              onChange={() => toggleModule(mod)}
                              className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-200 flex gap-3 flex-shrink-0">
              <button onClick={() => setPermModal(null)} className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={savingPerm}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {savingPerm ? "Salvando..." : "Salvar permissões"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
