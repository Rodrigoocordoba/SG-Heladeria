"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Flavor = { id: number; name: string };
type Weighing = { product_id: number; product_name: string; initial_weight_grams: number };
type ActiveShift = { id: number; shift_type: string; opened_at: string; weighings: Weighing[] } | null;
type FlavorReport = { product_name: string; initial_grams: number; final_grams: number; real_consumption_grams: number; theoretical_grams: number; difference_grams: number; difference_percent: number };
type AuditReport = { shift_id: number; shift_type: string; opened_at: string; closed_at: string; total_sales_count: number; total_sales_amount: number; total_efectivo: number; total_transfer: number; flavors: FlavorReport[] };
type ClosedShift = { id: number; shift_type: string; opened_at: string; closed_at: string; total_sales: number };

const SS: Record<string, { label: string; emoji: string; color: string; bg: string; border: string }> = {
  MANANA: { label: "Mañana", emoji: "☀️", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  TARDE:  { label: "Tarde",  emoji: "🌤️", color: "text-blue-400",  bg: "bg-blue-500/10",  border: "border-blue-500/30" },
  NOCHE:  { label: "Noche",  emoji: "🌙", color: "text-violet-400",bg: "bg-violet-500/10",border: "border-violet-500/30" },
};
const s = (t: string) => SS[t] || SS["MANANA"];

type Step = "select_type" | "enter_initial" | "shift_open" | "enter_final" | "report";

export default function TurnosPage() {
  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [activeShift, setActiveShift] = useState<ActiveShift>(null);
  const [closedShifts, setClosedShifts] = useState<ClosedShift[]>([]);
  const [step, setStep] = useState<Step>("select_type");
  const [shiftType, setShiftType] = useState("");
  const [weights, setWeights] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [viewingAuditId, setViewingAuditId] = useState<number | null>(null);

  const fetchData = async () => {
    // Fetch INDEPENDIENTE — cada endpoint falla por separado
    try {
      const r = await fetch("http://127.0.0.1:8000/products/?category=HELADO");
      if (r.ok) {
        const prods = await r.json();
        setFlavors(prods.map((p: any) => ({ id: p.id, name: p.name })));
      }
    } catch (e) { console.error("Error sabores:", e); }

    try {
      const r = await fetch("http://127.0.0.1:8000/shifts/active");
      if (r.ok) {
        const data = await r.json();
        setActiveShift(data.shift || null);
        if (data.shift) setStep("shift_open");
      }
    } catch (e) { console.error("Error turno:", e); }

    try {
      const r = await fetch("http://127.0.0.1:8000/shifts/history");
      if (r.ok) setClosedShifts(await r.json());
    } catch (e) { console.error("Error historial:", e); }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSelectType = (type: string) => { setShiftType(type); setWeights({}); setStep("enter_initial"); };

  const handleOpenShift = async () => {
    const w = Object.entries(weights).filter(([_, v]) => v !== "").map(([pid, v]) => ({ product_id: parseInt(pid), weight_grams: parseFloat(v) }));
    if (w.length === 0) { toast.error("Ingrese al menos un peso inicial."); return; }
    setSubmitting(true);
    try {
      const r = await fetch("http://127.0.0.1:8000/shifts/open", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shift_type: shiftType, weighings: w })
      });
      if (r.ok) { toast.success("Turno abierto"); setWeights({}); fetchData(); }
      else { const e = await r.json(); toast.error(e.detail); }
    } catch { toast.error("Error de conexion"); }
    finally { setSubmitting(false); }
  };

  const handleCloseShift = async () => {
    if (!activeShift) return;
    const w = Object.entries(weights).filter(([_, v]) => v !== "").map(([pid, v]) => ({ product_id: parseInt(pid), weight_grams: parseFloat(v) }));
    if (w.length === 0) { toast.error("Ingrese al menos un peso final."); return; }
    setSubmitting(true);
    try {
      const r = await fetch(`http://127.0.0.1:8000/shifts/${activeShift.id}/close`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weighings: w })
      });
      if (r.ok) { const report = await r.json(); setAuditReport(report); toast.success("Turno cerrado"); setWeights({}); setStep("report"); fetchData(); }
      else { const e = await r.json(); toast.error(e.detail); }
    } catch { toast.error("Error de conexion"); }
    finally { setSubmitting(false); }
  };

  const handleViewAudit = async (id: number) => {
    if (viewingAuditId === id) { setViewingAuditId(null); setAuditReport(null); return; }
    try {
      const r = await fetch(`http://127.0.0.1:8000/shifts/${id}/audit`);
      if (r.ok) { setAuditReport(await r.json()); setViewingAuditId(id); setStep("report"); }
    } catch { toast.error("Error al cargar reporte"); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Control de Turnos</h1>
          <p className="text-slate-500 text-sm">Pesaje de baldes y auditoría de consumo.</p>
        </div>
        {activeShift && (
          <Badge className={`${s(activeShift.shift_type).bg} ${s(activeShift.shift_type).color} border ${s(activeShift.shift_type).border} px-3 py-1.5 text-sm font-semibold`}>
            ● Turno {s(activeShift.shift_type).label}
          </Badge>
        )}
      </div>

      {/* ==================== PASO 1: ELEGIR TURNO ==================== */}
      {step === "select_type" && !activeShift && (
        <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-8 text-center space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Seleccione el turno a abrir</h2>
            <p className="text-slate-500 text-sm mt-2">Elija el horario para registrar el inicio del turno.</p>
          </div>
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            {(["MANANA", "TARDE", "NOCHE"] as const).map(type => (
              <button key={type} onClick={() => handleSelectType(type)}
                className="p-6 rounded-2xl border border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.04]
                           transition-all duration-200 hover:-translate-y-1 active:scale-95 group touch-manipulation">
                <span className="text-3xl block mb-2">{s(type).emoji}</span>
                <span className="block font-semibold text-slate-400 group-hover:text-white transition-colors">{s(type).label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ==================== PASO 2: PESOS INICIALES ==================== */}
      {step === "enter_initial" && !activeShift && (
        <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6 space-y-5">
          <div>
            <button onClick={() => setStep("select_type")} className="text-slate-500 hover:text-white text-sm mb-2 block touch-manipulation">← Volver</button>
            <h2 className="text-lg font-semibold text-white">
              Turno {s(shiftType).emoji} {s(shiftType).label} — Pesos Iniciales
            </h2>
            <p className="text-sm text-slate-500 mt-1">Pese cada balde e ingrese el peso en gramos.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {flavors.map(f => (
              <div key={f.id} className="bg-slate-800/50 rounded-xl p-4 border border-white/[0.06]">
                <Label className="text-slate-300 text-sm font-medium">{f.name}</Label>
                <div className="mt-2">
                  <Input type="number" min="0" step="1" placeholder="Peso en gramos (ej: 5000)"
                    value={weights[f.id] || ""} onChange={e => setWeights(p => ({ ...p, [f.id]: e.target.value }))}
                    className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 focus:border-violet-500" />
                </div>
              </div>
            ))}
          </div>
          <Button onClick={handleOpenShift} disabled={submitting}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 text-base touch-manipulation">
            {submitting ? "Abriendo..." : `Abrir Turno ${s(shiftType).label}`}
          </Button>
        </div>
      )}

      {/* ==================== TURNO ABIERTO ==================== */}
      {step === "shift_open" && activeShift && (
        <div className="space-y-4">
          <div className={`rounded-2xl border p-6 ${s(activeShift.shift_type).border} ${s(activeShift.shift_type).bg}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-lg font-bold ${s(activeShift.shift_type).color}`}>
                  {s(activeShift.shift_type).emoji} Turno {s(activeShift.shift_type).label} en curso
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Abierto: {new Date(activeShift.opened_at).toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' })}
                </p>
              </div>
              <Button onClick={() => { setWeights({}); setStep("enter_final"); }} variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 touch-manipulation">
                Cerrar Turno
              </Button>
            </div>
          </div>
          <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-5">
            <h3 className="text-white font-semibold mb-3 text-sm">Pesos iniciales registrados</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activeShift.weighings.map(w => (
                <div key={w.product_id} className="bg-slate-800/50 rounded-xl p-3 border border-white/[0.06] text-center">
                  <p className="text-slate-500 text-xs mb-1">{w.product_name}</p>
                  <p className="text-white font-bold">{(w.initial_weight_grams / 1000).toFixed(2)}<span className="text-slate-600 text-xs ml-0.5">kg</span></p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== PASO 3: PESOS FINALES ==================== */}
      {step === "enter_final" && activeShift && (
        <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6 space-y-5">
          <div>
            <button onClick={() => setStep("shift_open")} className="text-slate-500 hover:text-white text-sm mb-2 block touch-manipulation">← Volver al turno</button>
            <h2 className="text-lg font-semibold text-white">Cerrar Turno — Pesos Finales</h2>
            <p className="text-sm text-slate-500 mt-1">Pese cada balde para calcular el consumo real.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeShift.weighings.map(w => (
              <div key={w.product_id} className="bg-slate-800/50 rounded-xl p-4 border border-white/[0.06]">
                <Label className="text-slate-300 text-sm font-medium">{w.product_name}</Label>
                <p className="text-xs text-slate-600 mt-0.5 mb-2">
                  Inicio: <span className="text-violet-400 font-semibold">{(w.initial_weight_grams / 1000).toFixed(2)} kg</span>
                </p>
                <Input type="number" min="0" step="1" placeholder="Peso final en gramos"
                  value={weights[w.product_id] || ""} onChange={e => setWeights(p => ({ ...p, [w.product_id]: e.target.value }))}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 focus:border-red-500" />
              </div>
            ))}
          </div>
          <Button onClick={handleCloseShift} disabled={submitting}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-3 text-base touch-manipulation">
            {submitting ? "Cerrando..." : "Cerrar Turno y Generar Reporte"}
          </Button>
        </div>
      )}

      {/* ==================== REPORTE ==================== */}
      {auditReport && (
        <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Reporte — Turno {s(auditReport.shift_type).label} #{auditReport.shift_id}
            </h2>
            <button onClick={() => { setAuditReport(null); setViewingAuditId(null); if (!activeShift) setStep("select_type"); else setStep("shift_open"); }}
              className="text-slate-500 hover:text-white text-sm touch-manipulation">✕</button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Ventas", value: auditReport.total_sales_count.toString(), color: "text-white", accent: "border-white/[0.06] bg-white/[0.02]" },
              { label: "Facturado", value: `$${auditReport.total_sales_amount.toLocaleString()}`, color: "text-emerald-400", accent: "border-emerald-500/20 bg-emerald-500/5" },
              { label: "Efectivo", value: `$${auditReport.total_efectivo.toLocaleString()}`, color: "text-amber-400", accent: "border-amber-500/20 bg-amber-500/5" },
              { label: "Transferencias", value: `$${auditReport.total_transfer.toLocaleString()}`, color: "text-blue-400", accent: "border-blue-500/20 bg-blue-500/5" },
            ].map((k, i) => (
              <div key={i} className={`rounded-xl border p-4 text-center ${k.accent}`}>
                <p className="text-slate-500 text-xs mb-1">{k.label}</p>
                <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>

          {auditReport.flavors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-slate-500">
                    <th className="text-left py-3 px-2 font-semibold">Sabor</th>
                    <th className="text-right py-3 px-2 font-semibold">Inicial</th>
                    <th className="text-right py-3 px-2 font-semibold">Final</th>
                    <th className="text-right py-3 px-2 font-semibold">Real</th>
                    <th className="text-right py-3 px-2 font-semibold">Teórico</th>
                    <th className="text-right py-3 px-2 font-semibold">Diferencia</th>
                  </tr>
                </thead>
                <tbody>
                  {auditReport.flavors.map((f, i) => (
                    <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="py-3 px-2 text-white font-medium">{f.product_name}</td>
                      <td className="py-3 px-2 text-right text-slate-400">{(f.initial_grams / 1000).toFixed(2)} kg</td>
                      <td className="py-3 px-2 text-right text-slate-400">{(f.final_grams / 1000).toFixed(2)} kg</td>
                      <td className="py-3 px-2 text-right text-violet-400 font-semibold">{(f.real_consumption_grams / 1000).toFixed(2)} kg</td>
                      <td className="py-3 px-2 text-right text-blue-400 font-semibold">{(f.theoretical_grams / 1000).toFixed(2)} kg</td>
                      <td className={`py-3 px-2 text-right font-bold ${f.difference_grams > 0 ? 'text-red-400' : f.difference_grams < 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {f.difference_grams > 0 ? '+' : ''}{(f.difference_grams / 1000).toFixed(2)} kg
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-slate-600 text-center py-4 text-sm">No hubo ventas durante este turno.</p>}

          <p className="text-xs text-slate-600 text-center pt-2 border-t border-white/[0.06]">
            Abierto: {new Date(auditReport.opened_at).toLocaleString('es-AR')} — Cerrado: {auditReport.closed_at ? new Date(auditReport.closed_at).toLocaleString('es-AR') : '...'}
          </p>
        </div>
      )}

      {/* ==================== HISTORIAL ==================== */}
      {closedShifts.length > 0 && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/[0.06]">
            <h2 className="text-white font-bold">Historial de Turnos</h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {closedShifts.map(sh => (
              <div key={sh.id} className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <Badge className={`${s(sh.shift_type).bg} ${s(sh.shift_type).color} border ${s(sh.shift_type).border} text-xs`}>{s(sh.shift_type).label}</Badge>
                  <div>
                    <p className="text-white text-sm font-medium">Turno #{sh.id}</p>
                    <p className="text-slate-600 text-xs">
                      {new Date(sh.opened_at).toLocaleDateString('es-AR')} — {new Date(sh.opened_at).toLocaleTimeString('es-AR', {hour:'2-digit',minute:'2-digit'})} a {sh.closed_at ? new Date(sh.closed_at).toLocaleTimeString('es-AR', {hour:'2-digit',minute:'2-digit'}) : '...'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold text-sm">${sh.total_sales.toLocaleString()}</span>
                  <Button variant="outline" size="sm" onClick={() => handleViewAudit(sh.id)}
                    className="text-xs border-slate-700 text-slate-400 hover:bg-white/[0.05] touch-manipulation">
                    {viewingAuditId === sh.id ? "Ocultar" : "Reporte"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
