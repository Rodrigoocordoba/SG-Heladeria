"use client";

import { usePOSStore } from "@/store/pos-store";

export function Cart() {
  const { cart, removeFromCart, updateQty, openPayment } = usePOSStore();

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = cart.reduce((s, i) => s + i.format.price * i.quantity, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.06]">
        <h2 className="text-white font-bold text-lg">Pedido</h2>
        <p className="text-slate-500 text-xs mt-0.5">
          {totalItems === 0 ? "Sin productos" : `${totalItems} ${totalItems === 1 ? 'item' : 'items'}`}
        </p>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cart.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3 opacity-30">🛒</div>
            <p className="text-slate-600 text-sm">Seleccione un formato<br />para comenzar.</p>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.uid} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 space-y-2">
              {/* Row 1: Name + remove */}
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-white font-semibold text-sm">{item.format.name}</p>
                  <p className="text-slate-500 text-xs truncate mt-0.5">
                    {item.flavors.map(f => f.name).join(' · ')}
                  </p>
                </div>
                <button
                  onClick={() => removeFromCart(item.uid)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600
                             hover:bg-red-500/10 hover:text-red-400 transition-colors shrink-0 touch-manipulation"
                >✕</button>
              </div>

              {/* Row 2: Qty controls + price */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.uid, -1)}
                    className="w-9 h-9 rounded-lg bg-slate-800 border border-white/[0.08] text-slate-400
                               hover:text-white hover:border-white/[0.2] flex items-center justify-center
                               text-lg font-bold transition-colors touch-manipulation active:scale-90">
                    −
                  </button>
                  <span className="w-10 text-center text-white font-bold text-sm">{item.quantity}</span>
                  <button onClick={() => updateQty(item.uid, 1)}
                    className="w-9 h-9 rounded-lg bg-slate-800 border border-white/[0.08] text-slate-400
                               hover:text-white hover:border-white/[0.2] flex items-center justify-center
                               text-lg font-bold transition-colors touch-manipulation active:scale-90">
                    +
                  </button>
                </div>
                <span className="text-blue-400 font-bold text-sm">
                  ${(item.format.price * item.quantity).toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer: Totals + Confirm */}
      <div className="border-t border-white/[0.06] p-4 space-y-3 bg-slate-950/50">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Subtotal</span>
          <span className="text-slate-300">${totalPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-lg">
          <span className="text-white font-bold">Total</span>
          <span className="text-emerald-400 font-bold">${totalPrice.toLocaleString()}</span>
        </div>

        <button
          onClick={openPayment}
          disabled={cart.length === 0}
          className="w-full py-4 rounded-xl font-bold text-base transition-all touch-manipulation active:scale-[0.98]
                     disabled:opacity-30 disabled:cursor-not-allowed
                     bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30"
        >
          {cart.length === 0 ? "Agregue productos" : `Confirmar Cobro · $${totalPrice.toLocaleString()}`}
        </button>

        <p className="text-center text-slate-700 text-[10px]">
          Presione <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">Enter</kbd> para cobrar
        </p>
      </div>
    </div>
  );
}
