import { create } from "zustand";

const API = "http://127.0.0.1:8000";

type StockItem = { id: number; name: string; category: string; current_stock: number; min_stock: number };
type LogEntry = { id: number; product_name: string; movement_type: string; quantity_changed: number; created_at: string };

interface InventoryStore {
  items: StockItem[];
  logs: LogEntry[];
  loaded: boolean;
  addingId: number | null;

  fetchAll: () => Promise<void>;
  addStock: (productId: number, amount: number) => Promise<boolean>;
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  items: [],
  logs: [],
  loaded: false,
  addingId: null,

  fetchAll: async () => {
    const safe = async (url: string) => { try { const r = await fetch(url); return r.ok ? r.json() : null; } catch { return null; } };
    const [items, logs] = await Promise.all([safe(`${API}/inventory/`), safe(`${API}/inventory/logs/`)]);
    if (items) set({ items });
    if (logs) set({ logs });
    set({ loaded: true });
  },

  addStock: async (productId, amount) => {
    set({ addingId: productId });
    try {
      const r = await fetch(`${API}/inventory/${productId}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_to_add: amount }),
      });
      if (r.ok) { get().fetchAll(); return true; }
      return false;
    } catch { return false; }
    finally { set({ addingId: null }); }
  },
}));
