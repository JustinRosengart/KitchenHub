const BASE = "/ollama";

export interface OllamaModel {
  name: string;
  size: number;
}

/** Gibt alle lokal installierten Modelle zurück. */
export async function fetchOllamaModels(): Promise<OllamaModel[]> {
  try {
    const res = await fetch(`${BASE}/api/tags`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models ?? []).map((m: { name: string; size: number }) => ({
      name: m.name,
      size: m.size,
    }));
  } catch {
    return [];
  }
}

/**
 * Generiert Rezeptideen via Ollama mit Streaming.
 * @param ingredients  Liste der Zutaten
 * @param model        Ollama-Modellname z.B. "llama3"
 * @param onChunk      Callback der für jedes empfangene Text-Chunk aufgerufen wird
 */
export async function generateOllamaRecipe(
  ingredients: string[],
  model: string,
  onChunk: (chunk: string) => void,
): Promise<void> {
  const prompt =
    `Du bist ein kreativer Koch-Assistent. Ich habe folgende Produkte zu Hause: ${ingredients.join(", ")}.\n\n` +
    `Erstelle 2 konkrete, leckere Rezeptideen auf Deutsch. Nutze Markdown mit ## für Rezepttitel, ` +
    `**fett** für wichtige Schritte, und Listen für Zutaten/Zubereitung.`;

  const response = await fetch(`${BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, stream: true }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Ollama Fehler: ${response.status} ${response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value, { stream: true }).split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const json = JSON.parse(line);
        if (json.response) onChunk(json.response);
      } catch {
        // ignore malformed lines
      }
    }
  }
}
