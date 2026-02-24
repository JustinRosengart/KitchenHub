import { useState, useEffect } from "react";
import { Barcode, Package, List, ChefHat, Database, Wifi } from "lucide-react";
import type { ViewState, InventoryItemWithProduct } from "./types";
import ScannerView from "./components/ScannerView";
import InventoryView from "./components/InventoryView";
import RecipeView from "./components/RecipeView";
import { supabase } from "./lib/supabaseClient";

type StatusState = "checking" | "online" | "offline";

const VIEWS: ViewState[] = ["scan", "inventory", "recipes"];

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>("scan");
  const [inventory, setInventory] = useState<InventoryItemWithProduct[]>([]);
  const [dbStatus, setDbStatus] = useState<StatusState>("checking");
  const [ollamaStatus, setOllamaStatus] = useState<StatusState>("checking");

  const checkDbStatus = async () => {
    try {
      const { error } = await supabase.from("inventory").select("id").limit(1);
      setDbStatus(error ? "offline" : "online");
    } catch {
      setDbStatus("offline");
    }
  };

  const checkOllamaStatus = async () => {
    try {
      const res = await fetch("/ollama/api/tags", {
        signal: AbortSignal.timeout(3000),
      });
      setOllamaStatus(res.ok ? "online" : "offline");
    } catch {
      setOllamaStatus("offline");
    }
  };

  useEffect(() => {
    fetchInventory();
    checkDbStatus();
    checkOllamaStatus();
    const interval = setInterval(() => {
      checkDbStatus();
      checkOllamaStatus();
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const fetchInventory = async () => {
    const { data } = await supabase
      .from("inventory")
      .select("*, product:products(*)");

    if (data) setInventory(data as InventoryItemWithProduct[]);
  };

  const handleSaveToInventory = async (
    newItemData: Partial<InventoryItemWithProduct>,
  ): Promise<boolean> => {
    const incomingProduct = newItemData.product;
    if (!incomingProduct) return false;

    // Echte DB-UUID erkennen (36 Zeichen, enthält Bindestriche an festen Stellen)
    const isRealDbId =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        incomingProduct.id,
      );

    let productId: string | undefined;

    if (isRealDbId) {
      // Produkt existiert bereits in der DB
      productId = incomingProduct.id;
    } else {
      // Produkt kommt von OpenFoodFacts oder wurde manuell erfasst →
      // erst per Barcode nachschauen ob es schon in der DB ist, sonst einfügen
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("barcode", incomingProduct.barcode)
        .maybeSingle();

      if (existing) {
        // Vorhandenes Produkt mit aktuellen OFF-Daten updaten
        await supabase
          .from("products")
          .update({
            name: incomingProduct.name,
            default_shelf_life: incomingProduct.default_shelf_life || 14,
            image_url: incomingProduct.image_url ?? null,
            brand: incomingProduct.brand ?? null,
            category: incomingProduct.category ?? null,
            weight: incomingProduct.weight ?? null,
            origin: incomingProduct.origin ?? null,
            storage_info: incomingProduct.storage_info ?? null,
            nutrition: incomingProduct.nutrition ?? null,
          })
          .eq("id", existing.id);
        productId = existing.id;
      } else {
        const { data: newProduct, error: productError } = await supabase
          .from("products")
          .insert({
            barcode: incomingProduct.barcode,
            name: incomingProduct.name,
            default_shelf_life: incomingProduct.default_shelf_life || 14,
            image_url: incomingProduct.image_url ?? null,
            brand: incomingProduct.brand ?? null,
            category: incomingProduct.category ?? null,
            weight: incomingProduct.weight ?? null,
            origin: incomingProduct.origin ?? null,
            storage_info: incomingProduct.storage_info ?? null,
            nutrition: incomingProduct.nutrition ?? null,
          })
          .select()
          .single();

        if (productError || !newProduct) return false;
        productId = newProduct.id;
      }
    }

    const { data: newInventoryItem, error: inventoryError } = await supabase
      .from("inventory")
      .insert({
        product_id: productId,
        mhd: newItemData.mhd,
        quantity: newItemData.quantity ?? 1,
      })
      .select("*, product:products(*)")
      .single();

    if (inventoryError || !newInventoryItem) return false;

    setInventory((prev) => [
      ...prev,
      newInventoryItem as InventoryItemWithProduct,
    ]);
    return true;
  };

  const handleDeleteFromInventory = async (id: string) => {
    await supabase.from("inventory").delete().eq("id", id);
    setInventory((prev) => prev.filter((i) => i.id !== id));
  };

  const handleConsumeFromInventory = async (
    barcode: string,
    amount: number,
  ): Promise<boolean> => {
    // Matching items sorted by MHD ascending (älteste zuerst – FIFO)
    const matching = [...inventory]
      .filter((i) => i.product.barcode === barcode)
      .sort((a, b) => new Date(a.mhd).getTime() - new Date(b.mhd).getTime());

    if (matching.length === 0) return false;

    let remaining = amount;
    for (const item of matching) {
      if (remaining <= 0) break;
      if (item.quantity <= remaining) {
        const { error } = await supabase
          .from("inventory")
          .delete()
          .eq("id", item.id);
        if (error) return false;
        setInventory((prev) => prev.filter((i) => i.id !== item.id));
        remaining -= item.quantity;
      } else {
        const newQty = item.quantity - remaining;
        const { error } = await supabase
          .from("inventory")
          .update({ quantity: newQty })
          .eq("id", item.id);
        if (error) return false;
        setInventory((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i)),
        );
        remaining = 0;
      }
    }
    return true;
  };

  return (
    <div className="h-dvh w-full bg-slate-50 flex flex-col overflow-hidden relative font-sans text-slate-900">
      <header className="shrink-0 px-6 py-4 flex justify-between items-center bg-white border-b border-slate-100 z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
            <Package className="w-5 h-5 text-white" />
          </div>
          <span className="font-black tracking-tight text-xl text-slate-800">
            Kitchen<span className="text-blue-600">Hub</span>
          </span>
        </div>
        <div className="flex gap-2">
          <div
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-colors duration-500 ${
              dbStatus === "online"
                ? "bg-green-50 text-green-700"
                : dbStatus === "offline"
                  ? "bg-red-50 text-red-600"
                  : "bg-slate-100 text-slate-400 animate-pulse"
            }`}
          >
            <Database className="w-3 h-3" /> DB
          </div>
          <div
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-colors duration-500 ${
              ollamaStatus === "online"
                ? "bg-emerald-50 text-emerald-700"
                : ollamaStatus === "offline"
                  ? "bg-red-50 text-red-600"
                  : "bg-slate-100 text-slate-400 animate-pulse"
            }`}
          >
            <Wifi className="w-3 h-3" /> Ollama
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto flex flex-col relative z-0">
        {currentView === "scan" && (
          <ScannerView
            onSave={handleSaveToInventory}
            onConsume={handleConsumeFromInventory}
            inventoryItems={inventory}
          />
        )}
        {currentView === "inventory" && (
          <InventoryView
            items={inventory}
            onDelete={handleDeleteFromInventory}
          />
        )}
        {currentView === "recipes" && <RecipeView items={inventory} />}
      </main>

      <nav className="shrink-0 h-20 sm:h-24 bg-white border-t border-slate-100 flex items-center px-4 z-10">
        <div className="relative flex w-full bg-slate-100 p-1.5 rounded-[20px]">
          {/* Sliding indicator */}
          <div
            className="absolute top-1.5 bottom-1.5 w-[calc(33.333%-4px)] bg-white rounded-2xl shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.35,0,0.25,1)]"
            style={{
              transform: `translateX(calc(${VIEWS.indexOf(currentView)} * 100% + ${VIEWS.indexOf(currentView)} * 4px))`,
            }}
          />
          {(
            [
              {
                view: "scan" as ViewState,
                icon: <Barcode className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />,
                label: "Scannen",
              },
              {
                view: "inventory" as ViewState,
                icon: <List className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />,
                label: "Vorrat",
              },
              {
                view: "recipes" as ViewState,
                icon: <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />,
                label: "KI-Koch",
              },
            ] as const
          ).map(({ view, icon, label }) => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`relative z-10 flex-1 flex flex-col items-center justify-center py-2 sm:py-3 rounded-2xl transition-colors duration-200 ${
                currentView === view
                  ? "text-blue-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {icon}
              <span className="text-[10px] sm:text-[11px] font-bold">
                {label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
