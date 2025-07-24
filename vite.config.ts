import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(config => {
  return {
    plugins: [
      tailwindcss(),
      cloudflare()
    ]
  };
});
