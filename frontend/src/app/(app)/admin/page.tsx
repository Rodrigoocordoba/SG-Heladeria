import { API_URL } from "@/config";
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Trash, ServerCrash, Store } from "lucide-react";

type Tab = "sabores" | "envases" | "formatos";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("sabores");

  // Form states
  const [flavorName, setFlavorName] = useState("");
  const [envaseName, setEnvaseName] = useState("");
  const [envaseCategory, setEnvaseCategory] = useState("ENVASE");

  const [formatName, setFormatName] = useState("");
  const [formatPrice, setFormatPrice] = useState("");
  const [formatGrams, setFormatGrams] = useState("");
  const [formatMaxFlavors, setFormatMaxFlavors] = useState("");
  const [formatLinkedProduct, setFormatLinkedProduct] = useState("");

  const [envases, setEnvases] = useState<any[]>([]);

  useEffect(() => {
    fetchEnvases();
  }, []);

  const fetchEnvases = async () => {
    try {
      const r = await fetch(`${API_URL}/products/?category=ENVASE");
      if (r.ok) {
        setEnvases(await r.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddFlavor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flavorName.trim()) return;
    try {
      const r = await fetch(`${API_URL}/products/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: flavorName, category: "HELADO" }),
      });
      if (r.ok) {
        toast.success("Sabor agregado correctamente.");
        setFlavorName("");
      } else {
        toast.error("Error al agregar sabor.");
      }
    } catch (err) {
      toast.error("Error de conexión.");
    }
  };

  const handleAddEnvase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!envaseName.trim()) return;
    try {
      const r = await fetch(`${API_URL}/products/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: envaseName, category: envaseCategory }),
      });
      if (r.ok) {
        toast.success("Insumo agregado correctamente.");
        setEnvaseName("");
        fetchEnvases();
      } else {
        toast.error("Error al agregar insumo.");
      }
    } catch (err) {
      toast.error("Error de conexión.");
    }
  };

  const handleAddFormat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formatName || !formatPrice || !formatGrams || !formatMaxFlavors) return;
    try {
      const payload: any = {
        name: formatName,
        price: parseFloat(formatPrice),
        total_grams: parseInt(formatGrams),
        max_flavors: parseInt(formatMaxFlavors),
      };
      if (formatLinkedProduct) {
        payload.linked_product_id = parseInt(formatLinkedProduct);
      }
      const r = await fetch(`${API_URL}/sale-formats/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (r.ok) {
        toast.success("Formato agregado correctamente.");
        setFormatName("");
        setFormatPrice("");
        setFormatGrams("");
        setFormatMaxFlavors("");
        setFormatLinkedProduct("");
      } else {
        toast.error("Error al agregar formato.");
      }
    } catch (err) {
      toast.error("Error de conexión.");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Administración</h1>
          <p className="text-zinc-600 text-xs mt-0.5">Gestión de menú y productos del sistema.</p>
        </div>
      </div>

      <div className="flex space-x-1 border-b border-white/[0.06] mb-6">
        <button
          onClick={() => setActiveTab("sabores")}
          className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "sabores" ? "border-indigo-500 text-indigo-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
        >
          Sabores
        </button>
        <button
          onClick={() => setActiveTab("envases")}
          className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "envases" ? "border-indigo-500 text-indigo-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
        >
          Insumos & Envases
        </button>
        <button
          onClick={() => setActiveTab("formatos")}
          className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === "formatos" ? "border-indigo-500 text-indigo-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
        >
          Formatos de Venta
        </button>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6">
        {activeTab === "sabores" && (
          <form onSubmit={handleAddFlavor} className="space-y-4 max-w-sm">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Nombre del Sabor</label>
              <Input
                value={flavorName}
                onChange={(e) => setFlavorName(e.target.value)}
                placeholder="Ej. Súper Dulce de Leche"
                className="bg-zinc-900 border-zinc-800 text-sm h-9"
              />
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9">
              <Plus size={14} className="mr-1" /> Añadir Sabor
            </Button>
          </form>
        )}

        {activeTab === "envases" && (
          <form onSubmit={handleAddEnvase} className="space-y-4 max-w-sm">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Nombre del Insumo</label>
              <Input
                value={envaseName}
                onChange={(e) => setEnvaseName(e.target.value)}
                placeholder="Ej. Cucurucho"
                className="bg-zinc-900 border-zinc-800 text-sm h-9"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Categoría</label>
              <select
                value={envaseCategory}
                onChange={(e) => setEnvaseCategory(e.target.value)}
                className="w-full bg-zinc-900 border-zinc-800 text-zinc-200 text-sm rounded-md h-9 px-3 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="ENVASE">Envase</option>
                <option value="BEBIDA">Bebida</option>
                <option value="EXTRA">Extra / Topping</option>
              </select>
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9">
              <Plus size={14} className="mr-1" /> Añadir Insumo
            </Button>
          </form>
        )}

        {activeTab === "formatos" && (
          <form onSubmit={handleAddFormat} className="space-y-4 max-w-sm">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Nombre del Formato</label>
              <Input
                value={formatName}
                onChange={(e) => setFormatName(e.target.value)}
                placeholder="Ej. 1/4 Kilo"
                className="bg-zinc-900 border-zinc-800 text-sm h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Precio ($)</label>
                <Input
                  type="number"
                  value={formatPrice}
                  onChange={(e) => setFormatPrice(e.target.value)}
                  placeholder="2500"
                  className="bg-zinc-900 border-zinc-800 text-sm h-9"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Gramos (Helado)</label>
                <Input
                  type="number"
                  value={formatGrams}
                  onChange={(e) => setFormatGrams(e.target.value)}
                  placeholder="250"
                  className="bg-zinc-900 border-zinc-800 text-sm h-9"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Máx. Sabores Permitidos</label>
              <Input
                type="number"
                value={formatMaxFlavors}
                onChange={(e) => setFormatMaxFlavors(e.target.value)}
                placeholder="3"
                className="bg-zinc-900 border-zinc-800 text-sm h-9"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Vincular Envase (Opcional)</label>
              <select
                value={formatLinkedProduct}
                onChange={(e) => setFormatLinkedProduct(e.target.value)}
                className="w-full bg-zinc-900 border-zinc-800 text-zinc-400 text-sm rounded-md h-9 px-3 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">-- Sin envase --</option>
                {envases.map((env) => (
                  <option key={env.id} value={env.id}>
                    {env.name}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9">
              <Plus size={14} className="mr-1" /> Guardar Formato
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
