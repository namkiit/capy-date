import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    // Mặc định môi trường node cho test service/logic.
    // Test component thêm pragma `// @vitest-environment jsdom` ở đầu file.
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
