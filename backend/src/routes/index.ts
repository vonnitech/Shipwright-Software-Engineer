/**
 * Route dispatcher.
 * Maps request methods + paths to handler functions.
 * Supports parameterized routes (/resource/:id).
 */

export type RouteHandler = (
  req: Request,
  ...params: string[]
) => Response | Promise<Response>;

interface RouteEntry {
  method: string;
  handler: RouteHandler;
  pattern: RegExp;
  paramCount: number;
}

const routes: RouteEntry[] = [];

/**
 * Register a route with optional path parameters.
 */
export function registerRoute(
  method: string,
  path: string,
  handler: RouteHandler
): void {
  const paramCount = (path.match(/:\w+/g) || []).length;
  const regexStr =
    "^" +
    path
      .split("/")
      .map((segment) => {
        if (segment.startsWith(":")) {
          return "([^/]+)";
        }
        return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("/") +
    "$";

  routes.push({
    method,
    handler,
    pattern: new RegExp(regexStr),
    paramCount,
  });
}

/**
 * Match an incoming request and return [handler, extracted params].
 */
export function matchRoute(
  method: string,
  pathname: string
): { handler: RouteHandler; params: string[] } | null {
  for (const entry of routes) {
    if (entry.method !== method) continue;
    const match = pathname.match(entry.pattern);
    if (match) {
      return {
        handler: entry.handler,
        params: match.slice(1),
      };
    }
  }
  return null;
}

// ---- Require all route modules to register themselves ----
import "./health";
import "./auth";
import "./feature-requests";