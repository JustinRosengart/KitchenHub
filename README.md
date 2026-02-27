# 🥗 KitchenHub

**KitchenHub** is a smart, local-first kitchen inventory management application designed to reduce food waste and simplify meal planning.

By combining barcode scanning with local AI, KitchenHub helps you track what's in your fridge, monitors expiry dates, and generates creative recipes based *exactly* on what you have in stock—all without sending your personal data to the cloud.

---

## ✨ Features

### 📱 Smart Inventory Management
- **Barcode Scanning**: Supports USB/Bluetooth scanners for rapid entry.
- **Dual Modes**:
  - **Add Mode**: Fetches product metadata (name, brand, image, nutrition) automatically via [OpenFoodFacts](https://world.openfoodfacts.org/).
  - **Consume Mode**: Quickly remove items or adjust quantities as you use them.
- **Manual Entry**: Fallback for items without barcodes or internet connection.

### 🥬 Expiry Tracking
- **Traffic Light System**: Visual indicators for item freshness (Green = Good, Orange = Use Soon, Red = Expired).
- **Smart Sorting**: Inventory is automatically sorted by "Best Before" date (FIFO - First In, First Out).
- **Detailed Insights**: View nutritional values (macros), storage instructions, and origin data per product.

### 👨‍🍳 AI Chef (Local LLM)
- **Recipe Generation**: Selects ingredients from your current inventory to propose recipes.
- **Privacy First**: Runs entirely locally using [Ollama](https://ollama.com/). No API keys or cloud subscriptions required.
- **Model Selection**: Choose between different installed LLMs (e.g., Llama 3, Mistral) for variety in suggestions.
- **Streaming UI**: Watch the recipe being written in real-time with Markdown rendering.

### 🛠️ Tech & Architecture
- **Real-time Sync**: Live status indicators for Database and AI service connectivity.
- **Responsive Design**: Built for tablets and touchscreens (perfect for a kitchen dashboard).

---

## 🏗️ Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript | Modern UI with the latest React features. |
| **Build Tool** | Vite | Fast HMR and optimized builds. |
| **Styling** | Tailwind CSS v4 | Utility-first styling with the new v4 engine. |
| **UI Components** | Lucide React | Clean, consistent iconography. |
| **Database** | Supabase | Self-hosted PostgreSQL + Realtime capabilities. |
| **AI / LLM** | Ollama | Local inference server for LLMs. |
| **Data Source** | OpenFoodFacts API | Crowdsourced food product database. |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js** (v18 or higher)
- **Supabase CLI** (or a local Supabase instance running on port `8000`)
- **Ollama** (running on port `11434`)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/JustinRosengart/KitchenHub.git
    cd kitchenhub
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file in the root directory:
    ```env
    VITE_SUPABASE_URL=http://localhost:8000
    VITE_SUPABASE_ANON_KEY=your-local-supabase-anon-key
    ```

4.  **Start Backend Services**
    - Start Supabase: `supabase start`
    - Start Ollama: `ollama serve` (Ensure you have pulled a model, e.g., `ollama pull llama3`)

5.  **Run the Application**
    ```bash
    npm run dev
    ```
    Open `http://localhost:5173` in your browser.

---

## 🗄️ Database Schema

The app requires two main tables in Supabase:

### `products`
Stores static metadata about unique items (fetched from OpenFoodFacts).

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | uuid | Primary Key |
| `barcode` | text | EAN / UPC code (Unique) |
| `name` | text | Product name |
| `brand` | text | Brand name |
| `image_url` | text | URL to product image |
| `nutrition` | jsonb | JSON object with macros (fat, sugar, protein, etc.) |
| `default_shelf_life` | int | Default days until expiry |

### `inventory`
Tracks specific instances of products in your kitchen.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | uuid | Primary Key |
| `product_id` | uuid | Foreign Key → `products.id` |
| `quantity` | int | Current stock level |
| `mhd` | date | Best-before date (MHD) |
| `added_at` | timestamptz | Date of entry |

---

## 📂 Project Structure

```
src/
├── components/
│   ├── ScannerView.tsx        # Barcode handling (Add/Consume logic)
│   ├── InventoryView.tsx      # List view with expiry logic
│   ├── RecipeView.tsx         # AI integration & prompt engineering
│   ├── ProductDetailModal.tsx # Detailed product info & nutrition viz
│   └── MarkdownView.tsx       # Renderer for AI recipes
├── lib/
│   ├── supabaseClient.ts      # Database connection
│   ├── ollamaClient.ts        # AI service wrapper
│   └── openFoodFacts.ts       # External API integration
├── types/                     # TypeScript definitions
└── App.tsx                    # Main layout & routing
```

---

## 🔮 Roadmap

- [ ] **Shopping List**: Auto-generate shopping lists based on low stock or recipe requirements.
- [ ] **Consumption Stats**: Visual graphs showing what you consume most.
- [ ] **Multi-User Support**: Sync inventory across family members' devices.
- [ ] **Custom Recipes**: Save your favorite AI-generated recipes.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE.md).
