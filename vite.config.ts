import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { createHtmlPlugin } from "vite-plugin-html";
import preact from "@preact/preset-vite";
import config from "./config.json";

const baseUrl = "/";

// https://vitejs.dev/config/
export default defineConfig({
  root: "./client",
  base: baseUrl,
  build: { outDir: "../dist" },
  server: { hmr: { port: config.hmrPort } },
  plugins: [
    tsconfigPaths(),
    preact(),
    createHtmlPlugin({ minify: true, inject: { data: { baseUrl } } }),
  ],
  css: {
    postcss: "./postcss.config.js",
  },
});
