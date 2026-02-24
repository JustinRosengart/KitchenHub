import type { Product, NutritionInfo } from '../types';

const BASE_URL = 'https://world.openfoodfacts.org/api/v2/product';

interface OFFNutriments {
  'energy-kcal_100g'?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
  fiber_100g?: number;
  sugars_100g?: number;
  salt_100g?: number;
}

interface OFFProduct {
  product_name?: string;
  product_name_de?: string;
  brands?: string;
  categories?: string;
  categories_tags?: string[];
  quantity?: string;
  image_front_url?: string;
  image_front_small_url?: string;
  origins?: string;
  origins_tags?: string[];
  conservation_conditions?: string;
  nutriments?: OFFNutriments;
}

interface OFFResponse {
  status: number; // 1 = found, 0 = not found
  product?: OFFProduct;
}

/** Schätzt die Haltbarkeit anhand der Kategorie */
function estimateShelfLife(categories?: string[], name?: string): number {
  const text = [...(categories ?? []), name ?? ''].join(' ').toLowerCase();

  if (/fresh|frisch|milk|milch|sahne|cream|yogurt|joghurt|quark/.test(text)) return 14;
  if (/bread|brot|brötchen|cake|kuchen/.test(text)) return 7;
  if (/meat|fleisch|wurst|hack/.test(text)) return 5;
  if (/cheese|käse/.test(text)) return 30;
  if (/frozen|tiefkühl|eis|pizza/.test(text)) return 365;
  if (/canned|konserve|dose|passata|tomat/.test(text)) return 730;
  if (/pasta|nudel|spaghetti|reis|rice|mehl|flour/.test(text)) return 365;
  if (/juice|saft|wasser|water/.test(text)) return 180;
  if (/chocolate|schoko|süßigkeit|candy|chips/.test(text)) return 270;
  if (/oil|öl|essig|vinegar|sauce|soße|ketchup|senf|mustard/.test(text)) return 365;
  if (/spice|gewürz|salz|salt|pfeffer|pepper/.test(text)) return 730;
  return 180; // Fallback: 6 Monate
}

function parseNutrition(n?: OFFNutriments): NutritionInfo | undefined {
  if (!n) return undefined;
  // Mindestens Kalorien müssen vorhanden sein
  if (n['energy-kcal_100g'] === undefined) return undefined;
  return {
    calories: Math.round(n['energy-kcal_100g'] ?? 0),
    protein: Math.round((n.proteins_100g ?? 0) * 10) / 10,
    carbs: Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
    fat: Math.round((n.fat_100g ?? 0) * 10) / 10,
    fiber: n.fiber_100g === undefined ? undefined : Math.round(n.fiber_100g * 10) / 10,
    sugar: n.sugars_100g === undefined ? undefined : Math.round(n.sugars_100g * 10) / 10,
    salt: n.salt_100g === undefined ? undefined : Math.round(n.salt_100g * 10) / 10,
  };
}

function pickCategory(categories?: string): string | undefined {
  if (!categories) return undefined;
  // Nimm die erste, menschenlesbare Kategorie
  const parts = categories.split(',').map(c => c.trim());
  return parts[0] || undefined;
}

/**
 * Holt Produktdaten von OpenFoodFacts anhand des Barcodes.
 * Gibt `null` zurück wenn das Produkt nicht gefunden wurde.
 */
export async function fetchProductByBarcode(barcode: string): Promise<Product | null> {
  try {
    const url = `${BASE_URL}/${barcode}?fields=product_name,product_name_de,brands,categories,categories_tags,quantity,image_front_url,image_front_small_url,origins,origins_tags,conservation_conditions,nutriments`;
    
    const res = await fetch(url, {
      headers: { 'User-Agent': 'KitchenHub/1.0 (https://github.com/kitchenhub)' },
    });

    if (!res.ok) return null;
    
    const data: OFFResponse = await res.json();
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    const name = p.product_name_de || p.product_name || '';
    if (!name) return null;

    const nutrition = parseNutrition(p.nutriments);
    const shelfLife = estimateShelfLife(p.categories_tags, name);

    return {
      id: `off-${barcode}`,
      barcode,
      name,
      brand: p.brands || undefined,
      category: pickCategory(p.categories),
      weight: p.quantity || undefined,
      image_url: p.image_front_url || p.image_front_small_url || undefined,
      origin: p.origins || undefined,
      storage_info: p.conservation_conditions || undefined,
      nutrition,
      default_shelf_life: shelfLife,
    };
  } catch {
    return null;
  }
}
