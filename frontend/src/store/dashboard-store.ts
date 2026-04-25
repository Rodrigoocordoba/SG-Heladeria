import { create } from "zustand";

const API = "http://127.0.0.1:8000";

type KPIs = { ventas_del_dia: number; efectivo_en_caja: number; turno_activo: boolean };
type RecentSale = { id: number; total: number; payment_method: string; date: string; items: { format_name: string; quantity: number; flavors: string[] }[] };
type StockAlert = { id: number; name: string; current_stock: number; min_stock: number };
type ActiveShift = { id: number; shift_type: string; opened_at: string } | null;

interface DashboardStore {
  kpis: KPIs;
  recentSales: RecentSale[];
  stockAlerts: StockAlert[];
  activeShift: ActiveShift;
  loaded: boolean;
  fetchAll: () => Promise<void>;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  kpis: { ventas_del_dia: 0, efectivo_en_caja: 0, turno_activo: false },
  recentSales: [],
  stockAlerts: [],
  activeShift: null,
  loaded: false,

  fetchAll: async () => {
    const safe = async (url: string) => { try { const r = await fetch(url); return r.ok ? r.json() : null; } catch { return null; } };

    const [kpis, sales, inv, shift] = await Promise.all([
      safe(`${API}/kpis/`),
      safe(`${API}/sales/recent?limit=10`),
      safe(`${API}/inventory/`),
      safe(`${API}/shifts/active`),
    ]);

    if (kpis) set({ kpis });
    if (sales) set({ recentSales: sales });
    if (inv) set({ stockAlerts: inv.filter((i: any) => i.current_stock <= i.min_stock) });
    if (shift) set({ activeShift: shift.shift || null });
    set({ loaded: true });
  },
}));
