import { useState, useEffect, useRef } from "react";
import { Barcode, Check, X, Loader2, PlusCircle, MinusCircle } from "lucide-react";
import type { InventoryItemWithProduct, Product } from "../types";
import { fetchProductByBarcode } from "../lib/openFoodFacts";

type ScanMode = "add" | "consume";

interface Props {
  onSave: (item: Partial<InventoryItemWithProduct>) => Promise<boolean>;
  onConsume: (barcode: string, amount: number) => Promise<boolean>;
  inventoryItems: InventoryItemWithProduct[];
}

const ScannerView = ({ onSave, onConsume, inventoryItems }: Props) => {
  const [mode, setMode] = useState<ScanMode>("add");
  const [scannedCode, setScannedCode] = useState<string | null>(null);

  // ─── Add mode state ───────────────────────────────────────
  const [productName, setProductName] = useState("");
  const [mhd, setMhd] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [resolvedProduct, setResolvedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // ─── Consume mode state ───────────────────────────────────
  const [consumeAmount, setConsumeAmount] = useState(1);
  const [isConsuming, setIsConsuming] = useState(false);
  const [consumeError, setConsumeError] = useState("");

  // ─── Shared ───────────────────────────────────────────────
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const buffer = useRef("");
  const lastKeyTime = useRef(Date.now());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      const now = Date.now();
      if (now - lastKeyTime.current > 50) buffer.current = "";
      lastKeyTime.current = now;
      if (e.key === "Enter") {
        if (buffer.current.length > 3) {
          handleScan(buffer.current);
          buffer.current = "";
        }
      } else if (e.key.length === 1) {
        buffer.current += e.key;
      }
    };
    globalThis.addEventListener("keydown", handleKeyDown);
    return () => globalThis.removeEventListener("keydown", handleKeyDown);
  }, [mode]);

  const resetAll = () => {
    setScannedCode(null);
    setProductName("");
    setMhd("");
    setQuantity(1);
    setResolvedProduct(null);
    setSaveError(false);
    setConsumeAmount(1);
    setConsumeError("");
  };

  const switchMode = (m: ScanMode) => {
    setMode(m);
    resetAll();
  };

  const handleScan = async (code: string) => {
    setScannedCode(code);
    if (mode === "add") {
      setIsLoading(true);
      setResolvedProduct(null);
      setProductName("");
      setMhd("");
      const product = await fetchProductByBarcode(code);
      if (product) {
        setResolvedProduct(product);
        setProductName(product.name);
        addDaysToMhd(product.default_shelf_life);
      }
      setIsLoading(false);
    } else {
      // consume: reset amount
      setConsumeAmount(1);
      setConsumeError("");
    }
  };

  const addDaysToMhd = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setMhd(date.toISOString().split("T")[0]);
  };

  // ─── Matching inventory items for consume mode ────────────
  const matchingItems = scannedCode
    ? inventoryItems
        .filter((i) => i.product.barcode === scannedCode)
        .sort((a, b) => new Date(a.mhd).getTime() - new Date(b.mhd).getTime())
    : [];
  const totalStock = matchingItems.reduce((s, i) => s + i.quantity, 0);

  // ─── Submit add ───────────────────────────────────────────
  const submitSave = async () => {
    const product: Product = resolvedProduct
      ? { ...resolvedProduct, name: productName }
      : { id: `manual-${Date.now()}`, barcode: scannedCode!, name: productName, default_shelf_life: 14 };
    setIsSaving(true);
    setSaveError(false);
    const ok = await onSave({ product, mhd, quantity });
    setIsSaving(false);
    if (!ok) { setSaveError(true); return; }
    setSuccessMsg(`${quantity}× ${productName} hinzugefügt.`);
    setShowSuccess(true);
    setTimeout(() => { resetAll(); setShowSuccess(false); }, 2000);
  };

  // ─── Submit consume ───────────────────────────────────────
  const submitConsume = async () => {
    setIsConsuming(true);
    setConsumeError("");
    const ok = await onConsume(scannedCode!, consumeAmount);
    setIsConsuming(false);
    if (!ok) { setConsumeError("Fehler beim Entnehmen. Datenbankverbindung prüfen."); return; }
    const name = matchingItems[0]?.product.name ?? scannedCode;
    setSuccessMsg(`${consumeAmount}× ${name} entnommen.`);
    setShowSuccess(true);
    setTimeout(() => { resetAll(); setShowSuccess(false); }, 2000);
  };

  // ─── Success screen ───────────────────────────────────────
  if (showSuccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="animate-scale-in bg-white p-12 rounded-4xl shadow-sm border border-green-100 flex flex-col items-center text-center w-full max-w-sm">
          <div className={`p-6 rounded-full mb-6 shadow-lg ${mode === "add" ? "bg-green-500 shadow-green-100" : "bg-orange-400 shadow-orange-100"} animate-pulse-ring`}>
            <Check className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">{mode === "add" ? "Gespeichert!" : "Entnommen!"}</h2>
          <p className="text-slate-500 font-medium">{successMsg}</p>
        </div>
      </div>
    );
  }

  // ─── Mode toggle + idle screen ────────────────────────────
  if (!scannedCode) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="animate-fade-in-up bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center max-w-sm w-full text-center overflow-hidden">

          {/* Mode toggle */}
          <div className="w-full flex bg-slate-100 p-1.5 rounded-t-[2.5rem]">
            <button
              onClick={() => switchMode("add")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${mode === "add" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              <PlusCircle className="w-4 h-4" /> Hinzufügen
            </button>
            <button
              onClick={() => switchMode("consume")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${mode === "consume" ? "bg-white text-orange-500 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              <MinusCircle className="w-4 h-4" /> Entnehmen
            </button>
          </div>

          <div className="p-10 flex flex-col items-center w-full">
            <div className={`p-6 rounded-4xl mb-8 animate-pulse-ring ${mode === "add" ? "bg-blue-50" : "bg-orange-50"}`}>
              <Barcode className={`w-12 h-12 ${mode === "add" ? "text-blue-500" : "text-orange-400"}`} />
            </div>
            <h1 className="text-2xl font-black text-slate-800 mb-3">{mode === "add" ? "Einlagern" : "Verbraucht"}</h1>
            <p className="text-slate-500 mb-8 leading-relaxed">
              {mode === "add" ? "Scanne ein Produkt um es dem Vorrat hinzuzufügen." : "Scanne ein Produkt das du verbraucht hast."}
            </p>
            <div className={`flex items-center gap-3 text-sm font-bold px-5 py-3.5 rounded-2xl ${mode === "add" ? "text-blue-500 bg-blue-50" : "text-orange-500 bg-orange-50"}`}>
              <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${mode === "add" ? "bg-blue-500" : "bg-orange-400"}`}></div>
              Warte auf Scan...
            </div>

            {/* Manuelle Eingabe */}
            <div className="w-full mt-6 pt-6 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-2">Oder manuell eingeben</p>
              <form onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.elements.namedItem("manualBarcode") as HTMLInputElement;
                const code = input.value.trim();
                if (code.length > 3) { handleScan(code); input.value = ""; }
              }} className="flex gap-2">
                <input
                  id="manualBarcode"
                  name="manualBarcode"
                  type="text"
                  inputMode="numeric"
                  placeholder="z.B. 4001724819806"
                  className="flex-1 px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold focus:border-blue-400 focus:bg-white outline-none transition-all"
                />
                <button type="submit" className={`px-5 py-3 text-white text-sm font-bold rounded-xl transition-colors active:scale-95 ${mode === "add" ? "bg-blue-600 hover:bg-blue-700" : "bg-orange-400 hover:bg-orange-500"}`}>
                  Suchen
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Consume mode: scanned ────────────────────────────────
  if (mode === "consume") {
    const productName2 = matchingItems[0]?.product.name ?? "Unbekanntes Produkt";
    const imageUrl = matchingItems[0]?.product.image_url;

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="animate-scale-in bg-white rounded-[2.5rem] shadow-xl border border-slate-100 w-full max-w-md overflow-hidden">
          <div className="p-8 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-50 px-2 py-1 rounded-md mb-2 inline-block">Code: {scannedCode}</span>
                <h2 className="text-2xl font-black text-slate-800">Entnehmen</h2>
              </div>
              <button onClick={resetAll} className="p-2 bg-slate-100 text-slate-400 rounded-full hover:bg-red-50 hover:text-red-400 hover:rotate-90 transition-all duration-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            {matchingItems.length === 0 ? (
              <div className="bg-amber-50 px-4 py-4 rounded-2xl border border-amber-100 text-center">
                <p className="text-sm font-bold text-amber-600">Nicht im Vorrat</p>
                <p className="text-xs text-amber-500 mt-1">Dieses Produkt ist nicht in deinem Vorrat vorhanden.</p>
              </div>
            ) : (
              <>
                {/* Product preview */}
                <div className="flex items-center gap-4 bg-orange-50 p-4 rounded-2xl border border-orange-100">
                  {imageUrl ? (
                    <img src={imageUrl} alt="" className="w-16 h-16 object-contain rounded-xl bg-white p-1 shrink-0" />
                  ) : (
                    <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shrink-0">
                      <Barcode className="w-6 h-6 text-slate-300" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{productName2}</p>
                    <p className="text-xs text-orange-600 font-bold mt-0.5">{totalStock} Einheit{totalStock !== 1 ? "en" : ""} im Vorrat</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {matchingItems.map((item) => (
                        <span key={item.id} className="text-[10px] bg-white border border-orange-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                          {item.quantity}× MHD {new Date(item.mhd).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Amount picker */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Entnommene Menge</label>
                  <div className="flex items-center gap-4 mt-1 bg-slate-50 border-2 border-slate-100 rounded-2xl p-2">
                    <button
                      type="button"
                      onClick={() => setConsumeAmount((q) => Math.max(1, q - 1))}
                      className="w-11 h-11 rounded-xl bg-white shadow-sm border border-slate-100 text-slate-600 text-xl font-bold flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all duration-200 active:scale-90"
                    >−</button>
                    <span className="flex-1 text-center text-2xl font-black text-slate-800 tabular-nums">{consumeAmount}</span>
                    <button
                      type="button"
                      onClick={() => setConsumeAmount((q) => Math.min(totalStock, q + 1))}
                      className="w-11 h-11 rounded-xl bg-white shadow-sm border border-slate-100 text-slate-600 text-xl font-bold flex items-center justify-center hover:bg-green-50 hover:text-green-600 hover:border-green-100 transition-all duration-200 active:scale-90"
                    >+</button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConsumeAmount(totalStock)}
                    className="mt-2 w-full py-2 bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-500 text-xs font-bold rounded-xl transition-all duration-200"
                  >
                    Alles entnehmen ({totalStock})
                  </button>
                </div>

                {consumeError && (
                  <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-2xl">
                    <p className="text-sm font-bold text-red-600">Fehler</p>
                    <p className="text-xs text-red-400 mt-0.5">{consumeError}</p>
                  </div>
                )}

                <button
                  onClick={submitConsume}
                  disabled={isConsuming}
                  className="w-full py-5 bg-orange-400 hover:bg-orange-500 disabled:bg-slate-200 disabled:shadow-none text-white text-lg font-bold rounded-2xl shadow-lg shadow-orange-200 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isConsuming ? <><Loader2 className="w-5 h-5 animate-spin" /> Entnehme…</> : `${consumeAmount} Einheit${consumeAmount !== 1 ? "en" : ""} entnehmen`}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Add mode: scanned ────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="animate-scale-in bg-white rounded-[2.5rem] shadow-xl border border-slate-100 w-full max-w-md overflow-hidden">
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-start animate-slide-down">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-1 rounded-md mb-2 inline-block">Code: {scannedCode}</span>
              <h2 className="text-2xl font-black text-slate-800">Neu erfassen</h2>
            </div>
            <button onClick={resetAll} className="p-2 bg-slate-100 text-slate-400 rounded-full hover:bg-red-50 hover:text-red-400 hover:rotate-90 transition-all duration-300">
              <X className="w-5 h-5" />
            </button>
          </div>

          {isLoading && (
            <div className="flex flex-col items-center py-8 gap-4 animate-fade-in-up">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              <p className="text-sm font-bold text-slate-400">Suche in OpenFoodFacts…</p>
            </div>
          )}

          {!isLoading && resolvedProduct && (
            <div className="flex items-center gap-4 bg-green-50 p-4 rounded-2xl border border-green-100 animate-fade-in-up">
              {resolvedProduct.image_url ? (
                <img src={resolvedProduct.image_url} alt="" className="w-16 h-16 object-contain rounded-xl bg-white p-1 shrink-0" />
              ) : (
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shrink-0">
                  <Barcode className="w-6 h-6 text-slate-300" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-green-600 mb-0.5">✓ Produkt erkannt</p>
                <p className="font-bold text-slate-800 truncate">{resolvedProduct.name}</p>
                <p className="text-xs text-slate-400 truncate">{[resolvedProduct.brand, resolvedProduct.weight].filter(Boolean).join(" · ")}</p>
              </div>
            </div>
          )}

          {!isLoading && !resolvedProduct && scannedCode && (
            <div className="bg-amber-50 px-4 py-3 rounded-2xl border border-amber-100 animate-fade-in-up">
              <p className="text-xs font-bold text-amber-600">Produkt nicht in OpenFoodFacts gefunden</p>
              <p className="text-xs text-amber-500 mt-0.5">Trage die Daten manuell ein.</p>
            </div>
          )}

          {!isLoading && (
            <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <div>
                <label htmlFor="productName" className="text-[11px] font-bold text-slate-400 uppercase ml-1">Produktname</label>
                <input
                  id="productName"
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Wie heißt das Produkt?"
                  className="w-full text-lg font-bold p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-100 outline-none transition-all duration-300 mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Anzahl</label>
                <div className="flex items-center gap-4 mt-1 bg-slate-50 border-2 border-slate-100 rounded-2xl p-2">
                  <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-11 h-11 rounded-xl bg-white shadow-sm border border-slate-100 text-slate-600 text-xl font-bold flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all duration-200 active:scale-90">−</button>
                  <span className="flex-1 text-center text-2xl font-black text-slate-800 tabular-nums">{quantity}</span>
                  <button type="button" onClick={() => setQuantity((q) => q + 1)}
                    className="w-11 h-11 rounded-xl bg-white shadow-sm border border-slate-100 text-slate-600 text-xl font-bold flex items-center justify-center hover:bg-green-50 hover:text-green-600 hover:border-green-100 transition-all duration-200 active:scale-90">+</button>
                </div>
              </div>

              <div>
                <label htmlFor="mhdDate" className="text-[11px] font-bold text-slate-400 uppercase ml-1">Mindesthaltbarkeit</label>
                <input
                  id="mhdDate"
                  type="date"
                  value={mhd}
                  onChange={(e) => setMhd(e.target.value)}
                  className="w-full text-lg font-bold p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-100 outline-none transition-all duration-300 mb-3 mt-1"
                />
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => addDaysToMhd(7)} className="py-3 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-xl font-bold text-xs text-slate-600 transition-all duration-200 active:scale-95">+1 Woche</button>
                  <button onClick={() => addDaysToMhd(30)} className="py-3 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-xl font-bold text-xs text-slate-600 transition-all duration-200 active:scale-95">+1 Monat</button>
                  <button onClick={() => addDaysToMhd(180)} className="py-3 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-xl font-bold text-xs text-slate-600 transition-all duration-200 active:scale-95">+6 Monate</button>
                </div>
              </div>
            </div>
          )}

          {!isLoading && (
            <>
              {saveError && (
                <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-2xl animate-fade-in-up">
                  <p className="text-sm font-bold text-red-600">Speichern fehlgeschlagen</p>
                  <p className="text-xs text-red-400 mt-0.5">Datenbankverbindung prüfen und erneut versuchen.</p>
                </div>
              )}
              <button
                onClick={submitSave}
                disabled={!productName || !mhd || isSaving}
                className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:shadow-none text-white text-lg font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all duration-300 active:scale-[0.98] hover:shadow-xl hover:shadow-blue-200 animate-fade-in-up flex items-center justify-center gap-2"
                style={{ animationDelay: "0.2s" }}
              >
                {isSaving ? <><Loader2 className="w-5 h-5 animate-spin" />Speichern…</> : "In den Vorrat"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScannerView;
