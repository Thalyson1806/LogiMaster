"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Truck,
  Factory,
  Box,
  PackageSearch,
  Receipt,
  FileSpreadsheet,
  MapPin,
  Warehouse,
  Link2,
  ChevronRight,
  ArrowLeft,
  Tag,
  AlertTriangle,
  BarChart3,
  LogOut,
  UserCog,
} from "lucide-react";
import { can, Role, Resource } from "@/lib/permissions";

type ChildItem = { name: string; href: string; icon: React.ElementType; resource?: Resource };
type MenuItem = { name: string; href: string; icon: React.ElementType; children?: ChildItem[]; resource?: Resource };
type MenuGroup = { label: string; items: MenuItem[]; resource?: Resource };

const menuGroups: MenuGroup[] = [
  {
    label: "Geral",
    items: [{ name: "Dashboard", href: "/logistica", icon: LayoutDashboard }],
  },
  {
    label: "Cadastros",
    items: [
      { name: "Clientes",   href: "/cadastros/customers",  icon: Users,    resource: "clientes"   },
      { name: "Produtos",   href: "/cadastros/products",   icon: Package,  resource: "produtos"   },
      { name: "Embalagens", href: "/cadastros/packagings", icon: Box,      resource: "embalagens" },
    ],
  },
  {
    label: "Operacional",
    items: [
      { name: "Solicitações", href: "/logistica/billing-requests", icon: FileText,     resource: "solicitacoes" },
      { name: "Romaneios",    href: "/logistica/packing-lists",    icon: Truck,        resource: "romaneios"    },
      {
        name: "Expedição", href: "/logistica/expedicao", icon: PackageSearch, resource: "expedicao",
        children: [
          { name: "Etiquetas", href: "/logistica/expedicao/etiquetas", icon: Tag, resource: "expedicao" },
        ],
      },
      { name: "Faturamento", href: "/logistica/faturamento", icon: Receipt,  resource: "faturamento" },
      { name: "Estoque",     href: "/logistica/estoque",     icon: BarChart3, resource: "estoque"    },
    ],
  },
  {
    label: "EDI",
    resource: "edi",
    items: [
      { name: "Importação",      href: "/logistica/edi",               icon: FileSpreadsheet, resource: "edi" },
      { name: "Vínculos Produto",href: "/logistica/edi/vinculos",      icon: Link2,           resource: "edi" },
      { name: "Missing Parts",   href: "/logistica/edi/missing-parts", icon: AlertTriangle,   resource: "edi" },
    ],
  },
  {
    label: "Armazém",
    items: [
      { name: "Localizações", href: "/logistica/warehouse", icon: Warehouse, resource: "warehouse" },
      { name: "Mapa",         href: "/logistica/map",       icon: MapPin,    resource: "mapa"      },
    ],
  },
  {
    label: "Administração",
    items: [
      { name: "Usuários", href: "/logistica/usuarios", icon: UserCog, resource: "usuarios" },
    ],
  },
];

export default function LogisticsSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [userName, setUserName] = useState("Usuário");
  const [userRole, setUserRole] = useState("Operador");
  const [role, setRole] = useState<Role>("Viewer");

  useEffect(() => {
    try {
      const s = localStorage.getItem("logimaster_user");
      if (s) {
        const u = JSON.parse(s);
        if (u.name) setUserName(u.name);
        if (u.roleName) setUserRole(u.roleName);
        if (u.role) setRole(u.role as Role);
      }
    } catch {}
  }, []);

  function handleLogout() {
    localStorage.removeItem("logimaster_user");
    router.replace("/login");
  }

  function toggleSection(label: string) {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  function isGroupActive(items: MenuItem[]) {
    return items.some(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    );
  }

  function canView(resource?: Resource) {
    if (!resource) return true;
    return can(role, resource, "view");
  }

  return (
    <aside className="w-60 bg-slate-900 text-slate-300 min-h-screen flex flex-col">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Factory className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">Logística</h1>
            <p className="text-[10px] text-slate-500">Metalúrgica Formigari</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        {menuGroups.map((group) => {
          // filtrar itens que o usuário pode ver
          const visibleItems = group.items.filter(item => canView(item.resource));
          // se o grupo tem resource próprio e não tem acesso, ou não sobrou nenhum item, esconde o grupo
          if (visibleItems.length === 0) return null;
          if (group.resource && !canView(group.resource)) return null;

          const isOpen = !collapsed[group.label];
          const groupActive = isGroupActive(visibleItems);

          if (group.label === "Geral") {
            const item = visibleItems[0];
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg mb-2 transition-colors ${
                  isActive ? "bg-blue-600 text-white" : "hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          }

          return (
            <div key={group.label} className="mb-1">
              <button
                onClick={() => toggleSection(group.label)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${
                  groupActive && !isOpen ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {group.label}
                <ChevronRight className={`w-3 h-3 transition-transform ${isOpen ? "rotate-90" : ""}`} />
              </button>

              {isOpen && (
                <div className="mt-0.5 mb-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <div key={item.href}>
                        <Link
                          href={item.href}
                          className={`flex items-center gap-3 pl-5 pr-3 py-2 text-sm rounded-lg mb-0.5 transition-colors ${
                            isActive ? "bg-blue-600 text-white" : "hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {item.name}
                        </Link>
                        {item.children && isActive && (
                          <div className="ml-2 mb-1">
                            {item.children
                              .filter(child => canView(child.resource))
                              .map((child) => {
                                const ChildIcon = child.icon;
                                const childActive = pathname === child.href || pathname.startsWith(child.href + "/");
                                return (
                                  <Link
                                    key={child.href}
                                    href={child.href}
                                    className={`flex items-center gap-2 pl-7 pr-3 py-1.5 text-xs rounded-lg mb-0.5 transition-colors ${
                                      childActive
                                        ? "bg-blue-500 text-white"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                    }`}
                                  >
                                    <ChildIcon className="w-3 h-3" />
                                    {child.name}
                                  </Link>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Voltar aos Módulos
        </Link>
      </div>

      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
          <div className="w-7 h-7 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-slate-400">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-300 truncate">{userName}</p>
            <p className="text-[10px] text-slate-500 truncate">{userRole}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair
        </button>
      </div>
    </aside>
  );
}
