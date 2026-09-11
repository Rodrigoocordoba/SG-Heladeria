"use client";

import { usePOSStore } from "@/store/pos-store";
import { ArrowLeft, Check } from "lucide-react";

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
            className="w-8 h-8 rounded-md bg-zinc-800/80 border border-white/[0.06] flex items-center justify-center
                       text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-all"
          >
            <ArrowLeft size={14} />
          </button>
          <div>
            <h2 className="text-zinc-200 font-semibold text-sm">{selectedFormat.name}</h2>
            <p className="text-zinc-600 text-xs">${selectedFormat.price.toLocaleString()}</p>
          </div>
        </div>

        {/* Counter pill */}
        <div className={`px-3 py-1.5 rounded-md font-semibold text-xs border transition-colors ${
          limitReached
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            : "bg-zinc-800/80 border-white/[0.06] text-zinc-400"
        }`}>
          {selectedFlavors.length} / {selectedFormat.max_flavors}
        </div>
      </div>

      {/* Flavor info */}
      {limitReached && (
        <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-md p-2.5 text-center animate-in fade-in duration-300">
          <p className="text-emerald-400 text-xs font-medium flex items-center justify-center gap-1.5">
            <Check size={12} /> Agregando al pedido...
          </p>
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
                relative p-3 rounded-md border text-center font-medium text-xs
                transition-all duration-150
                ${isSelected
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                  : isDisabled
                    ? "bg-white/[0.01] border-white/[0.04] text-zinc-700 cursor-not-allowed opacity-40"
                    : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:bg-white/[0.04] hover:border-zinc-600 active:scale-[0.97]"
                }
              `}
            >
              {isSelected && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-500 rounded flex items-center justify-center text-[9px] text-white font-bold">
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
          className="w-full py-2.5 rounded-md bg-indigo-600/15 border border-indigo-500/25 text-indigo-400
                     hover:bg-indigo-600/25 font-medium text-xs transition-all"
        >
          Agregar con {selectedFlavors.length} {selectedFlavors.length === 1 ? 'sabor' : 'sabores'}
        </button>
      )}
    </div>
  );
}
