import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Mappe l'alias `@/` (défini dans tsconfig) pour que Vitest résolve les imports
// comme Next.js. `@` → ./src.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
