/**
 * Test preload (wired up in bunfig.toml).
 *
 * Every `bun test` run gets its own throwaway SQLite database, created from
 * tests/setup.sql, and the db layer is pointed at it through TEST_DB. Without
 * this, tests that use the db layer directly (tests/feature-requests.test.ts)
 * would read and write the team's shared team-db database.
 *
 * An explicit TEST_DB in the environment wins — the integration test sets its
 * own for the server it spawns.
 */

import { afterAll } from "bun:test";
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

if (!process.env.TEST_DB) {
  const dir = mkdtempSync(join(tmpdir(), "shipwright-test-db-"));
  const dbFile = join(dir, "test.db");

  execSync(`sqlite3 "${dbFile}" < "${join(import.meta.dir, "setup.sql")}"`);

  process.env.TEST_DB = dbFile;

  // Clean up after the whole run. `process.on("exit")` is not reliable here —
  // bun's test runner tears the process down without firing it — so use a
  // global afterAll hook, with an exit handler as a belt-and-braces fallback.
  const cleanup = () => {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // Best effort — the OS clears tmp.
    }
  };

  afterAll(cleanup);
  process.on("exit", cleanup);
}
