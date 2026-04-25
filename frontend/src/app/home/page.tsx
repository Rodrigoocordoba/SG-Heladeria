"use client";

import Link from "next/link";
import { useState } from "react";

const navCards = [
  {
    title: "Punto de Venta",
    description: "Registrar ventas rápidas",
    href: "/pos",
    accent: "from-blue-500/20 to-blue-600/10",
    border: "hover:border-blue-500/50",
    glow: "hover:shadow-blue-500/20",
    iconColor: "text-blue-400",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
      </svg>
    ),
  },
  {
    title: "Dashboard",
    description: "KPIs y métricas del día",
    href: "/dashboard",
    accent: "from-emerald-500/20 to-emerald-600/10",
    border: "hover:border-emerald-500/50",
    glow: "hover:shadow-emerald-500/20",
    iconColor: "text-emerald-400",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
      </svg>
    ),
  },
  {
    title: "Inventario",
    description: "Stock de envases e insumos",
    href: "/inventario",
    accent: "from-amber-500/20 to-amber-600/10",
    border: "hover:border-amber-500/50",
    glow: "hover:shadow-amber-500/20",
    iconColor: "text-amber-400",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
        <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
      </svg>
    ),
  },
  {
    title: "Turnos",
    description: "Pesaje y control operativo",
    href: "/turnos",
    accent: "from-violet-500/20 to-violet-600/10",
    border: "hover:border-violet-500/50",
    glow: "hover:shadow-violet-500/20",
    iconColor: "text-violet-400",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
];

export default function HomePage() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      
      {/* Animated background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Content */}
      <div className="relative z-10 text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-blue-500/25">
            SG
          </div>
          <span className="text-slate-500 text-lg font-medium tracking-wider uppercase">Heladería</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-3">
          Bienvenido
        </h1>
        <p className="text-slate-400 text-lg max-w-md mx-auto">
          Seleccione un módulo para comenzar a trabajar.
        </p>
      </div>

      {/* Navigation Grid */}
      <div className="relative z-10 grid grid-cols-2 gap-5 w-full max-w-lg">
        {navCards.map((card, index) => (
          <Link
            key={index}
            href={card.href}
            className={`
              group relative flex flex-col items-center justify-center gap-4 
              p-8 rounded-2xl 
              bg-white/[0.03] backdrop-blur-sm
              border border-white/[0.06] 
              ${card.border} ${card.glow}
              hover:shadow-2xl
              hover:bg-white/[0.06]
              hover:-translate-y-2 hover:scale-[1.02]
              active:scale-[0.98]
              transition-all duration-300 ease-out
              cursor-pointer
            `}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Gradient background on hover */}
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${card.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            
            {/* Icon */}
            <div className={`relative z-10 ${card.iconColor} transition-transform duration-300 group-hover:scale-110`}>
              {card.icon}
            </div>

            {/* Text */}
            <div className="relative z-10 text-center">
              <h2 className="text-white font-semibold text-lg group-hover:text-white transition-colors">
                {card.title}
              </h2>
              <p className="text-slate-500 text-xs mt-1 group-hover:text-slate-300 transition-colors">
                {card.description}
              </p>
            </div>

            {/* Arrow indicator on hover */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <p className="relative z-10 text-slate-600 text-xs mt-12 tracking-wide">
        SG Heladería v2.0 — Sistema de Gestión
      </p>
    </div>
  );
}
