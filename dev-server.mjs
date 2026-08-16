import { createServer, loadConfigFromFile } from "vite";
import path from "node:path";

const config = await loadConfigFromFile(
  { command: "serve", mode: "development" },
  path.resolve(process.cwd(), "vite.config.js")
);

const server = await createServer({
  ...config.config,
  server: { host: "0.0.0.0", port: 5000, strictPort: true, allowedHosts: true }
});

await server.listen();
console.log("Vite dev server listening on http://0.0.0.0:5000");

process.on("SIGTERM", () => { server.close().then(() => process.exit(0)); });
process.on("SIGINT", () => { server.close().then(() => process.exit(0)); });
