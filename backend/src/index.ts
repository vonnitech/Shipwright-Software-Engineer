/**
 * Shipwright Engineering — Backend Service
 *
 * Entry point. Creates a Bun.serve HTTP server with route-based dispatch.
 * Port is configured via the PORT env var (default 3001).
 */

import { matchRoute } from "./routes/index";

const PORT = parseInt(process.env.PORT ?? "3001", 10);

Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);
    const handler = matchRoute(req.method, url.pathname);

    if (!handler) {
      return new Response(JSON.stringify({ error: "Not Found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return handler(req);
  },
});

console.log(`🛠️  shipwright-backend listening on http://0.0.0.0:${PORT}`);