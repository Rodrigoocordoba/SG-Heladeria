"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export type InventoryItem = {
  id: number;
  name: string;
  category: string;
  current_amount_grams: number;
  min_stock: number;
  max_capacity: number; // Utilizado para calcular el % de la barra
  is_by_weight: boolean;
};

export function InventoryTable({ data }: { data: InventoryItem[] }) {
  if (!data || data.length === 0) {
    return <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-100">No hay productos en el inventario. Crea uno en la API.</div>;
  }

  return (
    <div className="rounded-md border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <TableHead className="font-semibold text-gray-700">Producto</TableHead>
            <TableHead className="font-semibold text-gray-700">Categoría</TableHead>
            <TableHead className="font-semibold text-gray-700">Stock Actual</TableHead>
            <TableHead className="font-semibold text-gray-700">Estado (Nivel)</TableHead>
            <TableHead className="text-right font-semibold text-gray-700">Alerta</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => {
            // Calcular porcentaje para la barra de progreso
            const percentage = Math.min(100, Math.max(0, (item.current_amount_grams / item.max_capacity) * 100));
            
            // Determinar color de la barra
            let progressColor = "bg-green-500";
            if (item.current_amount_grams <= item.min_stock) {
              progressColor = "bg-red-500"; // Peligro
            } else if (percentage < 40) {
              progressColor = "bg-amber-500"; // Precaución
            }

            const formatAmount = (amount: number, isWeight: boolean) => 
              isWeight ? `${(amount / 1000).toFixed(2)} kg` : `${amount} un`;

            const isLowStock = item.current_amount_grams <= item.min_stock;

            return (
              <TableRow key={item.id} className="hover:bg-gray-50/50 transition-colors">
                <TableCell className="font-medium text-gray-900">{item.name}</TableCell>
                <TableCell className="text-gray-600">{item.category}</TableCell>
                <TableCell className="text-gray-900 font-medium">{formatAmount(item.current_amount_grams, item.is_by_weight)}</TableCell>
                <TableCell className="w-[30%]">
                  <div className="flex items-center gap-3">
                    <div className="w-full relative">
                        <Progress value={percentage} indicatorColor={progressColor} className="h-2 w-full" />
                    </div>
                    <span className="text-xs font-medium text-gray-600 min-w-[36px]">{Math.round(percentage)}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {isLowStock ? (
                    <Badge variant="destructive" className="font-semibold px-2 py-0.5">Stock Bajo</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200 font-semibold px-2 py-0.5">Óptimo</Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
