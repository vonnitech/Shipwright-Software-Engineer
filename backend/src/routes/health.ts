import type { ServerRequest } from "bun";
import { registerRoute } from "./index";

export interface HealthResponse {
  status: string;
  service: string;
}

/**
 * GET /health — Returns service health status.
 */
function handleHealth(_req: ServerRequest): Response {
  const body: HealthResponse = {
    status: "ok",
    service: "shipwright-engineering",
  };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

registerRoute("GET", "/health", handleHealth);