import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));
/**
 * A worktree that shares another checkout's installed packages links
 * `node_modules` to it, and Vite refuses to serve a file outside its allow list:
 * the diff worker behind `?worker&url` failed to collect with "Denied ID" in
 * every such worktree. Allowing the resolved directory keeps the shared install
 * working without widening the root itself.
 */
const nodeModules = realpathSync(`${root}node_modules`);

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: { fs: { allow: [root, nodeModules] } },
  test: {
    environment: "happy-dom",
    include: [
      "src/**/*.test.{ts,tsx}",
      "scripts/**/*.test.ts",
      "tools/**/*.test.ts",
    ],
  },
});
