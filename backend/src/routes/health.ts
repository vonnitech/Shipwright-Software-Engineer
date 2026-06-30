import { registerRoute } from "./index";

export interface HealthResponse {
  status: string;
  service: string;
}

/**
 * GET /health — Returns service health status.
 */
export function handleHealth(_req: Request): Response {
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