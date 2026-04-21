"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { toast } from "sonner";

export function AddStockModal({ inventory, onSuccess }: { inventory: any[], onSuccess: () => void }) {
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
      const response = await fetch(`http://127.0.0.1:8000/inventory/${productId}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_to_add: parseFloat(quantity)
        })
      });

      if (response.ok) {
        setOpen(false);
        setProductId("");
        setQuantity("");
        toast.success("Stock ingresado correctamente");
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
        <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">Ingresar Stock</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ingreso de Mercadería</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Producto a reabastecer</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un producto" />
              </SelectTrigger>
              <SelectContent>
                {inventory.map((item) => (
                  <SelectItem key={item.id} value={item.id.toString()}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && (
            <div className="space-y-2">
              <Label>Cantidad a ingresar ({selectedProduct.is_by_weight ? 'Gramos' : 'Unidades'})</Label>
              <Input 
                type="number" 
                min="0.1" 
                step="0.1"
                value={quantity} 
                onChange={(e) => setQuantity(e.target.value)} 
                placeholder={selectedProduct.is_by_weight ? "Ej: 10000 (10 Kg)" : "Ej: 50 (Unidades)"}
                required
              />
            </div>
          )}

          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={loading}>
            {loading ? "Procesando..." : "Confirmar Ingreso"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
