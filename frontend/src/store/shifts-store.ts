import { create } from "zustand";

const API = "http://127.0.0.1:8000";

type Flavor = { id: number; name: string };
type Weighing = { product_id: number; product_name: string; initial_weight_grams: number };
type ActiveShift = { id: number; shift_type: string; opened_at: string; weighings: Weighing[] } | null;
type FlavorReport = { product_name: string; initial_grams: number; final_grams: number; real_consumption_grams: number; theoretical_grams: number; difference_grams: number; difference_percent: number };
type AuditReport = { shift_id: number; shift_type: string; opened_at: string; closed_at: string; total_sales_count: number; total_sales_amount: number; total_efectivo: number; total_transfer: number; flavors: FlavorReport[] };
type ClosedShift = { id: number; shift_type: string; opened_at: string; closed_at: string; total_sales: number };

export type ShiftStep = "select_type" | "enter_initial" | "shift_open" | "enter_final" | "report";

interface ShiftsStore {
  flavors: Flavor[];
  activeShift: ActiveShift;
  closedShifts: ClosedShift[];
  step: ShiftStep;
  shiftType: string;
  weights: Record<number, string>;
  auditReport: AuditReport | null;
  viewingAuditId: number | null;
  loaded: boolean;
  submitting: boolean;

  fetchAll: () => Promise<void>;
  selectType: (type: string) => void;
  setWeight: (productId: number, value: string) => void;
  goBack: () => void;
  openShift: () => Promise<boolean>;
  startClosing: () => void;
  closeShift: () => Promise<boolean>;
  viewAudit: (shiftId: number) => Promise<void>;
  clearReport: () => void;
}

export const useShiftsStore = create<ShiftsStore>((set, get) => ({
  flavors: [],
  activeShift: null,
  closedShifts: [],
  step: "select_type",
  shiftType: "",
  weights: {},
  auditReport: null,
  viewingAuditId: null,
  loaded: false,
  submitting: false,

  fetchAll: async () => {
    // Fetch INDEPENDIENTE para que un endpoint fallido no bloquee los demas
    try {
      const r = await fetch(`${API}/products/?category=HELADO`);
      if (r.ok) {
        const prods = await r.json();
        set({ flavors: prods.map((p: any) => ({ id: p.id, name: p.name })) });
      }
    } catch (e) { console.error("Error cargando sabores:", e); }

    try {
      const r = await fetch(`${API}/shifts/active`);
      if (r.ok) {
        const data = await r.json();
        const s = data.shift || null;
        set({ activeShift: s });
        // Solo cambiar step si NO estamos en medio de un flujo manual
        const currentStep = get().step;
        const isManualFlow = ["enter_initial", "enter_final", "report"].includes(currentStep);
        if (!isManualFlow) {
          set({ step: s ? "shift_open" : "select_type" });
        }
      }
    } catch (e) { console.error("Error cargando turno:", e); }

    try {
      const r = await fetch(`${API}/shifts/history`);
      if (r.ok) set({ closedShifts: await r.json() });
    } catch (e) { console.error("Error cargando historial:", e); }

    set({ loaded: true });
  },

  selectType: (type) => set({ shiftType: type, weights: {}, step: "enter_initial" }),
  setWeight: (pid, val) => set({ weights: { ...get().weights, [pid]: val } }),
  goBack: () => {
    const { activeShift } = get();
    if (activeShift) set({ step: "shift_open", weights: {} });
    else set({ step: "select_type", weights: {} });
  },

  openShift: async () => {
    const { weights, shiftType } = get();
    const w = Object.entries(weights).filter(([_, v]) => v !== "").map(([pid, v]) => ({ product_id: parseInt(pid), weight_grams: parseFloat(v) }));
    if (w.length === 0) return false;
    set({ submitting: true });
    try {
      const r = await fetch(`${API}/shifts/open`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shift_type: shiftType, weighings: w }),
      });
      if (r.ok) { set({ weights: {}, auditReport: null }); await get().fetchAll(); return true; }
      return false;
    } catch { return false; }
    finally { set({ submitting: false }); }
  },

  startClosing: () => set({ step: "enter_final", weights: {} }),

  closeShift: async () => {
    const { weights, activeShift } = get();
    if (!activeShift) return false;
    const w = Object.entries(weights).filter(([_, v]) => v !== "").map(([pid, v]) => ({ product_id: parseInt(pid), weight_grams: parseFloat(v) }));
    if (w.length === 0) return false;
    set({ submitting: true });
    try {
      const r = await fetch(`${API}/shifts/${activeShift.id}/close`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weighings: w }),
      });
      if (r.ok) {
        const report = await r.json();
        set({ auditReport: report, weights: {}, step: "report" });
        await get().fetchAll();
        return true;
      }
      return false;
    } catch { return false; }
    finally { set({ submitting: false }); }
  },

  viewAudit: async (shiftId) => {
    if (get().viewingAuditId === shiftId) { set({ viewingAuditId: null, auditReport: null }); return; }
    try {
      const r = await fetch(`${API}/shifts/${shiftId}/audit`);
      if (r.ok) set({ auditReport: await r.json(), viewingAuditId: shiftId, step: "report" });
    } catch {}
  },

  clearReport: () => {
    const { activeShift } = get();
    set({ auditReport: null, viewingAuditId: null, step: activeShift ? "shift_open" : "select_type" });
  },
}));
