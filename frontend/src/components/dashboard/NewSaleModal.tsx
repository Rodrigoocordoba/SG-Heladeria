"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { toast } from "sonner";

export function NewSaleModal({ inventory, onSuccess }: { inventory: any[], onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState<string>("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      toast.error("Por favor, seleccione un producto.");
      return;
    }
    if (!quantity) {
      toast.error("Por favor, ingrese una cantidad.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/sales/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_method: "Efectivo",
          items: [{
            product_id: parseInt(productId),
            quantity_sold: parseFloat(quantity)
          }]
        })
      });

      if (response.ok) {
        setOpen(false);
        setProductId("");
        setQuantity("");
        toast.success("Venta registrada con éxito");
        onSuccess();
      } else {
        const errorData = await response.json();
        toast.error(`Error: ${errorData.detail}`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = inventory.find(p => p.id.toString() === productId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">Nueva Venta</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Nueva Venta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Producto</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un producto" />
              </SelectTrigger>
              <SelectContent>
                {inventory.map((item) => (
                  <SelectItem key={item.id} value={item.id.toString()}>
                    {item.name} (${item.unit_price} / {item.is_by_weight ? '100g' : 'un'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && (
            <div className="space-y-2">
              <Label>Cantidad ({selectedProduct.is_by_weight ? 'Gramos' : 'Unidades'})</Label>
              <Input 
                type="number" 
                min="0.1" 
                step="0.1"
                value={quantity} 
                onChange={(e) => setQuantity(e.target.value)} 
                placeholder={selectedProduct.is_by_weight ? "Ej: 250 (Gramos)" : "Ej: 2 (Unidades)"}
                required
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Procesando..." : "Confirmar Venta"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
