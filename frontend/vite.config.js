import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// strictPort: always use 5173, because the backend CORS only allows that URL
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
});
