"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export type SaleFormat = {
  id: number;
  name: string;
  price: number;
  total_grams: number;
  max_flavors: number;
};

export type Flavor = {
  id: number;
  name: string;
};

export function POSSaleModal({ 
  formats, 
  flavors, 
  shiftId,
  onSuccess 
}: { 
  formats: SaleFormat[];
  flavors: Flavor[];
  shiftId: number | null;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedFormatId, setSelectedFormatId] = useState<string>("");
  const [selectedFlavors, setSelectedFlavors] = useState<number[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("EFECTIVO");
  const [loading, setLoading] = useState(false);

  const selectedFormat = formats.find(f => f.id.toString() === selectedFormatId);

  const handleAddFlavor = (flavorId: string) => {
    const id = parseInt(flavorId);
    if (!selectedFormat) return;
    if (selectedFlavors.length >= selectedFormat.max_flavors) {
      toast.error(`Máximo ${selectedFormat.max_flavors} sabores para ${selectedFormat.name}`);
      return;
    }
    setSelectedFlavors(prev => [...prev, id]);
  };

  const handleRemoveFlavor = (index: number) => {
    setSelectedFlavors(prev => prev.filter((_, i) => i !== index));
  };

  const handleTryOpen = (isOpen: boolean) => {
    if (isOpen && !shiftId) {
      toast.error("No hay un turno abierto. Abra un turno desde la seccion Turnos antes de vender.", { duration: 4000 });
      return;
    }
    setOpen(isOpen);
    if (!isOpen) {
      setSelectedFormatId("");
      setSelectedFlavors([]);
      setPaymentMethod("EFECTIVO");
    }
  };

  const handleSubmit = async () => {
    if (!selectedFormatId) { toast.error("Seleccione un formato de venta."); return; }
    if (selectedFlavors.length === 0) { toast.error("Seleccione al menos un sabor."); return; }

    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/sales/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_method: paymentMethod,
          shift_id: shiftId,
          items: [{
            format_id: parseInt(selectedFormatId),
            quantity: 1,
            flavors: selectedFlavors.map(id => ({ product_id: id }))
          }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        setOpen(false);
        setSelectedFormatId("");
        setSelectedFlavors([]);
        setPaymentMethod("EFECTIVO");
        const label = paymentMethod === "EFECTIVO" ? "Efectivo" : "Transferencia";
        toast.success(`Venta registrada — $${data.total.toFixed(2)} (${label})`);
        onSuccess();
      } else {
        const errorData = await response.json();
        toast.error(`Error: ${errorData.detail}`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error de conexion con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleTryOpen}>
      <DialogTrigger asChild>
        <Button className={shiftId ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm" : "bg-slate-700 hover:bg-slate-600 text-slate-300 shadow-sm"}>
          {shiftId ? "Nueva Venta" : "Sin Turno Abierto"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Punto de Venta (POS)</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-4">

          {/* Paso 1: Elegir Formato */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">1. Formato de venta</Label>
            <Select value={selectedFormatId} onValueChange={(val) => { setSelectedFormatId(val); setSelectedFlavors([]); }}>
              <SelectTrigger>
                <SelectValue placeholder="Ej: 1 Kilo, Cucurucho..." />
              </SelectTrigger>
              <SelectContent>
                {formats.map(fmt => (
                  <SelectItem key={fmt.id} value={fmt.id.toString()}>
                    {fmt.name} — ${fmt.price.toLocaleString()} ({fmt.total_grams}g, max {fmt.max_flavors} sabores)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Paso 2: Elegir Sabores */}
          {selectedFormat && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">
                2. Sabores ({selectedFlavors.length}/{selectedFormat.max_flavors})
              </Label>
              
              <div className="flex flex-wrap gap-2 min-h-[32px]">
                {selectedFlavors.map((flavorId, index) => {
                  const flavor = flavors.find(f => f.id === flavorId);
                  return (
                    <Badge 
                      key={index} variant="secondary" 
                      className="bg-blue-100 text-blue-800 hover:bg-red-100 hover:text-red-800 cursor-pointer transition-colors px-3 py-1"
                      onClick={() => handleRemoveFlavor(index)}
                    >
                      {flavor?.name} ✕
                    </Badge>
                  );
                })}
                {selectedFlavors.length === 0 && (
                  <span className="text-sm text-gray-400 italic">Seleccione los sabores abajo...</span>
                )}
              </div>

              {selectedFlavors.length < selectedFormat.max_flavors && (
                <Select onValueChange={handleAddFlavor} value="">
                  <SelectTrigger>
                    <SelectValue placeholder="Agregar sabor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {flavors.map(f => (
                      <SelectItem key={f.id} value={f.id.toString()}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Paso 3: Método de Pago */}
          {selectedFormat && selectedFlavors.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">3. Método de pago</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod("EFECTIVO")}
                  className={`p-3 rounded-xl border-2 text-center font-semibold text-sm transition-all ${
                    paymentMethod === "EFECTIVO" 
                      ? "border-green-500 bg-green-50 text-green-700" 
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  💵 Efectivo
                </button>
                <button
                  onClick={() => setPaymentMethod("TRANSFERENCIA")}
                  className={`p-3 rounded-xl border-2 text-center font-semibold text-sm transition-all ${
                    paymentMethod === "TRANSFERENCIA" 
                      ? "border-blue-500 bg-blue-50 text-blue-700" 
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  📱 Transferencia
                </button>
              </div>
            </div>
          )}

          {/* Resumen */}
          {selectedFormat && (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm space-y-1">
              <div className="flex justify-between text-gray-600">
                <span>Formato</span>
                <span className="font-medium">{selectedFormat.name}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Sabores</span>
                <span className="font-medium">{selectedFlavors.length} de {selectedFormat.max_flavors}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Pago</span>
                <span className="font-medium">{paymentMethod === "EFECTIVO" ? "💵 Efectivo" : "📱 Transferencia"}</span>
              </div>
              <div className="border-t border-gray-200 pt-1 mt-1 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span>${selectedFormat.price.toLocaleString()}</span>
              </div>
            </div>
          )}

          <Button 
            onClick={handleSubmit} 
            className="w-full bg-green-600 hover:bg-green-700 text-white" 
            disabled={loading || !selectedFormatId || selectedFlavors.length === 0}
          >
            {loading ? "Procesando..." : "Confirmar Venta"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
