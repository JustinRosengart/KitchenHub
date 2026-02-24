import { useState } from "react";
import { Package, Clock, Trash2, AlertTriangle } from "lucide-react";
import type { InventoryItemWithProduct } from "../types";
import ProductDetailModal from "./ProductDetailModal";

const InventoryView = ({
  items,
  onDelete,
}: {
  items: InventoryItemWithProduct[];
  onDelete: (id: string) => void;
}) => {
  const [selectedItem, setSelectedItem] =
    useState<InventoryItemWithProduct | null>(null);

  const getDaysLeft = (dateString: string) => {
    const diffTime =
      new Date(dateString).getTime() - new Date().setHours(0, 0, 0, 0);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusClass = (days: number) => {
    if (days < 0) return "text-red-500";
    if (days <= 7) return "text-orange-500";
    return "text-slate-400";
  };

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-500">
        <div className="animate-fade-in-up">
          <Package className="w-16 h-16 text-slate-200 mb-4 mx-auto" />
          <p className="font-medium text-center">Dein Vorrat ist leer.</p>
        </div>
      </div>
    );
  }

  const sortedItems = [...items].sort(
    (a, b) => new Date(a.mhd).getTime() - new Date(b.mhd).getTime(),
  );
  const totalUnits = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="p-6 space-y-3 flex-1 overflow-auto pb-32">
      <div className="flex items-center justify-between px-1 mb-1">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          {items.length} Produkt{items.length !== 1 ? "e" : ""}
        </p>
        <p className="text-xs font-bold text-slate-400">
          {totalUnits} Einheit{totalUnits !== 1 ? "en" : ""} gesamt
        </p>
      </div>
      {sortedItems.map((item, index) => {
        const days = getDaysLeft(item.mhd);
        const staggerClass = index < 8 ? `stagger-${index + 1}` : "";
        return (
          <div
            key={item.id}
            className={`animate-fade-in-up ${staggerClass} bg-white rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center hover:shadow-md hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-300`}
          >
            <button
              type="button"
              onClick={() => setSelectedItem(item)}
              className="flex items-center gap-4 flex-1 p-4 text-left cursor-pointer active:scale-[0.98] transition-transform"
            >
              {item.product.image_url ? (
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-50 shrink-0">
                  <img
                    src={item.product.image_url}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="bg-slate-50 p-3 rounded-xl shrink-0">
                  <Package className="w-6 h-6 text-slate-400" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 truncate">
                    {item.product.name}
                  </h3>
                  <span className="shrink-0 text-[11px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full tabular-nums">
                    {item.quantity}×
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p
                    className={`text-xs font-semibold flex items-center gap-1 ${getStatusClass(days)}`}
                  >
                    {days < 0 ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    {days < 0 ? "Abgelaufen" : `Noch ${days} Tage`}
                  </p>
                  {item.product.brand && (
                    <span className="text-xs text-slate-300">
                      · {item.product.brand}
                    </span>
                  )}
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="p-3 mr-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 active:scale-90"
              aria-label={`${item.product.name} löschen`}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        );
      })}

      {selectedItem && (
        <ProductDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};

export default InventoryView;
