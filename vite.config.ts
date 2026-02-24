import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    proxy: {
      "/rest": "http://localhost:8000",
      "/auth": "http://localhost:8000",
      "/storage": "http://localhost:8000",
      "/realtime": "http://localhost:8000",
      "/ollama": {
        target: "http://localhost:11434",
        rewrite: (path) => path.replace(/^\/ollama/, ""),
      },
    },
  },
});
