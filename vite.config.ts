import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  base: process.env.VITE_APP_BASE,
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  server: {
    port: 3000,
    host: true,
  }
});