"use client";
import { API_URL } from "@/config";


import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Download, Plus, Minus } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Product = {
  id: number;
  name: string;
  category: string;
};

export default function PedidoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const r = await fetch(`${API_URL}/products/`);
      if (r.ok) {
        setProducts(await r.json());
      }
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar productos.");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (id: number, delta: number) => {
    setQuantities(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const newQs = { ...prev };
        delete newQs[id];
        return newQs;
      }
      return { ...prev, [id]: next };
    });
  };

  const setExactQuantity = (id: number, value: string) => {
    const val = parseInt(value);
    if (isNaN(val) || val <= 0) {
      setQuantities(prev => {
        const newQs = { ...prev };
        delete newQs[id];
        return newQs;
      });
      return;
    }
    setQuantities(prev => ({ ...prev, [id]: val }));
  };

  const generatePDF = () => {
    const selectedIds = Object.keys(quantities).map(Number);
    if (selectedIds.length === 0) {
      toast.error("Seleccione al menos un producto para pedir.");
      return;
    }

    const doc = new jsPDF();
    doc.text(`Planilla de Pedido - ${new Date().toLocaleDateString('es-AR')}`, 14, 20);
    
    // Agrupar por categoría
    const selectedProducts = products.filter(p => selectedIds.includes(p.id));
    const helados = selectedProducts.filter(p => p.category === "HELADO");
    const otros = selectedProducts.filter(p => p.category !== "HELADO");

    let currentY = 30;

    if (helados.length > 0) {
      doc.setFontSize(12);
      doc.text("Helados (Tachos)", 14, currentY);
      autoTable(doc, {
        startY: currentY + 5,
        head: [["Sabor", "Cantidad"]],
        body: helados.map(p => [p.name, quantities[p.id].toString()]),
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] } // Indigo-600
      });
      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    if (otros.length > 0) {
      doc.setFontSize(12);
      doc.text("Insumos y Envases", 14, currentY);
      autoTable(doc, {
        startY: currentY + 5,
        head: [["Producto", "Cantidad"]],
        body: otros.map(p => [p.name, quantities[p.id].toString()]),
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] }
      });
    }

    doc.save(`Pedido_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success("PDF generado exitosamente.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const helados = products.filter(p => p.category === "HELADO");
  const insumos = products.filter(p => p.category !== "HELADO");

  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);

  const ProductList = ({ items, title }: { items: Product[], title: string }) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-zinc-300 mb-4 pb-2 border-b border-white/[0.06]">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(p => {
            const qty = quantities[p.id] || 0;
            const isSelected = qty > 0;
            return (
              <div key={p.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${isSelected ? 'border-indigo-500/50 bg-indigo-500/[0.03]' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                <span className={`text-sm font-medium ${isSelected ? 'text-indigo-400' : 'text-zinc-300'}`}>{p.name}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(p.id, -1)} className="w-7 h-7 flex items-center justify-center rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700">
                    <Minus size={14} />
                  </button>
                  <Input 
                    type="number"
                    value={qty || ""}
                    onChange={(e) => setExactQuantity(p.id, e.target.value)}
                    placeholder="0"
                    className="w-14 h-7 text-center bg-zinc-900 border-zinc-800 text-zinc-200 text-sm px-1 py-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button onClick={() => updateQuantity(p.id, 1)} className="w-7 h-7 flex items-center justify-center rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 pb-24 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Realizar Pedido</h1>
          <p className="text-zinc-600 text-xs mt-0.5">Seleccione los tachos e insumos que necesita pedir para su local.</p>
        </div>
        <Button onClick={generatePDF} disabled={totalItems === 0} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg h-9 text-xs">
          <Download size={16} className="mr-2" /> 
          Descargar PDF ({totalItems})
        </Button>
      </div>

      <ProductList items={helados} title="Sabores de Helado" />
      <ProductList items={insumos} title="Envases e Insumos" />
    </div>
  );
}
