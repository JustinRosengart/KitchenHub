# KitchenHub

A smart kitchen inventory management app. Scan barcodes to add products, track expiry dates, and let a local AI generate recipe ideas from whatever is currently in your fridge.

## Features

- **Barcode scanning** – plug in a USB/Bluetooth barcode scanner and scan products directly; product data is fetched automatically from [OpenFoodFacts](https://world.openfoodfacts.org/)
- **Inventory management** – add and consume items with quantity tracking and best-before dates
- **Product details** – view nutritional information, brand, weight, origin and storage tips per product
- **AI recipe suggestions** – select ingredients from your inventory and stream recipe ideas from a local [Ollama](https://ollama.com/) instance (Markdown-rendered output)
- **Status indicators** – live connection status for the Supabase database and Ollama

## Tech Stack

| Layer        | Technology                         |
| ------------ | ---------------------------------- |
| Frontend     | React 19, TypeScript, Vite         |
| Styling      | Tailwind CSS v4, MUI (Material UI) |
| Database     | Supabase (self-hosted)             |
| Product data | OpenFoodFacts API                  |
| AI / LLM     | Ollama (local, streaming)          |

## Prerequisites

- **Node.js** ≥ 18
- **Supabase** running locally on `http://localhost:8000`
- **Ollama** running locally on `http://localhost:11434`

## Getting Started

```bash
# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env

# Start the dev server
npm run dev
```

The Vite dev server proxies `/rest`, `/auth`, `/storage` and `/realtime` to the local Supabase instance and `/ollama` to Ollama, so no CORS configuration is required.

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Database Schema

Two tables are expected in Supabase:

**`products`**

| Column               | Type  | Description                  |
| -------------------- | ----- | ---------------------------- |
| `id`                 | uuid  | Primary key                  |
| `barcode`            | text  | EAN / UPC barcode            |
| `name`               | text  | Product name                 |
| `brand`              | text  | Brand                        |
| `category`           | text  | Category                     |
| `weight`             | text  | e.g. `500g`, `1L`            |
| `image_url`          | text  | Product image                |
| `origin`             | text  | Country of origin            |
| `storage_info`       | text  | Storage instructions         |
| `nutrition`          | jsonb | Nutritional values per 100 g |
| `default_shelf_life` | int   | Estimated shelf life in days |

**`inventory`**

| Column       | Type        | Description        |
| ------------ | ----------- | ------------------ |
| `id`         | uuid        | Primary key        |
| `product_id` | uuid        | FK → products      |
| `mhd`        | date        | Best-before date   |
| `quantity`   | int         | Number of units    |
| `added_at`   | timestamptz | Timestamp of entry |

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Type-check and build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Project Structure

```
src/
├── components/
│   ├── ScannerView.tsx        # Barcode scanner + add/consume flow
│   ├── InventoryView.tsx      # Inventory list with expiry tracking
│   ├── RecipeView.tsx         # AI recipe generation via Ollama
│   ├── ProductDetailModal.tsx # Product info drawer
│   └── MarkdownView.tsx       # Streaming Markdown renderer
├── lib/
│   ├── supabaseClient.ts      # Supabase client setup
│   ├── ollamaClient.ts        # Ollama API (models + streaming)
│   └── openFoodFacts.ts       # OpenFoodFacts product lookup
├── types/
│   └── index.ts               # Shared TypeScript types
└── App.tsx                    # Root component + routing
```