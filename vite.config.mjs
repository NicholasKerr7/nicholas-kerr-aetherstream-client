import { defineConfig, transformWithOxc } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    {
      name: "load-js-files-as-jsx",
      enforce: "pre",
      async transform(code, id) {
        if (!id.match(/src\/.*\.js$/)) {
          return null;
        }

        return transformWithOxc(code, id, {
          lang: "jsx",
          jsx: {
            runtime: "automatic",
          },
        });
      },
    },
    react(),
  ],
  optimizeDeps: {
    entries: ["index.html"],
    rolldownOptions: {
      moduleTypes: {
        ".js": "jsx",
      },
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
  preview: {
    port: 3000,
    strictPort: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
  },
});
