/**
 * Auth middleware helpers.
 *
 * Routes stay thin: they ask for the caller (getUserFromRequest) and, where an
 * admin is required, call requireAdmin(user), which throws an AuthError carrying
 * the HTTP status the handler should return (401 unauthenticated, 403 not admin).
 */

import { verifyToken } from "../auth/index";

export interface AuthenticatedUser {
  userId: string;
  role: string;
}

/**
 * Error carrying the HTTP status a route handler should return.
 */
export class AuthError extends Error {
  readonly status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

/**
 * Pull a bearer token out of the request.
 * Accepts `Authorization: Bearer <token>` (the contract the frontend uses),
 * a bare token in Authorization, and the x-auth-token / x-access-token aliases.
 */
export function getTokenFromRequest(req: Request): string | null {
  // Headers.get() is case-insensitive.
  const authorization = req.headers.get("authorization");
  if (authorization) {
    const match = /^Bearer\s+(\S+)\s*$/i.exec(authorization.trim());
    if (match) {
      return match[1];
    }
    const bare = authorization.trim();
    if (bare.length > 0) {
      return bare;
    }
  }

  const alias =
    req.headers.get("x-auth-token") ?? req.headers.get("x-access-token");
  return alias && alias.trim().length > 0 ? alias.trim() : null;
}

/**
 * Resolve the caller from the request, or null when unauthenticated.
 */
export function getUserFromRequest(req: Request): AuthenticatedUser | null {
  const token = getTokenFromRequest(req);
  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  return { userId: payload.userId, role: payload.role };
}

/**
 * Require an admin caller. Throws AuthError(401) when there is no user and
 * AuthError(403) when the user is not an admin. Returns the user when allowed.
 */
export function requireAdmin(user: AuthenticatedUser | null): AuthenticatedUser {
  if (!user) {
    throw new AuthError("Authentication required", 401);
  }
  if (user.role !== "admin") {
    throw new AuthError("Forbidden — admin access required", 403);
  }
  return user;
}
