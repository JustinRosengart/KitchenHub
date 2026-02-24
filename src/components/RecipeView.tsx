import { useState, useEffect } from "react";
import { ChefHat, Sparkles, Loader2, RefreshCw, ChevronDown } from "lucide-react";
import type { InventoryItemWithProduct } from "../types";
import { generateOllamaRecipe, fetchOllamaModels, type OllamaModel } from "../lib/ollamaClient";
import MarkdownView from "./MarkdownView";

const RecipeView = ({ items }: { items: InventoryItemWithProduct[] }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [recipe, setRecipe] = useState("");
  const [error, setError] = useState("");
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [showModelPicker, setShowModelPicker] = useState(false);

  useEffect(() => {
    fetchOllamaModels().then((m) => {
      setModels(m);
      if (m.length > 0) setSelectedModel(m[0].name);
    });
  }, []);

  const handleGenerate = async () => {
    if (!selectedModel) {
      setError("Kein Ollama-Modell verfügbar. Stelle sicher dass Ollama läuft und mindestens ein Modell installiert ist.");
      return;
    }
    setIsGenerating(true);
    setRecipe("");
    setError("");
    try {
      const ingredients = items.map((i) => i.product.name);
      await generateOllamaRecipe(ingredients, selectedModel, (chunk) => {
        setRecipe((prev) => prev + chunk);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    }
    setIsGenerating(false);
  };

  const formatSize = (bytes: number) =>
    bytes >= 1e9 ? `${(bytes / 1e9).toFixed(1)} GB` : `${(bytes / 1e6).toFixed(0)} MB`;

  return (
    <div className="p-6 space-y-4 flex-1 overflow-auto">
      <div className="animate-fade-in-up bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 text-center">
        <div className="bg-emerald-50 w-16 h-16 rounded-[2rem] flex items-center justify-center mx-auto mb-5">
          <ChefHat className="text-emerald-600 w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">KI-Koch</h2>
        <p className="text-slate-500 mb-6 text-sm leading-relaxed">
          Lass dir aus deinen <span className="font-bold text-slate-700">{items.length} Produkten</span> ein Rezept zaubern.
        </p>

        {/* Modell-Auswahl */}
        {models.length > 0 && (
          <div className="mb-4 relative">
            <button
              onClick={() => setShowModelPicker((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border-2 border-slate-100 hover:border-slate-200 rounded-2xl text-sm font-bold text-slate-600 transition-all"
            >
              <span className="truncate">{selectedModel || "Modell wählen"}</span>
              <ChevronDown className={`w-4 h-4 shrink-0 ml-2 transition-transform ${showModelPicker ? "rotate-180" : ""}`} />
            </button>
            {showModelPicker && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-20">
                {models.map((m) => (
                  <button
                    key={m.name}
                    onClick={() => { setSelectedModel(m.name); setShowModelPicker(false); }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-bold transition-colors ${
                      selectedModel === m.name
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="truncate">{m.name}</span>
                    <span className="text-[10px] font-normal text-slate-400 ml-2 shrink-0">{formatSize(m.size)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {models.length === 0 && (
          <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-100 rounded-2xl text-left">
            <p className="text-xs font-bold text-amber-600">Kein Modell gefunden</p>
            <p className="text-xs text-amber-500 mt-0.5">Stelle sicher, dass Ollama läuft und ein Modell installiert ist.</p>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating || items.length === 0 || !selectedModel}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:shadow-none text-white text-base font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all duration-300 flex justify-center items-center gap-3 active:scale-[0.98]"
        >
          {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {isGenerating ? "Rezept wird erstellt…" : "Was kann ich kochen?"}
        </button>
      </div>

      {error && (
        <div className="animate-fade-in-up px-5 py-4 bg-red-50 border border-red-100 rounded-2xl">
          <p className="text-sm font-bold text-red-600">Fehler</p>
          <p className="text-xs text-red-400 mt-1">{error}</p>
        </div>
      )}

      {recipe && (
        <div className="animate-fade-in-up bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative">
          {isGenerating && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Generiert…
            </div>
          )}
          {!isGenerating && (
            <button
              onClick={handleGenerate}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              title="Neu generieren"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          <MarkdownView text={recipe} />
        </div>
      )}
    </div>
  );
};

export default RecipeView;
