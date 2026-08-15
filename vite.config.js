import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const cardStoreDirectory = path.join(projectRoot, ".data");
const cardStorePath = path.join(cardStoreDirectory, "menuvv-cards.json");

function readCards() {
  try {
    return JSON.parse(fs.readFileSync(cardStorePath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Menuvv card store could not be read:", error);
    }
    return {};
  }
}

function writeCards(cards) {
  fs.mkdirSync(cardStoreDirectory, { recursive: true });
  const temporaryPath = `${cardStorePath}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(cards, null, 2));
  fs.renameSync(temporaryPath, cardStorePath);
}

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Content-Length", Buffer.byteLength(body));
  response.end(body);
}

function cardsApiPlugin() {
  return {
    name: "menuvv-card-api",
    configureServer(server) {
      server.middlewares.use("/api/cards", (request, response, next) => {
        const requestUrl = new URL(request.url || "/", "http://localhost");
        const slug = decodeURIComponent(requestUrl.pathname.replace(/^\/+|\/+$/g, ""));
        const cards = readCards();

        if (request.method === "GET" && slug) {
          const card = cards[slug];
          if (!card) {
            sendJson(response, 404, { error: "Rate card not found." });
            return;
          }
          sendJson(response, 200, card);
          return;
        }

        if (request.method === "POST" && !slug) {
          let body = "";
          let receivedBytes = 0;
          const maxBodyBytes = 10 * 1024 * 1024;

          request.on("data", chunk => {
            receivedBytes += chunk.length;
            if (receivedBytes > maxBodyBytes) {
              request.destroy();
              return;
            }
            body += chunk;
          });
          request.on("end", () => {
            try {
              const parsed = JSON.parse(body);
              const cardSlug = String(parsed.slug || "")
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, "")
                .slice(0, 64);

              if (!cardSlug || !Array.isArray(parsed.payload)) {
                sendJson(response, 400, { error: "A card slug and payload are required." });
                return;
              }

              cards[cardSlug] = {
                slug: cardSlug,
                payload: parsed.payload,
                updatedAt: new Date().toISOString()
              };
              writeCards(cards);
              sendJson(response, 200, { ok: true, slug: cardSlug });
            } catch (error) {
              sendJson(response, 400, { error: "The card data could not be saved." });
            }
          });
          return;
        }

        if (request.method === "GET" || request.method === "POST") {
          sendJson(response, 404, { error: "Rate card endpoint not found." });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [cardsApiPlugin()],
  server: {
    host: "0.0.0.0",
    port: 5000,
    strictPort: true,
    allowedHosts: true
  },
  preview: {
    host: "0.0.0.0",
    port: 5000,
    strictPort: true,
    allowedHosts: true
  }
});