"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export type InventoryLog = {
  id: number;
  product_name: string;
  movement_type: string;
  quantity_changed: number;
  is_by_weight: boolean;
  created_at: string;
};

export function InventoryLogsTable({ data }: { data: InventoryLog[] }) {
  if (!data || data.length === 0) {
    return <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-100">Aún no hay movimientos registrados.</div>;
  }

  return (
    <div className="rounded-md border bg-white shadow-sm overflow-hidden mt-6">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h3 className="font-semibold text-gray-800">Auditoría: Últimos Movimientos</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <TableHead className="font-semibold text-gray-700">Fecha y Hora</TableHead>
            <TableHead className="font-semibold text-gray-700">Producto</TableHead>
            <TableHead className="font-semibold text-gray-700">Tipo de Movimiento</TableHead>
            <TableHead className="text-right font-semibold text-gray-700">Cantidad Modificada</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((log) => {
            const date = new Date(log.created_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
            
            const formatAmount = (amount: number, isWeight: boolean) => {
                const absAmount = Math.abs(amount);
                return isWeight ? `${(absAmount / 1000).toFixed(2)} kg` : `${absAmount} un`;
            };

            const isPositive = log.quantity_changed > 0;
            const amountText = `${isPositive ? '+' : '-'}${formatAmount(log.quantity_changed, log.is_by_weight)}`;

            return (
              <TableRow key={log.id} className="hover:bg-gray-50/50 transition-colors">
                <TableCell className="text-gray-500 text-sm">{date}</TableCell>
                <TableCell className="font-medium text-gray-900">{log.product_name}</TableCell>
                <TableCell>
                  {log.movement_type === 'SALE' ? (
                     <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Venta Registrada</Badge>
                  ) : log.movement_type === 'MANUAL_ADD' ? (
                     <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Ingreso Manual</Badge>
                  ) : (
                     <Badge variant="outline" className="text-gray-600 border-gray-200 bg-gray-50">Ajuste</Badge>
                  )}
                </TableCell>
                <TableCell className={`text-right font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {amountText}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
