import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// Configures Vite with Tailwind CSS v4 plugin
export default defineConfig({
  plugins: [tailwindcss()],
});
