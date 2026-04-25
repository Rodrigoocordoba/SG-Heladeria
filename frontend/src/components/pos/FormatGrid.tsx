"use client";

import { usePOSStore, SaleFormat } from "@/store/pos-store";

const FORMAT_ICONS: Record<string, string> = {
  "1 Kilo": "1K",
  "1/2 Kilo": "½K",
  "1/4 Kilo": "¼K",
  "Cucurucho Simple": "🍦",
  "Cucurucho Doble": "🍦🍦",
};

export function FormatGrid() {
  const { formats, selectFormat } = usePOSStore();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-white font-bold text-lg">Seleccione un formato</h2>
        <p className="text-slate-500 text-sm">Toque un formato para elegir los sabores.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {formats.map(fmt => (
          <button
            key={fmt.id}
            onClick={() => selectFormat(fmt)}
            className="group relative bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 text-left
                       hover:bg-blue-500/10 hover:border-blue-500/40 active:scale-[0.97]
                       transition-all duration-200 touch-manipulation"
          >
            {/* Weight badge */}
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3
                            group-hover:bg-blue-500/20 group-hover:border-blue-500/30 transition-colors">
              <span className="text-blue-400 text-sm font-bold">
                {FORMAT_ICONS[fmt.name] || `${fmt.total_grams}g`}
              </span>
            </div>

            <h3 className="text-white font-semibold">{fmt.name}</h3>

            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-blue-400 font-bold text-xl">${fmt.price.toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              <span>{fmt.total_grams}g</span>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <span>{fmt.max_flavors} {fmt.max_flavors === 1 ? 'sabor' : 'sabores'}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
