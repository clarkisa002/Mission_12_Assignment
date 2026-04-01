import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "spa-fallback",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          const url = req.url ?? "";
          if (
            req.method === "GET" &&
            url !== "/" &&
            !url.startsWith("/@") &&
            !url.startsWith("/src") &&
            !url.startsWith("/node_modules") &&
            !url.includes(".") &&
            !url.startsWith("/api")
          ) {
            req.url = "/index.html";
          }
          next();
        });
      },
    },
  ],
});
