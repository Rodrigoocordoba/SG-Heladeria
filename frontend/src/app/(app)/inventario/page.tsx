"use client";

import { useEffect, useState } from "react";
import { useInventoryStore } from "@/store/inventory-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const MOVE_LABELS: Record<string, { label: string; color: string }> = {
  SALE_ENVASE: { label: "Venta", color: "text-red-400" },
  MANUAL_ADD: { label: "Carga", color: "text-emerald-400" },
};

export default function InventarioPage() {
  const { items, logs, loaded, fetchAll, addStock, addingId } = useInventoryStore();
  const [addAmounts, setAddAmounts] = useState<Record<number, string>>({});

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAdd = async (productId: number) => {
    const amt = parseFloat(addAmounts[productId] || "0");
    if (amt <= 0) { toast.error("Ingrese una cantidad válida."); return; }
    const ok = await addStock(productId, amt);
    if (ok) { toast.success("Stock actualizado"); setAddAmounts(p => ({ ...p, [productId]: "" })); }
    else toast.error("Error al agregar stock");
  };

  if (!loaded) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Inventario</h1>
        <p className="text-slate-500 text-sm">Stock de envases e insumos. Los sabores de helado se controlan por pesaje.</p>
      </div>

      {/* Stock Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map(item => {
          const pct = item.min_stock > 0 ? Math.min(100, (item.current_stock / item.min_stock) * 100) : 100;
          const isLow = item.current_stock <= item.min_stock;

          return (
            <div key={item.id} className={`bg-white/[0.03] rounded-2xl border p-5 space-y-3 ${isLow ? 'border-red-500/20' : 'border-white/[0.06]'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white font-semibold">{item.name}</p>
                  <p className="text-slate-600 text-xs mt-0.5">{item.category}</p>
                </div>
                {isLow && <span className="text-red-400 text-xs font-bold bg-red-500/10 px-2 py-0.5 rounded-full">Bajo</span>}
              </div>

              {/* Stock bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className={isLow ? "text-red-400 font-bold" : "text-slate-400"}>{item.current_stock}</span>
                  <span className="text-slate-600">mín: {item.min_stock}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${isLow ? 'bg-red-500' : pct > 150 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                       style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              </div>

              {/* Add stock */}
              <div className="flex gap-2">
                <Input type="number" min="1" placeholder="Cantidad"
                  value={addAmounts[item.id] || ""}
                  onChange={e => setAddAmounts(p => ({ ...p, [item.id]: e.target.value }))}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 h-9 text-sm" />
                <Button onClick={() => handleAdd(item.id)} disabled={addingId === item.id}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white h-9 px-4 text-sm shrink-0">
                  {addingId === item.id ? "..." : "+ Agregar"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Logs */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <h2 className="text-white font-bold">Movimientos Recientes</h2>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-slate-600 text-sm">No hay movimientos registrados.</div>
          ) : (
            logs.slice(0, 15).map(log => {
              const ml = MOVE_LABELS[log.movement_type] || { label: log.movement_type, color: "text-slate-400" };
              return (
                <div key={log.id} className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ml.color} ${ml.color.replace('text-', 'bg-').replace('400', '500/10')}`}>{ml.label}</span>
                    <p className="text-white text-sm">{log.product_name}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${log.quantity_changed > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {log.quantity_changed > 0 ? '+' : ''}{log.quantity_changed}
                    </p>
                    <p className="text-slate-600 text-[10px]">
                      {new Date(log.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
