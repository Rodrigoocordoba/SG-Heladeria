"use client";

import { useEffect, useCallback } from "react";
import { usePOSStore } from "@/store/pos-store";
import { toast } from "sonner";
import { Banknote, Smartphone } from "lucide-react";

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
      <div className="bg-[oklch(0.17_0.005_260)] border border-white/[0.08] rounded-lg w-full max-w-sm p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200"
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="text-center">
          <h3 className="text-zinc-200 font-semibold text-base">Confirmar Cobro</h3>
          <p className="text-zinc-100 font-bold text-2xl mt-2">${total.toLocaleString()}</p>
          <p className="text-zinc-600 text-xs mt-1">
            {cart.reduce((s, i) => s + i.quantity, 0)} items en el pedido
          </p>
        </div>

        {/* Payment method */}
        <div className="space-y-2">
          <p className="text-zinc-500 text-xs font-medium">Método de pago</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod("EFECTIVO")}
              className={`py-3.5 rounded-md border font-medium text-sm transition-all active:scale-[0.97] flex flex-col items-center gap-1.5 ${
                paymentMethod === "EFECTIVO"
                  ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                  : "border-white/[0.06] text-zinc-500 hover:border-zinc-600"
              }`}
            >
              <Banknote size={18} />
              Efectivo
              <span className="text-[10px] opacity-50 font-normal">Tecla E</span>
            </button>
            <button
              onClick={() => setPaymentMethod("TRANSFERENCIA")}
              className={`py-3.5 rounded-md border font-medium text-sm transition-all active:scale-[0.97] flex flex-col items-center gap-1.5 ${
                paymentMethod === "TRANSFERENCIA"
                  ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                  : "border-white/[0.06] text-zinc-500 hover:border-zinc-600"
              }`}
            >
              <Smartphone size={18} />
              Transferencia
              <span className="text-[10px] opacity-50 font-normal">Tecla T</span>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="w-full py-3 rounded-md font-medium text-sm bg-indigo-600 hover:bg-indigo-500 text-white
                       transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? "Procesando..." : `Cobrar $${total.toLocaleString()}`}
          </button>
          <button
            onClick={closePayment}
            className="w-full py-2.5 rounded-md text-zinc-600 hover:text-zinc-400 text-xs transition-colors"
          >
            Cancelar (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
