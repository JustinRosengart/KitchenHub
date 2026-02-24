import { X, Barcode, Clock, MapPin, Info, Weight, Tag, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { InventoryItemWithProduct } from '../types';

const NutritionBar = ({ label, value, max, color, unit = 'g' }: { label: string; value: number; max: number; color: string; unit?: string }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500 font-medium">{label}</span>
        <span className="font-bold text-slate-700">{value}{unit}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const getDaysLeft = (dateString: string) => {
  const diffTime = new Date(dateString).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getExpiryInfo = (days: number) => {
  if (days < 0) return { label: `Seit ${Math.abs(days)} Tagen abgelaufen`, color: 'text-red-600 bg-red-50', icon: AlertTriangle };
  if (days === 0) return { label: 'Läuft heute ab!', color: 'text-orange-600 bg-orange-50', icon: AlertTriangle };
  if (days <= 3) return { label: `Noch ${days} Tage`, color: 'text-orange-500 bg-orange-50', icon: Clock };
  if (days <= 7) return { label: `Noch ${days} Tage`, color: 'text-amber-500 bg-amber-50', icon: Clock };
  if (days <= 30) return { label: `Noch ${days} Tage`, color: 'text-blue-500 bg-blue-50', icon: Clock };
  return { label: `Noch ${days} Tage`, color: 'text-green-600 bg-green-50', icon: ShieldCheck };
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
};

interface Props {
  item: InventoryItemWithProduct;
  onClose: () => void;
}

export default function ProductDetailModal({ item, onClose }: Props) {
  const { product } = item;
  const days = getDaysLeft(item.mhd);
  const expiry = getExpiryInfo(days);
  const ExpiryIcon = expiry.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal – passt zwischen Header (64px) und Navbar (96px) mit Abstand */}
      <div
        className="relative w-[calc(100%-2rem)] max-w-2xl bg-white rounded-2xl overflow-hidden animate-slide-up shadow-2xl"
        style={{ maxHeight: 'calc(100vh - 64px - 96px - 2rem)' }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
        >
          <X className="w-4 h-4 text-slate-600" />
        </button>

        <div className="overflow-y-auto h-full" style={{ maxHeight: 'calc(100vh - 64px - 96px - 2rem)' }}>
          {/* Horizontal-Layout: Bild links, Content rechts */}
          <div className="flex flex-col sm:flex-row">
            {/* Produktbild */}
            <div className="sm:w-48 shrink-0 bg-gradient-to-b sm:bg-gradient-to-r from-slate-100 to-white flex items-center justify-center p-5">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-32 w-32 sm:h-40 sm:w-40 object-contain drop-shadow-lg animate-scale-in"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <div className="h-32 w-32 bg-slate-100 rounded-2xl flex items-center justify-center animate-scale-in">
                  <Tag className="w-12 h-12 text-slate-200" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 px-5 py-4 space-y-4 min-w-0">
            {/* Name & Brand */}
            <div className="animate-fade-in-up stagger-1">
              <h2 className="text-xl font-black text-slate-900">{product.name}</h2>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {product.brand && (
                  <span className="text-xs font-semibold text-slate-500">{product.brand}</span>
                )}
                {product.weight && (
                  <span className="px-1.5 py-0.5 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 flex items-center gap-0.5">
                    <Weight className="w-2.5 h-2.5" /> {product.weight}
                  </span>
                )}
                {product.category && (
                  <span className="px-1.5 py-0.5 bg-blue-50 rounded-full text-[10px] font-bold text-blue-500">
                    {product.category}
                  </span>
                )}
              </div>
            </div>

            {/* Haltbarkeit */}
            <div className={`animate-fade-in-up stagger-2 flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${expiry.color}`}>
              <ExpiryIcon className="w-4 h-4 shrink-0" />
              <div>
                <p className="font-bold text-xs">{expiry.label}</p>
                <p className="text-[10px] opacity-70">MHD: {formatDate(item.mhd)}</p>
              </div>
            </div>

            {/* Info-Grid */}
            <div className="animate-fade-in-up stagger-3 grid grid-cols-2 gap-2">
              <div className="bg-slate-50 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Barcode className="w-3 h-3 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Barcode</span>
                </div>
                <p className="font-mono font-bold text-xs text-slate-700">{product.barcode}</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Herkunft</span>
                </div>
                <p className="font-bold text-xs text-slate-700">{product.origin ?? '–'}</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Hinzugefügt</span>
                </div>
                <p className="font-bold text-xs text-slate-700">{formatDate(item.added_at)}</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Menge</span>
                </div>
                <p className="font-bold text-xs text-slate-700">{item.quantity}×</p>
              </div>
            </div>

            {/* Lagerhinweis */}
            {product.storage_info && (
              <div className="animate-fade-in-up stagger-4 flex items-start gap-2.5 bg-amber-50 px-3 py-2.5 rounded-xl">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-amber-800">{product.storage_info}</p>
              </div>
            )}

            {/* Nährwerte */}
            {product.nutrition && (
              <div className="animate-fade-in-up stagger-5">
                <h3 className="font-black text-xs text-slate-800 mb-2 uppercase tracking-wide">Nährwerte pro 100g</h3>

                {/* Kalorien-Highlight */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-3 mb-3 text-white shadow-md shadow-blue-200">
                  <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">Kalorien</p>
                  <p className="text-2xl font-black">{product.nutrition.calories} <span className="text-sm font-bold opacity-70">kcal</span></p>
                </div>

                {/* Makro-Bars */}
                <div className="space-y-2.5">
                  <NutritionBar label="Eiweiß" value={product.nutrition.protein} max={50} color="bg-red-400" />
                  <NutritionBar label="Kohlenhydrate" value={product.nutrition.carbs} max={100} color="bg-amber-400" />
                  {product.nutrition.sugar !== undefined && (
                    <NutritionBar label="  davon Zucker" value={product.nutrition.sugar} max={50} color="bg-orange-300" />
                  )}
                  <NutritionBar label="Fett" value={product.nutrition.fat} max={50} color="bg-yellow-400" />
                  {product.nutrition.fiber !== undefined && (
                    <NutritionBar label="Ballaststoffe" value={product.nutrition.fiber} max={30} color="bg-green-400" />
                  )}
                  {product.nutrition.salt !== undefined && (
                    <NutritionBar label="Salz" value={product.nutrition.salt} max={6} color="bg-slate-400" />
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Ende flex-row */}
          </div>
        </div>
      </div>
    </div>
  );
}
