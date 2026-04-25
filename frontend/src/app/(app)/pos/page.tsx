"use client";

import { useEffect } from "react";
import { usePOSStore } from "@/store/pos-store";
import { FormatGrid } from "@/components/pos/FormatGrid";
import { FlavorGrid } from "@/components/pos/FlavorGrid";
import { Cart } from "@/components/pos/Cart";
import { PaymentModal } from "@/components/pos/PaymentModal";
import { Badge } from "@/components/ui/badge";

const SHIFT_S: Record<string, { label: string; color: string; bg: string; border: string }> = {
  MANANA: { label: "Mañana", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  TARDE:  { label: "Tarde",  color: "text-blue-400",  bg: "bg-blue-500/10",  border: "border-blue-500/30" },
  NOCHE:  { label: "Noche",  color: "text-violet-400",bg: "bg-violet-500/10",border: "border-violet-500/30" },
};

export default function POSPage() {
  const { fetchData, dataLoaded, activeShift, step, openPayment, isPaymentOpen, cart } = usePOSStore();

  // Load data on mount
  useEffect(() => { fetchData(); }, [fetchData]);

  // Global hotkey: Enter to open payment
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !isPaymentOpen && cart.length > 0) {
        e.preventDefault();
        openPayment();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isPaymentOpen, cart.length, openPayment]);

  if (!dataLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-500 text-center">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Cargando POS...</p>
        </div>
      </div>
    );
  }

  const ss = SHIFT_S[activeShift?.shift_type || ""] || SHIFT_S["MANANA"];

  return (
    <>
      {/* Shift Blocked Overlay */}
      {!activeShift && (
        <div className="absolute inset-0 z-40 bg-red-950/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center max-w-sm space-y-4">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto">
              <span className="text-4xl">⚠️</span>
            </div>
            <h2 className="text-white font-bold text-2xl">Turno no abierto</h2>
            <p className="text-red-200/70 text-sm leading-relaxed">
              Abra un turno desde la sección <span className="text-white font-semibold">Turnos</span> para comenzar a vender.
              Esto garantiza el control correcto de inventario y caja.
            </p>
            <a href="/turnos"
              className="inline-block px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold
                         hover:bg-white/20 transition-all text-sm">
              Ir a Turnos →
            </a>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex h-full overflow-hidden">
        {/* ====== LEFT PANEL (65%) ====== */}
        <div className="flex-[65] overflow-y-auto p-5 space-y-4">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">Punto de Venta</h1>
            {activeShift && (
              <Badge className={`${ss.bg} ${ss.color} border ${ss.border} px-3 py-1.5 text-xs font-semibold`}>
                ● Turno {ss.label}
              </Badge>
            )}
          </div>

          {/* State Machine */}
          {step === "formats" && <FormatGrid />}
          {step === "flavors" && <FlavorGrid />}
        </div>

        {/* ====== RIGHT PANEL (35%) ====== */}
        <div className="flex-[35] max-w-[380px] bg-slate-900/60 border-l border-white/[0.06]">
          <Cart />
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal />
    </>
  );
}
