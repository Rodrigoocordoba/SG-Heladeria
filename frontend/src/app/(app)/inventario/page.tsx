"use client";

import { useEffect, useState } from "react";
import { useInventoryStore } from "@/store/inventory-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const MOVE_LABELS: Record<string, { label: string; isPositive: boolean }> = {
  SALE_ENVASE: { label: "Venta", isPositive: false },
  MANUAL_ADD: { label: "Carga", isPositive: true },
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
      <div className="w-6 h-6 border-2 border-zinc-700 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Inventario</h1>
        <p className="text-zinc-600 text-xs mt-0.5">Stock de envases e insumos. Los sabores de helado se controlan por pesaje.</p>
      </div>

      {/* Stock Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map(item => {
          const pct = item.min_stock > 0 ? Math.min(100, (item.current_stock / item.min_stock) * 100) : 100;
          const isLow = item.current_stock <= item.min_stock;

          return (
            <div key={item.id} className={`bg-white/[0.02] rounded-lg border p-4 space-y-3 ${isLow ? 'border-red-500/15' : 'border-white/[0.06]'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-zinc-200 font-medium text-sm">{item.name}</p>
                  <p className="text-zinc-600 text-[11px] mt-0.5">{item.category}</p>
                </div>
                {isLow && <span className="text-red-400 text-[11px] font-semibold bg-red-500/10 px-2 py-0.5 rounded">Bajo</span>}
              </div>

              {/* Stock bar */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className={isLow ? "text-red-400 font-semibold" : "text-zinc-400"}>{item.current_stock}</span>
                  <span className="text-zinc-600">mín: {item.min_stock}</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${isLow ? 'bg-red-500/80' : pct > 150 ? 'bg-emerald-500/70' : 'bg-indigo-500/70'}`}
                       style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              </div>

              {/* Add stock */}
              <div className="flex gap-2">
                <Input type="number" min="1" placeholder="Cantidad"
                  value={addAmounts[item.id] || ""}
                  onChange={e => setAddAmounts(p => ({ ...p, [item.id]: e.target.value }))}
                  className="bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-700 h-8 text-xs" />
                <Button onClick={() => handleAdd(item.id)} disabled={addingId === item.id}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white h-8 px-3 text-xs shrink-0 rounded-md">
                  {addingId === item.id ? "..." : "Agregar"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Logs */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <h2 className="text-zinc-200 font-semibold text-sm">Movimientos Recientes</h2>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-zinc-600 text-sm">No hay movimientos registrados.</div>
          ) : (
            logs.slice(0, 15).map(log => {
              const ml = MOVE_LABELS[log.movement_type] || { label: log.movement_type, isPositive: false };
              return (
                <div key={log.id} className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${ml.isPositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>{ml.label}</span>
                    <p className="text-zinc-300 text-sm">{log.product_name}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${log.quantity_changed > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {log.quantity_changed > 0 ? '+' : ''}{log.quantity_changed}
                    </p>
                    <p className="text-zinc-700 text-[10px]">
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
