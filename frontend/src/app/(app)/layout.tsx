"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { ShoppingCart, BarChart3, Package, Clock, Settings, ClipboardList } from "lucide-react";

const navItems = [
  {
    title: "Punto de Venta",
    href: "/pos",
    icon: ShoppingCart,
  },
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
  },
  {
    title: "Inventario",
    href: "/inventario",
    icon: Package,
  },
  {
    title: "Turnos",
    href: "/turnos",
    icon: Clock,
  },
  {
    title: "Administración",
    href: "/admin",
    icon: Settings,
  },
  {
    title: "Realizar Pedido",
    href: "/pedido",
    icon: ClipboardList,
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-[oklch(0.13_0.005_260)]">
      <Toaster position="top-right" theme="dark" />
      
      {/* Sidebar */}
      <aside className="w-60 bg-[oklch(0.15_0.005_260)] border-r border-white/[0.06] flex flex-col shrink-0">
        {/* Logo */}
        <Link href="/home" className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors">
          <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center text-white text-xs font-bold tracking-tight">
            SG
          </div>
          <div className="flex flex-col">
            <span className="text-zinc-200 text-sm font-semibold leading-tight">SG Heladería</span>
            <span className="text-zinc-600 text-[10px] font-medium">Sistema de Gestión</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-0.5 mt-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium
                  transition-colors duration-150
                  ${isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border-l-2 border-indigo-500 ml-0 pl-[10px]'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
                  }
                `}
              >
                <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.06]">
          <p className="text-zinc-700 text-[10px] text-center font-medium tracking-wide uppercase">v2.0 · Doble Velocidad</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
