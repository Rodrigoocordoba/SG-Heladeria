"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";

const navItems = [
  {
    title: "Punto de Venta",
    href: "/pos",
    iconColor: "text-blue-400",
    activeBg: "bg-blue-500/10 border-blue-500/30",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
      </svg>
    ),
  },
  {
    title: "Dashboard",
    href: "/dashboard",
    iconColor: "text-emerald-400",
    activeBg: "bg-emerald-500/10 border-emerald-500/30",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
      </svg>
    ),
  },
  {
    title: "Inventario",
    href: "/inventario",
    iconColor: "text-amber-400",
    activeBg: "bg-amber-500/10 border-amber-500/30",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
        <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
      </svg>
    ),
  },
  {
    title: "Turnos",
    href: "/turnos",
    iconColor: "text-violet-400",
    activeBg: "bg-violet-500/10 border-violet-500/30",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Toaster position="top-right" />
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/80 border-r border-white/[0.06] flex flex-col shrink-0">
        {/* Logo */}
        <Link href="/home" className="flex items-center gap-3 px-6 py-5 border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-blue-500/25">
            SG
          </div>
          <span className="text-slate-300 text-sm font-semibold tracking-wide">Heladería</span>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                  transition-all duration-200 border border-transparent
                  ${isActive
                    ? `${item.activeBg} text-white`
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }
                `}
              >
                <span className={isActive ? item.iconColor : 'text-slate-500'}>
                  {item.icon}
                </span>
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.06]">
          <p className="text-slate-600 text-xs text-center">v2.0 — Doble Velocidad</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
