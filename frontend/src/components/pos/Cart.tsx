"use client";

import { usePOSStore } from "@/store/pos-store";
import { ShoppingBag } from "lucide-react";

export function Cart() {
  const { cart, removeFromCart, updateQty, openPayment } = usePOSStore();

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = cart.reduce((s, i) => s + i.format.price * i.quantity, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.06]">
        <h2 className="text-zinc-200 font-semibold text-sm">Pedido</h2>
        <p className="text-zinc-600 text-[11px] mt-0.5">
          {totalItems === 0 ? "Sin productos" : `${totalItems} ${totalItems === 1 ? 'item' : 'items'}`}
        </p>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cart.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag size={28} className="mx-auto mb-3 text-zinc-700" />
            <p className="text-zinc-600 text-xs">Seleccione un formato<br />para comenzar.</p>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.uid} className="bg-white/[0.02] border border-white/[0.06] rounded-md p-3 space-y-2">
              {/* Row 1: Name + remove */}
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-zinc-200 font-medium text-sm">{item.format.name}</p>
                  <p className="text-zinc-600 text-[11px] truncate mt-0.5">
                    {item.flavors.map(f => f.name).join(' · ')}
                  </p>
                </div>
                <button
                  onClick={() => removeFromCart(item.uid)}
                  className="w-6 h-6 rounded flex items-center justify-center text-zinc-600 text-xs
                             hover:bg-red-500/10 hover:text-red-400 transition-colors shrink-0"
                >✕</button>
              </div>

              {/* Row 2: Qty controls + price */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.uid, -1)}
                    className="w-7 h-7 rounded bg-zinc-800 border border-white/[0.06] text-zinc-500
                               hover:text-zinc-300 hover:border-zinc-600 flex items-center justify-center
                               text-sm font-bold transition-colors active:scale-90">
                    −
                  </button>
                  <span className="w-8 text-center text-zinc-200 font-semibold text-xs">{item.quantity}</span>
                  <button onClick={() => updateQty(item.uid, 1)}
                    className="w-7 h-7 rounded bg-zinc-800 border border-white/[0.06] text-zinc-500
                               hover:text-zinc-300 hover:border-zinc-600 flex items-center justify-center
                               text-sm font-bold transition-colors active:scale-90">
                    +
                  </button>
                </div>
                <span className="text-zinc-200 font-semibold text-sm">
                  ${(item.format.price * item.quantity).toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer: Totals + Confirm */}
      <div className="border-t border-white/[0.06] p-4 space-y-3 bg-zinc-950/50">
        <div className="flex justify-between text-xs">
          <span className="text-zinc-600">Subtotal</span>
          <span className="text-zinc-400">${totalPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-200 font-semibold text-sm">Total</span>
          <span className="text-zinc-100 font-bold text-base">${totalPrice.toLocaleString()}</span>
        </div>

        <button
          onClick={openPayment}
          disabled={cart.length === 0}
          className="w-full py-3 rounded-md font-medium text-sm transition-all active:scale-[0.98]
                     disabled:opacity-30 disabled:cursor-not-allowed
                     bg-indigo-600 hover:bg-indigo-500 text-white"
        >
          {cart.length === 0 ? "Agregue productos" : `Confirmar Cobro · $${totalPrice.toLocaleString()}`}
        </button>

        <p className="text-center text-zinc-700 text-[10px]">
          Presione <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 font-mono text-[9px]">Enter</kbd> para cobrar
        </p>
      </div>
    </div>
  );
}
