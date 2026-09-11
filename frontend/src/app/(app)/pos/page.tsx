"use client";

import { useEffect } from "react";
import { usePOSStore } from "@/store/pos-store";
import { FormatGrid } from "@/components/pos/FormatGrid";
import { FlavorGrid } from "@/components/pos/FlavorGrid";
import { Cart } from "@/components/pos/Cart";
import { PaymentModal } from "@/components/pos/PaymentModal";
import { AlertTriangle } from "lucide-react";

const SHIFT_LABELS: Record<string, string> = {
  MANANA: "Mañana",
  TARDE: "Tarde",
  NOCHE: "Noche",
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
        <div className="text-zinc-500 text-center">
          <div className="w-6 h-6 border-2 border-zinc-700 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium">Cargando POS...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Shift Blocked Overlay */}
      {!activeShift && (
        <div className="absolute inset-0 z-40 bg-zinc-950/90 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center max-w-sm space-y-4">
            <div className="w-14 h-14 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} className="text-red-400" />
            </div>
            <h2 className="text-zinc-100 font-semibold text-lg">Turno no abierto</h2>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Abra un turno desde la sección <span className="text-zinc-300 font-medium">Turnos</span> para comenzar a vender.
              Esto garantiza el control correcto de inventario y caja.
            </p>
            <a href="/turnos"
              className="inline-block px-5 py-2.5 rounded-md bg-indigo-600 text-white font-medium
                         hover:bg-indigo-500 transition-colors text-sm">
              Ir a Turnos
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
            <h1 className="text-lg font-semibold text-zinc-100">Punto de Venta</h1>
            {activeShift && (
              <span className="text-xs font-medium text-zinc-500 bg-zinc-800/80 border border-white/[0.06] px-3 py-1.5 rounded-md">
                Turno {SHIFT_LABELS[activeShift.shift_type] || activeShift.shift_type}
              </span>
            )}
          </div>

          {/* State Machine */}
          {step === "formats" && <FormatGrid />}
          {step === "flavors" && <FlavorGrid />}
        </div>

        {/* ====== RIGHT PANEL (35%) ====== */}
        <div className="flex-[35] max-w-[380px] bg-[oklch(0.15_0.005_260)] border-l border-white/[0.06]">
          <Cart />
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal />
    </>
  );
}
