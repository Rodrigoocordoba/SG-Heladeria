"use client";
import { API_URL } from "@/config";


import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sun, CloudSun, Moon, ArrowLeft, X, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Flavor = { id: number; name: string };
type Weighing = { product_id: number; product_name: string; initial_weight_grams: number };
type ActiveShift = { id: number; shift_type: string; opened_at: string; weighings: Weighing[] } | null;
type FlavorReport = { product_name: string; initial_grams: number; final_grams: number; real_consumption_grams: number; theoretical_grams: number; difference_grams: number; difference_percent: number };
type AuditReport = { shift_id: number; shift_type: string; opened_at: string; closed_at: string; total_sales_count: number; total_sales_amount: number; total_efectivo: number; total_transfer: number; flavors: FlavorReport[] };
type ClosedShift = { id: number; shift_type: string; opened_at: string; closed_at: string; total_sales: number };

const SHIFT_CONFIG: Record<string, { label: string; icon: typeof Sun }> = {
  MANANA: { label: "Mañana", icon: Sun },
  TARDE: { label: "Tarde", icon: CloudSun },
  NOCHE: { label: "Noche", icon: Moon },
};
const sc = (t: string) => SHIFT_CONFIG[t] || SHIFT_CONFIG["MANANA"];

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
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const fetchData = async () => {
    try {
      const r = await fetch(`${API_URL}/products/?category=HELADO`);
      if (r.ok) {
        const prods = await r.json();
        setFlavors(prods.map((p: any) => ({ id: p.id, name: p.name })));
      }
    } catch (e) { console.error("Error sabores:", e); }

    try {
      const r = await fetch(`${API_URL}/shifts/active`);
      if (r.ok) {
        const data = await r.json();
        setActiveShift(data.shift || null);
        if (data.shift) setStep("shift_open");
      }
    } catch (e) { console.error("Error turno:", e); }

    try {
      const r = await fetch(`${API_URL}/shifts/history`);
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
      const r = await fetch(`${API_URL}/shifts/open`, {
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
      const r = await fetch(`${API_URL}/shifts/${activeShift.id}/close`, {
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
      const r = await fetch(`${API_URL}/shifts/${id}/audit`);
      if (r.ok) { setAuditReport(await r.json()); setViewingAuditId(id); setStep("report"); }
    } catch { toast.error("Error al cargar reporte"); }
  };

  const exportPdf = (report: AuditReport) => {
    const doc = new jsPDF();
    doc.text(`Reporte - Turno ${sc(report.shift_type).label} #${report.shift_id}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Apertura: ${new Date(report.opened_at).toLocaleString('es-AR')}`, 14, 28);
    if (report.closed_at) doc.text(`Cierre: ${new Date(report.closed_at).toLocaleString('es-AR')}`, 14, 34);
    
    doc.text(`Ventas: ${report.total_sales_count} | Facturado: $${report.total_sales_amount} | Efectivo: $${report.total_efectivo} | Transferencia: $${report.total_transfer}`, 14, 42);

    autoTable(doc, {
      startY: 50,
      head: [["Sabor", "Inicial (kg)", "Final (kg)", "Diferencia (kg)"]],
      body: report.flavors.map(f => [
        f.product_name,
        (f.initial_grams / 1000).toFixed(2),
        (f.final_grams / 1000).toFixed(2),
        (f.difference_grams / 1000).toFixed(2)
      ])
    });
    doc.save(`reporte_turno_${report.shift_id}.pdf`);
  };

  const exportDailyPdf = async () => {
    try {
      toast.info(`Generando reporte del día ${reportDate}...`);
      const r = await fetch(`${API_URL}/shifts/daily?date=${reportDate}`);
      if (r.ok) {
        const reports: AuditReport[] = await r.json();
        if (reports.length === 0) {
          toast.error("No hay turnos para exportar hoy.");
          return;
        }

        const doc = new jsPDF();
        doc.text(`Reporte Diario Consolidado - ${reportDate}`, 14, 20);
        
        let startY = 30;

        reports.forEach((report, index) => {
          if (index > 0) {
             doc.addPage();
             startY = 20;
          }

          doc.setFontSize(12);
          doc.text(`Turno: ${sc(report.shift_type).label}`, 14, startY);
          
          doc.setFontSize(10);
          doc.text(`Ventas: ${report.total_sales_count} | Facturado: $${report.total_sales_amount} | Efectivo: $${report.total_efectivo} | Transferencia: $${report.total_transfer}`, 14, startY + 8);
          
          autoTable(doc, {
            startY: startY + 16,
            head: [["Sabor", "Inicial (kg)", "Final (kg)", "Diferencia (kg)"]],
            body: report.flavors.map(f => [
              f.product_name,
              (f.initial_grams / 1000).toFixed(2),
              (f.final_grams / 1000).toFixed(2),
              (f.difference_grams / 1000).toFixed(2)
            ])
          });
          
          startY = (doc as any).lastAutoTable.finalY + 20;
        });

        doc.save(`reporte_diario_${reportDate}.pdf`);
        toast.success("Reporte descargado.");
      } else {
        toast.error("Error al obtener los turnos del día.");
      }
    } catch {
      toast.error("Error al generar reporte diario");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-6 h-6 border-2 border-zinc-700 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Control de Turnos</h1>
          <p className="text-zinc-600 text-xs mt-0.5">Pesaje de baldes y auditoría de consumo.</p>
        </div>
        {activeShift && (
          <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-md">
            Turno {sc(activeShift.shift_type).label}
          </span>
        )}
      </div>

      {/* ==================== PASO 1: ELEGIR TURNO ==================== */}
      {step === "select_type" && !activeShift && (
        <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-8 text-center space-y-6">
          <div>
            <h2 className="text-base font-semibold text-zinc-200">Seleccione el turno a abrir</h2>
            <p className="text-zinc-600 text-xs mt-1">Elija el horario para registrar el inicio del turno.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
            {(["MANANA", "TARDE", "NOCHE"] as const).map(type => {
              const config = sc(type);
              const Icon = config.icon;
              return (
                <button key={type} onClick={() => handleSelectType(type)}
                  className="p-5 rounded-lg border border-white/[0.06] hover:border-indigo-500/40 hover:bg-indigo-500/[0.04]
                             transition-all duration-200 active:scale-[0.97] group">
                  <Icon size={24} className="mx-auto mb-2 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                  <span className="block font-medium text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== PASO 2: PESOS INICIALES ==================== */}
      {step === "enter_initial" && !activeShift && (
        <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-6 space-y-5">
          <div>
            <button onClick={() => setStep("select_type")} className="text-zinc-600 hover:text-zinc-300 text-xs mb-2 flex items-center gap-1 transition-colors">
              <ArrowLeft size={12} /> Volver
            </button>
            <h2 className="text-base font-semibold text-zinc-200">
              Turno {sc(shiftType).label} — Pesos Iniciales
            </h2>
            <p className="text-xs text-zinc-600 mt-1">Pese cada balde e ingrese el peso en gramos.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {flavors.map(f => (
              <div key={f.id} className="bg-zinc-900/50 rounded-md p-4 border border-white/[0.06]">
                <Label className="text-zinc-400 text-xs font-medium">{f.name}</Label>
                <div className="mt-2">
                  <Input type="number" min="0" step="1" placeholder="Peso en gramos (ej: 5000)"
                    value={weights[f.id] || ""} onChange={e => setWeights(p => ({ ...p, [f.id]: e.target.value }))}
                    className="bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-700 focus:border-indigo-500 text-sm" />
                </div>
              </div>
            ))}
          </div>
          <Button onClick={handleOpenShift} disabled={submitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 text-sm rounded-md">
            {submitting ? "Abriendo..." : `Abrir Turno ${sc(shiftType).label}`}
          </Button>
        </div>
      )}

      {/* ==================== TURNO ABIERTO ==================== */}
      {step === "shift_open" && activeShift && (
        <div className="space-y-4">
          <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/[0.04] p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-indigo-400">
                  Turno {sc(activeShift.shift_type).label} en curso
                </h2>
                <p className="text-zinc-500 text-xs mt-1">
                  Abierto: {new Date(activeShift.opened_at).toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' })}
                </p>
              </div>
              <Button onClick={() => { setWeights({}); setStep("enter_final"); }} variant="outline"
                className="border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs rounded-md">
                Cerrar Turno
              </Button>
            </div>
          </div>
          <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-5">
            <h3 className="text-zinc-300 font-medium mb-3 text-xs uppercase tracking-wider">Pesos iniciales registrados</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activeShift.weighings.map(w => (
                <div key={w.product_id} className="bg-zinc-900/50 rounded-md p-3 border border-white/[0.06] text-center">
                  <p className="text-zinc-600 text-[11px] mb-1">{w.product_name}</p>
                  <p className="text-zinc-200 font-semibold text-sm">{(w.initial_weight_grams / 1000).toFixed(2)}<span className="text-zinc-600 text-[11px] ml-0.5">kg</span></p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== PASO 3: PESOS FINALES ==================== */}
      {step === "enter_final" && activeShift && (
        <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-6 space-y-5">
          <div>
            <button onClick={() => setStep("shift_open")} className="text-zinc-600 hover:text-zinc-300 text-xs mb-2 flex items-center gap-1 transition-colors">
              <ArrowLeft size={12} /> Volver al turno
            </button>
            <h2 className="text-base font-semibold text-zinc-200">Cerrar Turno — Pesos Finales</h2>
            <p className="text-xs text-zinc-600 mt-1">Pese cada balde para calcular el consumo real.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeShift.weighings.map(w => (
              <div key={w.product_id} className="bg-zinc-900/50 rounded-md p-4 border border-white/[0.06]">
                <Label className="text-zinc-400 text-xs font-medium">{w.product_name}</Label>
                <p className="text-[11px] text-zinc-600 mt-0.5 mb-2">
                  Inicio: <span className="text-indigo-400 font-medium">{(w.initial_weight_grams / 1000).toFixed(2)} kg</span>
                </p>
                <Input type="number" min="0" step="1" placeholder="Peso final en gramos"
                  value={weights[w.product_id] || ""} onChange={e => setWeights(p => ({ ...p, [w.product_id]: e.target.value }))}
                  className="bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-700 focus:border-red-500 text-sm" />
              </div>
            ))}
          </div>
          <Button onClick={handleCloseShift} disabled={submitting}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-medium py-3 text-sm rounded-md">
            {submitting ? "Cerrando..." : "Cerrar Turno y Generar Reporte"}
          </Button>
        </div>
      )}

      {/* ==================== REPORTE ==================== */}
      {auditReport && (
        <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-200">
              Reporte — Turno {sc(auditReport.shift_type).label} #{auditReport.shift_id}
            </h2>
            <div className="flex items-center gap-3">
              <Button onClick={() => exportPdf(auditReport)} variant="outline" size="sm" className="h-7 px-2 text-xs text-indigo-400 border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 hover:text-indigo-300">
                <Download size={12} className="mr-1.5" /> PDF
              </Button>
              <button onClick={() => { setAuditReport(null); setViewingAuditId(null); if (!activeShift) setStep("select_type"); else setStep("shift_open"); }}
                className="text-zinc-600 hover:text-zinc-300 transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Ventas", value: auditReport.total_sales_count.toString() },
              { label: "Facturado", value: `$${auditReport.total_sales_amount.toLocaleString()}` },
              { label: "Efectivo", value: `$${auditReport.total_efectivo.toLocaleString()}` },
              { label: "Transferencias", value: `$${auditReport.total_transfer.toLocaleString()}` },
            ].map((k, i) => (
              <div key={i} className="rounded-md border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                <p className="text-zinc-600 text-[11px] mb-1">{k.label}</p>
                <p className="text-lg font-semibold text-zinc-200">{k.value}</p>
              </div>
            ))}
          </div>

          {auditReport.flavors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-zinc-500">
                    <th className="text-left py-2.5 px-2 font-medium text-xs">Sabor</th>
                    <th className="text-right py-2.5 px-2 font-medium text-xs">Inicial</th>
                    <th className="text-right py-2.5 px-2 font-medium text-xs">Final</th>
                    <th className="text-right py-2.5 px-2 font-medium text-xs">Diferencia</th>
                  </tr>
                </thead>
                <tbody>
                  {auditReport.flavors.map((f, i) => (
                    <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="py-2.5 px-2 text-zinc-300 font-medium text-xs">{f.product_name}</td>
                      <td className="py-2.5 px-2 text-right text-zinc-500 text-xs">{(f.initial_grams / 1000).toFixed(2)} kg</td>
                      <td className="py-2.5 px-2 text-right text-zinc-500 text-xs">{(f.final_grams / 1000).toFixed(2)} kg</td>
                      <td className={`py-2.5 px-2 text-right font-semibold text-xs ${f.difference_grams > 0 ? 'text-red-400' : f.difference_grams < 0 ? 'text-emerald-400' : 'text-zinc-600'}`}>
                        {f.difference_grams > 0 ? '+' : ''}{(f.difference_grams / 1000).toFixed(2)} kg
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-zinc-600 text-center py-4 text-xs">No hubo ventas durante este turno.</p>}

          <p className="text-[11px] text-zinc-700 text-center pt-2 border-t border-white/[0.06]">
            Abierto: {new Date(auditReport.opened_at).toLocaleString('es-AR')} — Cerrado: {auditReport.closed_at ? new Date(auditReport.closed_at).toLocaleString('es-AR') : '...'}
          </p>
        </div>
      )}

      {/* ==================== HISTORIAL ==================== */}
      {closedShifts.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
            <h2 className="text-zinc-200 font-semibold text-sm">Historial de Turnos</h2>
            <div className="flex items-center gap-2">
              <Input 
                type="date" 
                value={reportDate} 
                onChange={(e) => setReportDate(e.target.value)} 
                className="h-7 text-xs px-2 w-32 bg-white/[0.02] border-white/[0.06] text-zinc-300"
              />
              <Button onClick={exportDailyPdf} variant="outline" size="sm" className="h-7 px-2 text-xs text-zinc-400 border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:text-zinc-200">
                <Download size={12} className="mr-1.5" /> Descargar
              </Button>
            </div>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {closedShifts.map(sh => (
              <div key={sh.id} className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">{sc(sh.shift_type).label}</span>
                  <div>
                    <p className="text-zinc-300 text-sm font-medium">Turno #{sh.id}</p>
                    <p className="text-zinc-700 text-[11px]">
                      {new Date(sh.opened_at).toLocaleDateString('es-AR')} — {new Date(sh.opened_at).toLocaleTimeString('es-AR', {hour:'2-digit',minute:'2-digit'})} a {sh.closed_at ? new Date(sh.closed_at).toLocaleTimeString('es-AR', {hour:'2-digit',minute:'2-digit'}) : '...'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-300 font-semibold text-sm">${sh.total_sales.toLocaleString()}</span>
                  <Button variant="outline" size="sm" onClick={() => handleViewAudit(sh.id)}
                    className="text-xs border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] rounded-md">
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
