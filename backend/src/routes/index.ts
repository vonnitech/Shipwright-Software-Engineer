/**
 * Route dispatcher.
 * Maps request paths and methods to handler functions.
 */

import type { ServerRequest } from "bun";
import { handleHealth } from "./health";

export type RouteHandler = (req: ServerRequest) => Response | Promise<Response>;

/** Simple route table: Map<"METHOD /path", handler> */
const routes = new Map<string, RouteHandler>();

routes.set("GET /health", handleHealth);

/**
 * Match an incoming request to a registered route.
 * Returns the handler or null if no route matches.
 */
export function matchRoute(
  method: string,
  pathname: string
): RouteHandler | null {
  return routes.get(`${method} ${pathname}`) ?? null;
}