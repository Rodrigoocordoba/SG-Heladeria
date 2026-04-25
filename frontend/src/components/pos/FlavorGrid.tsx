"use client";

import { usePOSStore } from "@/store/pos-store";

export function FlavorGrid() {
  const { flavors, selectedFormat, selectedFlavors, toggleFlavor, goBackToFormats } = usePOSStore();

  if (!selectedFormat) return null;

  const limitReached = selectedFlavors.length >= selectedFormat.max_flavors;

  return (
    <div className="space-y-4">
      {/* Header with back + counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={goBackToFormats}
            className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center
                       text-slate-400 hover:text-white hover:bg-white/[0.1] transition-all touch-manipulation"
          >
            ←
          </button>
          <div>
            <h2 className="text-white font-bold text-lg">{selectedFormat.name}</h2>
            <p className="text-slate-500 text-sm">${selectedFormat.price.toLocaleString()}</p>
          </div>
        </div>

        {/* Counter pill */}
        <div className={`px-4 py-2 rounded-full font-bold text-sm border transition-colors ${
          limitReached
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            : "bg-blue-500/10 border-blue-500/30 text-blue-400"
        }`}>
          {selectedFlavors.length} / {selectedFormat.max_flavors}
        </div>
      </div>

      {/* Flavor info */}
      {limitReached && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-center animate-in fade-in duration-300">
          <p className="text-emerald-400 text-sm font-medium">✓ Agregando al pedido...</p>
        </div>
      )}

      {/* Flavor Grid */}
      <div className="grid grid-cols-3 lg:grid-cols-4 gap-2">
        {flavors.map(f => {
          const isSelected = selectedFlavors.includes(f.id);
          const isDisabled = limitReached && !isSelected;

          return (
            <button
              key={f.id}
              onClick={() => toggleFlavor(f.id)}
              disabled={isDisabled}
              className={`
                relative p-4 rounded-xl border text-center font-medium text-sm
                transition-all duration-200 touch-manipulation
                ${isSelected
                  ? "bg-blue-500/15 border-blue-500/50 text-blue-300 ring-1 ring-blue-500/30"
                  : isDisabled
                    ? "bg-white/[0.01] border-white/[0.04] text-slate-700 cursor-not-allowed opacity-40"
                    : "bg-white/[0.03] border-white/[0.08] text-slate-300 hover:bg-white/[0.06] hover:border-white/[0.15] active:scale-[0.95]"
                }
              `}
            >
              {isSelected && (
                <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                  {selectedFlavors.indexOf(f.id) + 1}
                </span>
              )}
              {f.name}
            </button>
          );
        })}
      </div>

      {/* Manual add button (for fewer flavors than max) */}
      {!limitReached && selectedFlavors.length > 0 && (
        <button
          onClick={() => {
            const allFlavors = usePOSStore.getState().flavors;
            const flavorObjs = selectedFlavors
              .map(id => allFlavors.find(fl => fl.id === id))
              .filter(Boolean) as any[];
            const cart = usePOSStore.getState().cart;
            usePOSStore.setState({
              cart: [...cart, {
                uid: Math.random().toString(36).substring(2, 9),
                format: selectedFormat,
                flavors: flavorObjs,
                quantity: 1,
              }],
              step: "formats",
              selectedFormat: null,
              selectedFlavors: [],
            });
          }}
          className="w-full py-3 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400
                     hover:bg-blue-600/30 font-semibold text-sm transition-all touch-manipulation"
        >
          Agregar con {selectedFlavors.length} {selectedFlavors.length === 1 ? 'sabor' : 'sabores'} →
        </button>
      )}
    </div>
  );
}
