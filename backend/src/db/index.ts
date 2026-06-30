/**
 * Database layer — wraps the team-db CLI for Turso SQLite access.
 *
 * team-db takes one SQL statement per call and returns JSON.
 * This module provides helpers for common operations.
 */

import { execSync } from "child_process";

export interface DbResult {
  [key: string]: unknown;
}

/**
 * Execute a SQL statement via team-db CLI.
 * Returns parsed JSON result array.
 */
export function db(query: string): DbResult[] {
  const safeQuery = query.replace(/"/g, '\\"');
  try {
    const command = process.env.TEST_DB 
      ? `sqlite3 -json ${process.env.TEST_DB} "${safeQuery}"`
      : `team-db "${safeQuery}"`;
    const output = execSync(command, {
      encoding: "utf-8",
      timeout: 10_000,
    });
    return JSON.parse(output.trim() || "[]");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Database error: ${msg}`);
  }
}

/**
 * Execute a write query and return the result.
 */
export function dbWrite(query: string): DbResult[] {
  return db(query);
}

/**
 * Generate a UUID v4.
 */
export function uuid(): string {
  return crypto.randomUUID();
}

/**
 * Get the current ISO datetime string.
 */
export function now(): string {
  return new Date().toISOString().replace("T", " ").replace(/\.\d+Z$/, "");
}