import { create } from "zustand";

// ============================================================================
// TYPES
// ============================================================================
export type SaleFormat = {
  id: number;
  name: string;
  price: number;
  total_grams: number;
  max_flavors: number;
  linked_product_id?: number | null;
};

export type Flavor = {
  id: number;
  name: string;
};

export type CartItem = {
  uid: string; // unique key for React
  format: SaleFormat;
  flavors: Flavor[];
  quantity: number;
};

export type POSStep = "formats" | "flavors";

type ActiveShift = {
  id: number;
  shift_type: string;
  opened_at: string;
} | null;

// ============================================================================
// STORE
// ============================================================================
interface POSStore {
  // --- Data ---
  formats: SaleFormat[];
  flavors: Flavor[];
  activeShift: ActiveShift;
  dataLoaded: boolean;

  // --- State Machine ---
  step: POSStep;
  selectedFormat: SaleFormat | null;
  selectedFlavors: number[];

  // --- Cart ---
  cart: CartItem[];
  paymentMethod: "EFECTIVO" | "TRANSFERENCIA";
  isPaymentOpen: boolean;
  isSubmitting: boolean;

  // --- Actions: Data ---
  fetchData: () => Promise<void>;

  // --- Actions: Flow ---
  selectFormat: (fmt: SaleFormat) => void;
  toggleFlavor: (flavorId: number) => void;
  goBackToFormats: () => void;

  // --- Actions: Cart ---
  removeFromCart: (uid: string) => void;
  updateQty: (uid: string, delta: number) => void;
  clearCart: () => void;

  // --- Actions: Payment ---
  setPaymentMethod: (m: "EFECTIVO" | "TRANSFERENCIA") => void;
  openPayment: () => void;
  closePayment: () => void;
  confirmSale: () => Promise<boolean>;
}

const uid = () => Math.random().toString(36).substring(2, 9);

const API = "http://127.0.0.1:8000";

export const usePOSStore = create<POSStore>((set, get) => ({
  // --- Initial State ---
  formats: [],
  flavors: [],
  activeShift: null,
  dataLoaded: false,

  step: "formats",
  selectedFormat: null,
  selectedFlavors: [],

  cart: [],
  paymentMethod: "EFECTIVO",
  isPaymentOpen: false,
  isSubmitting: false,

  // --- Fetch from Backend ---
  fetchData: async () => {
    try {
      const [fmtRes, flvRes, shiftRes] = await Promise.allSettled([
        fetch(`${API}/sale-formats/`),
        fetch(`${API}/products/?category=HELADO`),
        fetch(`${API}/shifts/active`),
      ]);

      if (fmtRes.status === "fulfilled" && fmtRes.value.ok)
        set({ formats: await fmtRes.value.json() });

      if (flvRes.status === "fulfilled" && flvRes.value.ok) {
        const prods = await flvRes.value.json();
        set({ flavors: prods.map((p: any) => ({ id: p.id, name: p.name })) });
      }

      if (shiftRes.status === "fulfilled" && shiftRes.value.ok) {
        const data = await shiftRes.value.json();
        set({ activeShift: data.shift || null });
      }
    } catch (e) {
      console.error("POS fetchData error:", e);
    } finally {
      set({ dataLoaded: true });
    }
  },

  // --- State Machine ---
  selectFormat: (fmt) => {
    set({ step: "flavors", selectedFormat: fmt, selectedFlavors: [] });
  },

  toggleFlavor: (flavorId) => {
    const { selectedFlavors, selectedFormat, cart } = get();
    if (!selectedFormat) return;

    const isSelected = selectedFlavors.includes(flavorId);

    if (isSelected) {
      // Deselect
      set({ selectedFlavors: selectedFlavors.filter(id => id !== flavorId) });
    } else {
      // Select (only if under limit)
      if (selectedFlavors.length >= selectedFormat.max_flavors) return;

      const newFlavors = [...selectedFlavors, flavorId];
      set({ selectedFlavors: newFlavors });

      // Auto-add to cart when limit reached
      if (newFlavors.length === selectedFormat.max_flavors) {
        const allFlavors = get().flavors;
        const flavorObjs = newFlavors
          .map(id => allFlavors.find(f => f.id === id))
          .filter(Boolean) as Flavor[];

        const newItem: CartItem = {
          uid: uid(),
          format: selectedFormat,
          flavors: flavorObjs,
          quantity: 1,
        };

        // Slight delay so user sees the last selection
        setTimeout(() => {
          set({
            cart: [...get().cart, newItem],
            step: "formats",
            selectedFormat: null,
            selectedFlavors: [],
          });
        }, 300);
      }
    }
  },

  goBackToFormats: () => {
    set({ step: "formats", selectedFormat: null, selectedFlavors: [] });
  },

  // --- Cart ---
  removeFromCart: (uid) => {
    set({ cart: get().cart.filter(item => item.uid !== uid) });
  },

  updateQty: (uid, delta) => {
    set({
      cart: get().cart.map(item =>
        item.uid === uid
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      ),
    });
  },

  clearCart: () => set({ cart: [] }),

  // --- Payment ---
  setPaymentMethod: (m) => set({ paymentMethod: m }),
  openPayment: () => {
    if (get().cart.length > 0) set({ isPaymentOpen: true });
  },
  closePayment: () => set({ isPaymentOpen: false }),

  confirmSale: async () => {
    const { cart, paymentMethod, activeShift } = get();
    if (cart.length === 0 || !activeShift) return false;

    set({ isSubmitting: true });
    try {
      const res = await fetch(`${API}/sales/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_method: paymentMethod,
          shift_id: activeShift.id,
          items: cart.map(item => ({
            format_id: item.format.id,
            quantity: item.quantity,
            flavors: item.flavors.map(f => ({ product_id: f.id })),
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        set({ cart: [], isPaymentOpen: false, paymentMethod: "EFECTIVO" });
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      set({ isSubmitting: false });
    }
  },
}));
