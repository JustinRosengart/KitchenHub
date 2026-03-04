# KitchenHub 🍳

A smart, high-performance kitchen inventory management app. Scan barcodes to track your supplies, monitor expiry dates, and let a local AI generate recipe ideas from your current stock.

## 🚀 Features

- **Smart Barcode Scanning** – Support for physical USB/Bluetooth scanners (HID mode) and manual barcode entry.
- **Automated Data Enrichment** – Product details (name, brand, nutrition, storage info) are automatically fetched from [OpenFoodFacts](https://world.openfoodfacts.org/).
- **FIFO Consumption** – When consuming items, the app automatically suggests or removes the oldest stock first (First-In-First-Out) to minimize waste.
- **AI-Powered Chef** – Select ingredients from your inventory and stream recipe ideas from a local [Ollama](https://ollama.com/) instance using high-performance streaming.
- **Real-time Status Monitoring** – Live connection indicators for your local Supabase database and Ollama instance.
- **Modern UI/UX** – A polished, responsive interface built with Tailwind CSS v4 and Material UI, featuring smooth transitions and a mobile-first design.

## 🛠️ Tech Stack

| Layer          | Technology                                     |
| -------------- | ---------------------------------------------- |
| **Frontend**   | React 19, TypeScript, Vite 8                   |
| **Styling**    | Tailwind CSS v4, MUI (Material UI), Lucide Icons |
| **Backend/DB** | Supabase (PostgreSQL + Realtime)               |
| **Product Data** | OpenFoodFacts API                            |
| **AI / LLM**   | Ollama (Local, Llama 3 or similar)             |

## 📋 Prerequisites

- **Node.js** ≥ 20
- **Supabase** running locally (e.g., via Docker or Supabase CLI) on `http://localhost:8000`
- **Ollama** running locally on `http://localhost:11434` with a model like `llama3` or `mistral` pulled.

## ⚙️ Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   Create a `.env` file based on `.env.example`:
   ```env
   VITE_SUPABASE_URL=http://localhost:8000
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

3. **Database Setup**
   Ensure your Supabase instance has the `products` and `inventory` tables configured (see schema details below).

4. **Start development**
   ```bash
   npm run dev
   ```

The Vite dev server is configured to proxy requests to Supabase and Ollama, eliminating CORS issues during development.

## 🗄️ Database Schema

### `products`
Stores master data for scanned products.
- `barcode` (text, unique): EAN/UPC identifier.
- `name`, `brand`, `category`, `weight`: Descriptive fields.
- `nutrition` (jsonb): Macro and micro nutrients.
- `default_shelf_life` (int): Days until typical expiry.

### `inventory`
Tracks individual batches in your kitchen.
- `product_id` (uuid): Reference to `products`.
- `mhd` (date): Best-before date.
- `quantity` (int): Number of units.
- `added_at` (timestamptz): When the item was scanned.

## 📂 Project Structure

```text
src/
├── components/
│   ├── ScannerView.tsx        # Barcode logic (Add/Consume modes)
│   ├── InventoryView.tsx      # Stock list with expiry warnings
│   ├── RecipeView.tsx         # AI interaction & ingredient selection
│   ├── ProductDetailModal.tsx # Detailed product insights
│   └── MarkdownView.tsx       # Streaming AI response renderer
├── lib/
│   ├── supabaseClient.ts      # Database connection
│   ├── ollamaClient.ts        # AI streaming service
│   └── openFoodFacts.ts       # External product API wrapper
└── App.tsx                    # State orchestration & layout
```

---
*Developed with 💙 and Gemini CLI.*
