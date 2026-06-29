import type { ServerRequest } from "bun";

export interface HealthResponse {
  status: string;
  service: string;
}

/**
 * GET /health
 * Returns the current health status of the service.
 */
export function handleHealth(_req: ServerRequest): Response {
  const body: HealthResponse = {
    status: "ok",
    service: "shipwright-engineering",
  };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}