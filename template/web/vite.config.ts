import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // `mise run dev` runs Vite's dev server (this) alongside `wrangler dev`.
  // Vite serves the SPA on :5173 with HMR; whatever paths the Worker is
  // mounted on (per wrangler.jsonc `run_worker_first`) get proxied to :8787
  // so the React app sees a single-origin world. `changeOrigin` stays false
  // so the Origin header better-auth's CSRF check inspects matches what the
  // browser actually sent (http://localhost:5173, covered by BETTER_AUTH_URL
  // in dev). Add more entries here as the worker grows new top-level routes.
  server: {
    host: true,
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
})
