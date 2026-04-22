"use client";

import { useEffect, useState } from "react";
import { InventoryTable, InventoryItem } from "@/components/dashboard/InventoryTable";
import { InventoryLogsTable, InventoryLog } from "@/components/dashboard/InventoryLogsTable";
import { NewSaleModal } from "@/components/dashboard/NewSaleModal";
import { AddStockModal } from "@/components/dashboard/AddStockModal";
import { Toaster } from "@/components/ui/sonner";

export default function Home() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [kpis, setKpis] = useState({ ventas_del_dia: 0, efectivo_en_caja: 0 });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [invRes, kpiRes, logsRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/inventory/"),
        fetch("http://127.0.0.1:8000/kpis/"),
        fetch("http://127.0.0.1:8000/inventory/logs/")
      ]);
      
      if (invRes.ok) setInventory(await invRes.json());
      if (kpiRes.ok) setKpis(await kpiRes.json());
      if (logsRes.ok) setLogs(await logsRes.json());
      
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const lowStockCount = inventory.filter(i => i.current_amount_grams <= i.min_stock).length;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-[family-name:var(--font-geist-sans)]">
      <Toaster position="top-right" />
      <main className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard Heladería</h1>
          <p className="text-gray-500">Resumen de ventas y estado del inventario en tiempo real.</p>
        </div>

        {/* KPIs Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
            </div>
            <h3 className="text-sm font-medium text-gray-500">Ventas del Día</h3>
            <p className="text-3xl font-bold text-gray-900">${kpis.ventas_del_dia.toFixed(2)}</p>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit mt-2">Actualizado hoy</span>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </div>
            <h3 className="text-sm font-medium text-gray-500">Alertas Stock Bajo</h3>
            <p className={`text-3xl font-bold ${lowStockCount > 0 ? 'text-red-600' : 'text-green-600'}`}>{lowStockCount}</p>
            <span className={`text-xs font-medium px-2 py-1 rounded-full w-fit mt-2 ${lowStockCount > 0 ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>
              {lowStockCount > 0 ? 'Requiere atención' : 'Todo en orden'}
            </span>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a8 8 0 0 1-5.45 7.49"/><path d="M12 9.6V20.4a8 8 0 0 1-5.45-7.49"/><path d="M15 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>
            </div>
            <h3 className="text-sm font-medium text-gray-500">Efectivo en Caja</h3>
            <p className="text-3xl font-bold text-gray-900">${kpis.efectivo_en_caja.toFixed(2)}</p>
            <span className="text-xs font-medium text-gray-500 mt-2">Solo pagos en efectivo</span>
          </div>
        </div>

        {/* Inventory Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Estado del Inventario</h2>
            <div className="flex gap-2">
              <AddStockModal inventory={inventory} onSuccess={fetchDashboardData} />
              <NewSaleModal inventory={inventory} onSuccess={fetchDashboardData} />
            </div>
          </div>
          {loading ? (
             <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-100">Cargando datos...</div>
          ) : (
            <>
              <InventoryTable data={inventory} />
              <InventoryLogsTable data={logs} />
            </>
          )}
        </div>

      </main>
    </div>
  );
}
