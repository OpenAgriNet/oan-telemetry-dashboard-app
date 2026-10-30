import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Local-dev proxy: set VITE_API_SERVER_URL=/v1 to avoid browser CORS
    // when calling the remote dashboard API from localhost.
    proxy: {
      "/v1": {
        target: "https://dev-dashboard-vistaar.da.gov.in",
        changeOrigin: true,
        secure: true,
      },
      "/api": {
        target: "https://dev-dashboard-vistaar.da.gov.in",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
