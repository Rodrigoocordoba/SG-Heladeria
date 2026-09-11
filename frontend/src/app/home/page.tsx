"use client";

import Link from "next/link";
import { ShoppingCart, BarChart3, Package, Clock, ArrowRight } from "lucide-react";

const navCards = [
  {
    title: "Punto de Venta",
    description: "Registrar ventas rápidas",
    href: "/pos",
    icon: ShoppingCart,
  },
  {
    title: "Dashboard",
    description: "KPIs y métricas del día",
    href: "/dashboard",
    icon: BarChart3,
  },
  {
    title: "Inventario",
    description: "Stock de envases e insumos",
    href: "/inventario",
    icon: Package,
  },
  {
    title: "Turnos",
    description: "Pesaje y control operativo",
    href: "/turnos",
    icon: Clock,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[oklch(0.13_0.005_260)] flex flex-col items-center justify-center px-6">
      {/* Content */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm font-bold tracking-tight">
            SG
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold text-zinc-100 tracking-tight mb-2">
          Sistema de Gestión
        </h1>
        <p className="text-zinc-500 text-sm max-w-sm mx-auto">
          Seleccione un módulo para comenzar a trabajar.
        </p>
      </div>

      {/* Navigation Grid */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
        {navCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Link
              key={index}
              href={card.href}
              className="
                group relative flex flex-col items-start gap-4
                p-6 rounded-lg
                bg-white/[0.03]
                border border-white/[0.06]
                hover:border-indigo-500/40
                hover:bg-indigo-500/[0.04]
                transition-all duration-200
                cursor-pointer
              "
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-md bg-zinc-800/80 border border-white/[0.06] flex items-center justify-center text-zinc-400 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-colors">
                <Icon size={20} strokeWidth={1.5} />
              </div>

              {/* Text */}
              <div>
                <h2 className="text-zinc-200 font-medium text-sm group-hover:text-white transition-colors">
                  {card.title}
                </h2>
                <p className="text-zinc-600 text-xs mt-0.5">
                  {card.description}
                </p>
              </div>

              {/* Arrow indicator */}
              <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <ArrowRight size={14} className="text-zinc-500" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <p className="text-zinc-700 text-[11px] mt-10 tracking-wide font-medium">
        SG Heladería v2.0
      </p>
    </div>
  );
}
