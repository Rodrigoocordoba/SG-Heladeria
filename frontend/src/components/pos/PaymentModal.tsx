"use client";

import { useEffect, useCallback } from "react";
import { usePOSStore } from "@/store/pos-store";
import { toast } from "sonner";

export function PaymentModal() {
  const {
    isPaymentOpen, closePayment, paymentMethod, setPaymentMethod,
    confirmSale, isSubmitting, cart,
  } = usePOSStore();

  const total = cart.reduce((s, i) => s + i.format.price * i.quantity, 0);

  const handleConfirm = useCallback(async () => {
    const ok = await confirmSale();
    if (ok) {
      toast.success(`Venta registrada — $${total.toLocaleString()} (${paymentMethod === "EFECTIVO" ? "Efectivo" : "Transferencia"})`, { duration: 3000 });
    } else {
      toast.error("Error al registrar la venta.");
    }
  }, [confirmSale, total, paymentMethod]);

  // Hotkeys inside modal
  useEffect(() => {
    if (!isPaymentOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePayment();
      if (e.key.toLowerCase() === "e") setPaymentMethod("EFECTIVO");
      if (e.key.toLowerCase() === "t") setPaymentMethod("TRANSFERENCIA");
      if (e.key === "Enter" && !isSubmitting) handleConfirm();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isPaymentOpen, isSubmitting, closePayment, setPaymentMethod, handleConfirm]);

  if (!isPaymentOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
         onClick={closePayment}>
      <div className="bg-slate-900 border border-white/[0.1] rounded-2xl w-full max-w-sm p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200"
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="text-center">
          <h3 className="text-white font-bold text-xl">Confirmar Cobro</h3>
          <p className="text-emerald-400 font-bold text-3xl mt-2">${total.toLocaleString()}</p>
          <p className="text-slate-500 text-xs mt-1">
            {cart.reduce((s, i) => s + i.quantity, 0)} items en el pedido
          </p>
        </div>

        {/* Payment method */}
        <div className="space-y-2">
          <p className="text-slate-400 text-sm font-semibold">Método de pago</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod("EFECTIVO")}
              className={`py-4 rounded-xl border-2 font-semibold text-sm transition-all touch-manipulation active:scale-95 ${
                paymentMethod === "EFECTIVO"
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                  : "border-white/[0.08] text-slate-500 hover:border-white/[0.15]"
              }`}
            >
              💵 Efectivo
              <span className="block text-[10px] mt-1 opacity-60">Tecla E</span>
            </button>
            <button
              onClick={() => setPaymentMethod("TRANSFERENCIA")}
              className={`py-4 rounded-xl border-2 font-semibold text-sm transition-all touch-manipulation active:scale-95 ${
                paymentMethod === "TRANSFERENCIA"
                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                  : "border-white/[0.08] text-slate-500 hover:border-white/[0.15]"
              }`}
            >
              📱 Transferencia
              <span className="block text-[10px] mt-1 opacity-60">Tecla T</span>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="w-full py-4 rounded-xl font-bold text-base bg-emerald-600 hover:bg-emerald-500 text-white
                       transition-all touch-manipulation active:scale-[0.98] disabled:opacity-50 shadow-lg"
          >
            {isSubmitting ? "Procesando..." : `Cobrar $${total.toLocaleString()}`}
          </button>
          <button
            onClick={closePayment}
            className="w-full py-3 rounded-xl text-slate-500 hover:text-slate-300 text-sm transition-colors touch-manipulation"
          >
            Cancelar (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
