import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    // Vercel preview hostnames are generated per preview deployment.
    allowedHosts: true,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  // Expose the connected Supabase integration variables to the Vite client.
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
