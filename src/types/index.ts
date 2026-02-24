export interface NutritionInfo {
  calories: number;       // kcal pro 100g
  protein: number;        // g pro 100g
  carbs: number;          // g pro 100g
  fat: number;            // g pro 100g
  fiber?: number;         // g pro 100g
  sugar?: number;         // g pro 100g
  salt?: number;          // g pro 100g
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  image_url?: string;
  category?: string;
  brand?: string;
  weight?: string;          // z.B. "500g", "1L"
  nutrition?: NutritionInfo;
  origin?: string;          // Herkunftsland
  storage_info?: string;    // Lagerungshinweis
  default_shelf_life: number;
}

export interface InventoryItem {
  id: string;
  product_id: string;
  mhd: string;
  added_at: string;
  quantity: number;
}

export interface InventoryItemWithProduct extends InventoryItem {
  product: Product;
}

export type ViewState = 'scan' | 'inventory' | 'recipes';