/**
 * Auth tokens — HMAC-SHA256 signed, stateless.
 *
 * Token format:  base64url(JSON payload) "." base64url(HMAC-SHA256(payload))
 *
 * The signing secret comes from process.env.AUTH_SECRET. When it is not set we
 * fall back to a clearly-labelled DEV-ONLY constant so local development and
 * tests work out of the box; the fallback is refused in production, so a
 * deployment without AUTH_SECRET fails loudly instead of shipping a secret that
 * anyone can read from this repository.
 *
 * Tokens are deterministic for a given (userId, role) pair — no timestamp, no
 * expiry. That keeps login idempotent (repeated logins return the same token),
 * which the integration tests assert. Expiry/rotation is a follow-up concern.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export interface TokenPayload {
  /** Subject — the user id. Standard JWT-style claim name. */
  sub: string;
  /** Same value as `sub`, exposed under an explicit name for route code. */
  userId: string;
  role: string;
}

/** DEV ONLY. Never used when AUTH_SECRET is set, and rejected in production. */
const DEV_FALLBACK_SECRET =
  "dev-only-insecure-shipwright-auth-secret-do-not-use-in-production";

let warnedAboutFallback = false;

function getSecret(): string {
  const configured = process.env.AUTH_SECRET?.trim();
  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET is not set. Refusing to sign or verify tokens with the " +
        "dev-only fallback secret in production."
    );
  }

  if (!warnedAboutFallback) {
    warnedAboutFallback = true;
    console.warn(
      "[auth] AUTH_SECRET is not set — using the DEV-ONLY fallback secret. " +
        "Set AUTH_SECRET before deploying."
    );
  }
  return DEV_FALLBACK_SECRET;
}

function sign(payloadB64: string): string {
  return createHmac("sha256", getSecret()).update(payloadB64).digest("base64url");
}

/**
 * Create a signed token for a user.
 */
export function createToken(userId: string, role: string): string {
  if (!userId) {
    throw new Error("createToken: userId is required");
  }
  if (!role) {
    throw new Error("createToken: role is required");
  }

  const payloadB64 = Buffer.from(
    JSON.stringify({ sub: userId, role }),
    "utf8"
  ).toString("base64url");

  return `${payloadB64}.${sign(payloadB64)}`;
}

/**
 * Verify a token's signature and return its payload, or null if the token is
 * malformed, tampered with, or signed with a different secret.
 */
export function verifyToken(token: string): TokenPayload | null {
  if (typeof token !== "string" || token.length === 0) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }

  const [payloadB64, signature] = parts;

  let expected: string;
  try {
    expected = sign(payloadB64);
  } catch {
    // e.g. AUTH_SECRET missing in production — treat as "not authenticated".
    return null;
  }

  const provided = Buffer.from(signature, "utf8");
  const wanted = Buffer.from(expected, "utf8");
  if (provided.length !== wanted.length || !timingSafeEqual(provided, wanted)) {
    return null;
  }

  try {
    const raw = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8")
    ) as { sub?: unknown; role?: unknown };

    if (typeof raw?.sub !== "string" || typeof raw?.role !== "string") {
      return null;
    }
    if (!raw.sub || !raw.role) {
      return null;
    }

    return { sub: raw.sub, userId: raw.sub, role: raw.role };
  } catch {
    return null;
  }
}
