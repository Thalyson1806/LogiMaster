"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Tag,
  AlertTriangle,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Clientes", href: "/customers", icon: Users },
  { name: "Produtos", href: "/products", icon: Package },
  { name: "Embalagens", href: "/packagings", icon: Box },
  { name: "Solicitações", href: "/billing-requests", icon: FileText },
  { name: "Romaneios", href: "/packing-lists", icon: Truck },
  { name: "Expedição", href: "/expedicao", icon: PackageSearch },
  { name: "Etiquetas", href: "/expedicao/etiquetas", icon: Tag },
  { name: "Faturamento", href: "/faturamento", icon: Receipt },
  { name: "EDI", href: "/edi", icon: FileSpreadsheet },   
  { name: "Vínculos Produto", href: "/edi/vinculos", icon: Link2 },
  { name: "Missing Parts", href: "/edi/missing-parts", icon: AlertTriangle },  // ← aqui
  { name: "Armazém", href: "/warehouse", icon: Warehouse },
  { name: "Mapa", href: "/map", icon: MapPin },
];

export default function Sidebar() {
  const pathname = usePathname();

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

      <nav className="flex-1 p-3">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 px-3">Menu</p>
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg mb-1 transition-colors
                ${isActive
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-800 hover:text-white"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-slate-400">MF</span>
          </div>
          <div>
            <p className="text-xs text-slate-300">Usuário</p>
            <p className="text-[10px] text-slate-500">Administrador</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
