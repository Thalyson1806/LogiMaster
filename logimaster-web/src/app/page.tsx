"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Truck, Wrench, DollarSign, Users, Factory, LogOut } from "lucide-react";

const modules = [
  {
    name: "Logística",
    description: "Romaneios, expedição, faturamento e EDI",
    href: "/logistica",
    icon: Truck,
    active: true,
  },
  {
    name: "Cadastros",
    description: "Clientes, produtos e embalagens",
    href: "/cadastros/customers",
    icon: Users,
    active: true,
  },
  {
    name: "Produção",
    description: "OEE, apontamentos e ordens de produção",
    href: "/producao",
    icon: Wrench,
    active: false,
  },
  {
    name: "Financeiro",
    description: "Contas a pagar, receber e fluxo de caixa",
    href: "/financeiro",
    icon: DollarSign,
    active: false,
  },
];

export default function HubPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const s = localStorage.getItem("logimaster_user");
    if (!s) {
      router.replace("/login");
      return;
    }
    try {
      const u = JSON.parse(s);
      if (!u?.token) {
        router.replace("/login");
      } else {
        setUserName(u.name || u.email || "Usuário");
        setChecked(true);
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("logimaster_user");
    router.replace("/login");
  }

  if (!checked) return null;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8">
      {/* Header com user info */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <span className="text-sm text-slate-400">{userName}</span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair
        </button>
      </div>

      <div className="mb-12 text-center">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Factory className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Metalúrgica Formigari</h1>
        <p className="text-slate-400">Selecione o módulo que deseja acessar</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
        {modules.map((mod) => {
          const Icon = mod.icon;
          if (!mod.active) {
            return (
              <div
                key={mod.name}
                className="relative bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 opacity-40 cursor-not-allowed"
              >
                <div className="w-11 h-11 bg-slate-700 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-slate-500" />
                </div>
                <h2 className="text-base font-semibold text-slate-400 mb-1">{mod.name}</h2>
                <p className="text-sm text-slate-600">{mod.description}</p>
                <span className="absolute top-4 right-4 text-[10px] bg-slate-700 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Em breve
                </span>
              </div>
            );
          }
          return (
            <Link
              key={mod.name}
              href={mod.href}
              className="group bg-slate-800 border border-slate-700 hover:border-blue-500 rounded-2xl p-6 transition-all hover:shadow-xl hover:shadow-blue-500/10 hover:bg-slate-750"
            >
              <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-base font-semibold text-white mb-1">{mod.name}</h2>
              <p className="text-sm text-slate-400">{mod.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
