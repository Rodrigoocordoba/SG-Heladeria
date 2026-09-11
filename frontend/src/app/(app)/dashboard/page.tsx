"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/store/dashboard-store";
import { DollarSign, Banknote, ArrowRightLeft, AlertCircle, CheckCircle2 } from "lucide-react";

const SHIFT_LABELS: Record<string, string> = {
  MANANA: "Mañana",
  TARDE: "Tarde",
  NOCHE: "Noche",
};

export default function DashboardPage() {
  const { kpis, recentSales, stockAlerts, activeShift, loaded, fetchAll } = useDashboardStore();

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (!loaded) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-6 h-6 border-2 border-zinc-700 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  const transferencias = kpis.ventas_del_dia - kpis.efectivo_en_caja;

  const kpiCards = [
    { label: "Ventas del Día", value: `$${kpis.ventas_del_dia.toLocaleString()}`, icon: DollarSign },
    { label: "Efectivo en Caja", value: `$${kpis.efectivo_en_caja.toLocaleString()}`, icon: Banknote },
    { label: "Transferencias", value: `$${transferencias.toLocaleString()}`, icon: ArrowRightLeft },
    { label: "Alertas Stock", value: stockAlerts.length.toString(), icon: stockAlerts.length > 0 ? AlertCircle : CheckCircle2 },
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Dashboard</h1>
          <p className="text-zinc-600 text-xs mt-0.5">{new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        {activeShift ? (
          <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-md">
            Turno {SHIFT_LABELS[activeShift.shift_type] || activeShift.shift_type}
          </span>
        ) : (
          <span className="text-xs font-medium text-zinc-600 bg-zinc-800/50 border border-white/[0.06] px-3 py-1.5 rounded-md">
            Sin turno activo
          </span>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-zinc-500 text-xs font-medium">{kpi.label}</p>
                <Icon size={14} className="text-zinc-600" />
              </div>
              <p className="text-xl font-semibold text-zinc-100">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Sales */}
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/[0.06] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-white/[0.06]">
            <h2 className="text-zinc-200 font-semibold text-sm">Ventas Recientes</h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {recentSales.length === 0 ? (
              <div className="p-8 text-center text-zinc-600 text-sm">No hay ventas registradas hoy.</div>
            ) : (
              recentSales.slice(0, 8).map(sale => (
                <div key={sale.id} className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-200 text-sm font-medium">
                      {sale.items.map(i => `${i.quantity > 1 ? `${i.quantity}x ` : ''}${i.format_name}`).join(' + ')}
                    </p>
                    <p className="text-zinc-600 text-xs truncate mt-0.5">
                      {sale.items.flatMap(i => i.flavors).join(' · ')}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-zinc-200 font-semibold text-sm">${sale.total.toLocaleString()}</p>
                    <p className="text-zinc-600 text-[10px]">
                      {sale.payment_method === "EFECTIVO" ? "Efectivo" : "Transfer."}{" "}
                      {new Date(sale.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-white/[0.06]">
            <h2 className="text-zinc-200 font-semibold text-sm">Alertas de Stock</h2>
          </div>
          <div className="p-3 space-y-2">
            {stockAlerts.length === 0 ? (
              <div className="p-6 text-center">
                <CheckCircle2 size={24} className="text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-600 text-sm">Todo el stock está en orden.</p>
              </div>
            ) : (
              stockAlerts.map(item => (
                <div key={item.id} className="bg-red-500/5 border border-red-500/10 rounded-md p-3">
                  <div className="flex justify-between items-center">
                    <p className="text-zinc-200 text-sm font-medium">{item.name}</p>
                    <span className="text-red-400 text-xs font-semibold">{item.current_stock} / {item.min_stock}</span>
                  </div>
                  <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500/80 rounded-full" style={{ width: `${Math.min(100, (item.current_stock / item.min_stock) * 100)}%` }} />
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
