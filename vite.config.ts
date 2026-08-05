import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Single-page app: the catalog and both games are hash routes inside index.html.
export default defineConfig({
  plugins: [react()],
});
