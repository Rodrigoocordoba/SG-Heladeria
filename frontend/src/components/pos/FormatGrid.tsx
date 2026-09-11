"use client";

import { usePOSStore, SaleFormat } from "@/store/pos-store";

export function FormatGrid() {
  const { formats, selectFormat } = usePOSStore();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-zinc-200 font-semibold text-sm">Seleccione un formato</h2>
        <p className="text-zinc-600 text-xs mt-0.5">Toque un formato para elegir los sabores.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {formats.map(fmt => (
          <button
            key={fmt.id}
            onClick={() => selectFormat(fmt)}
            className="group relative bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 text-left
                       hover:bg-indigo-500/[0.04] hover:border-indigo-500/30 active:scale-[0.98]
                       transition-all duration-150"
          >
            {/* Weight badge */}
            <div className="w-10 h-10 rounded-md bg-zinc-800/80 border border-white/[0.06] flex items-center justify-center mb-3
                            group-hover:border-indigo-500/30 transition-colors">
              <span className="text-zinc-400 text-xs font-bold group-hover:text-indigo-400 transition-colors">
                {fmt.total_grams >= 1000 ? `${fmt.total_grams / 1000}K` : `${fmt.total_grams}g`}
              </span>
            </div>

            <h3 className="text-zinc-200 font-medium text-sm">{fmt.name}</h3>

            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-indigo-400 font-semibold text-lg">${fmt.price.toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-600">
              <span>{fmt.total_grams}g</span>
              <span className="w-0.5 h-0.5 rounded-full bg-zinc-700" />
              <span>{fmt.max_flavors} {fmt.max_flavors === 1 ? 'sabor' : 'sabores'}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
