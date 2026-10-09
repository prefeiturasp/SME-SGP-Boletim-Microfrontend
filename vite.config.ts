import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5174,
    cors: true,
    strictPort: true,
  },
  preview: {
    port: 5174,
    cors: true,
    strictPort: true,
  },
  plugins: [
    react(),
    federation({
      name: "smeBoletim",
      filename: "remoteEntry.js",
      exposes: {
        "./Home": "./src/paginas/boletim/boletim.tsx",
      },
      shared: {
        react: {
          requiredVersion: "^19.2.8",
        },
        "react-dom": {
          requiredVersion: "^19.2.8",
        },
        "react-redux": {
          requiredVersion: "^8.1.3",
        },
        redux: {
          requiredVersion: "^4.0.4",
        },
        "@reduxjs/toolkit": {
          requiredVersion: "^1.9.7",
        },
        "react-router-dom": {
          requiredVersion: "^6.10.0",
        },
        antd: {
          requiredVersion: "^5.4.0",
        },
      },
    }),
    {
      name: "module-federation-debug",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.includes("remoteEntry.js")) {
            res.setHeader("Content-Type", "application/javascript");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "*");
            res.setHeader("Access-Control-Allow-Headers", "*");
            res.setHeader("Access-Control-Expose-Headers", "*");
          }
          next();
        });
      },
    },
  ],
  build: {
    modulePreload: false,
    target: "esnext",
    minify: false,
    cssCodeSplit: false,
    rollupOptions: {},
  },
});
