"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/store/dashboard-store";
import { Badge } from "@/components/ui/badge";

const SHIFT_S: Record<string, { label: string; emoji: string; color: string; bg: string; border: string }> = {
  MANANA: { label: "Mañana", emoji: "☀️", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  TARDE:  { label: "Tarde",  emoji: "🌤️", color: "text-blue-400",  bg: "bg-blue-500/10",  border: "border-blue-500/30" },
  NOCHE:  { label: "Noche",  emoji: "🌙", color: "text-violet-400",bg: "bg-violet-500/10",border: "border-violet-500/30" },
};

export default function DashboardPage() {
  const { kpis, recentSales, stockAlerts, activeShift, loaded, fetchAll } = useDashboardStore();

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (!loaded) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  const ss = SHIFT_S[activeShift?.shift_type || ""] || SHIFT_S["MANANA"];
  const transferencias = kpis.ventas_del_dia - kpis.efectivo_en_caja;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-500 text-sm">Resumen del día — {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        {activeShift ? (
          <Badge className={`${ss.bg} ${ss.color} border ${ss.border} px-3 py-1.5 text-sm font-semibold`}>
            {ss.emoji} Turno {ss.label}
          </Badge>
        ) : (
          <Badge className="bg-slate-800 text-slate-500 border border-white/[0.06] px-3 py-1.5 text-sm">
            Sin turno activo
          </Badge>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Ventas del Día", value: `$${kpis.ventas_del_dia.toLocaleString()}`, color: "text-emerald-400", accent: "border-emerald-500/20 bg-emerald-500/5" },
          { label: "Efectivo en Caja", value: `$${kpis.efectivo_en_caja.toLocaleString()}`, color: "text-amber-400", accent: "border-amber-500/20 bg-amber-500/5" },
          { label: "Transferencias", value: `$${transferencias.toLocaleString()}`, color: "text-blue-400", accent: "border-blue-500/20 bg-blue-500/5" },
          { label: "Alertas Stock", value: stockAlerts.length.toString(), color: stockAlerts.length > 0 ? "text-red-400" : "text-slate-400", accent: stockAlerts.length > 0 ? "border-red-500/20 bg-red-500/5" : "border-white/[0.06] bg-white/[0.02]" },
        ].map((kpi, i) => (
          <div key={i} className={`rounded-2xl border p-5 ${kpi.accent}`}>
            <p className="text-slate-500 text-xs font-medium mb-2">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Sales */}
        <div className="lg:col-span-2 bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/[0.06]">
            <h2 className="text-white font-bold">Ventas Recientes</h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {recentSales.length === 0 ? (
              <div className="p-8 text-center text-slate-600 text-sm">No hay ventas registradas hoy.</div>
            ) : (
              recentSales.slice(0, 8).map(sale => (
                <div key={sale.id} className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">
                      {sale.items.map(i => `${i.quantity > 1 ? `${i.quantity}x ` : ''}${i.format_name}`).join(' + ')}
                    </p>
                    <p className="text-slate-600 text-xs truncate mt-0.5">
                      {sale.items.flatMap(i => i.flavors).join(' · ')}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-emerald-400 font-bold text-sm">${sale.total.toLocaleString()}</p>
                    <p className="text-slate-600 text-[10px]">
                      {sale.payment_method === "EFECTIVO" ? "💵" : "📱"}{" "}
                      {new Date(sale.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/[0.06]">
            <h2 className="text-white font-bold">Alertas de Stock</h2>
          </div>
          <div className="p-3 space-y-2">
            {stockAlerts.length === 0 ? (
              <div className="p-6 text-center">
                <span className="text-3xl opacity-30 block mb-2">✅</span>
                <p className="text-slate-600 text-sm">Todo el stock está en orden.</p>
              </div>
            ) : (
              stockAlerts.map(item => (
                <div key={item.id} className="bg-red-500/5 border border-red-500/15 rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <p className="text-white text-sm font-medium">{item.name}</p>
                    <span className="text-red-400 text-xs font-bold">{item.current_stock} / {item.min_stock}</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, (item.current_stock / item.min_stock) * 100)}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
