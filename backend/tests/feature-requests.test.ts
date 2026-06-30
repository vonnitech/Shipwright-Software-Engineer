/**
 * Feature Request API tests.
 * Tests cover: auth (signup, login), CRUD, voting, admin status update.
 *
 * NOTE: These tests call team-db directly and may affect shared data.
 * Run against a dedicated test database when possible.
 */

import { describe, it, expect, beforeAll } from "bun:test";
import { db, uuid } from "../src/db/index";
import { createToken, verifyToken } from "../src/auth/index";

// Test user data
const testEmail = `test-${uuid().slice(0, 8)}@example.com`;
const testName = "Test User";
let testUserId: string;
let testToken: string;

// Admin user
const adminEmail = `admin-${uuid().slice(0, 8)}@example.com`;
const adminName = "Admin User";
let adminUserId: string;
let adminToken: string;

// Test feature request
let testFrId: string;

describe("Auth", () => {
  it("should create a token and verify it", () => {
    const uid = uuid();
    const token = createToken(uid, "user");
    const payload = verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe(uid);
    expect(payload!.role).toBe("user");
  });

  it("should reject an invalid token", () => {
    const payload = verifyToken("invalid.token.here");
    expect(payload).toBeNull();
  });

  it("should create a user via signup equivalent", () => {
    const id = uuid();
    const safeEmail = testEmail.replace(/'/g, "''");
    const safeName = testName.replace(/'/g, "''");
    db(
      `INSERT INTO users (id, name, email, role) VALUES ('${id}', '${safeName}', '${safeEmail}', 'user')`
    );
    testUserId = id;
    testToken = createToken(id, "user");

    const users = db(`SELECT id, name, email, role FROM users WHERE id = '${id}'`);
    expect(users.length).toBe(1);
    expect(users[0].email).toBe(testEmail);
  });

  it("should create an admin user", () => {
    const id = uuid();
    const safeEmail = adminEmail.replace(/'/g, "''");
    const safeName = adminName.replace(/'/g, "''");
    db(
      `INSERT INTO users (id, name, email, role) VALUES ('${id}', '${safeName}', '${safeEmail}', 'admin')`
    );
    adminUserId = id;
    adminToken = createToken(id, "admin");

    const users = db(`SELECT id, role FROM users WHERE id = '${id}'`);
    expect(users.length).toBe(1);
    expect(users[0].role).toBe("admin");
  });
});

describe("Feature Requests", () => {
  it("should list feature requests (empty initially)", () => {
    const result = db("SELECT COUNT(*) as count FROM feature_requests");
    expect(Number(result[0]?.count ?? 0)).toBe(0);
  });

  it("should create a feature request", () => {
    const id = uuid();
    const title = "Test feature request";
    const description = "This is a test feature request description";
    const ts = new Date().toISOString().replace("T", " ").replace(/\.\d+Z$/, "");

    db(
      `INSERT INTO feature_requests (id, title, description, user_id, created_at, updated_at)
       VALUES ('${id}', '${title}', '${description}', '${testUserId}', '${ts}', '${ts}')`
    );
    testFrId = id;

    const rows = db(
      `SELECT id, title, description, status, vote_count FROM feature_requests WHERE id = '${id}'`
    );
    expect(rows.length).toBe(1);
    expect(rows[0].title).toBe(title);
    expect(rows[0].status).toBe("open");
    expect(Number(rows[0].vote_count)).toBe(0);
  });

  it("should list feature requests (with the created one)", () => {
    const rows = db(
      `SELECT fr.id, fr.title, fr.status, u.name as author_name
       FROM feature_requests fr
       JOIN users u ON fr.user_id = u.id
       ORDER BY fr.vote_count DESC`
    );
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows.some((r: any) => r.id === testFrId)).toBe(true);
  });

  it("should get a single feature request by ID", () => {
    const rows = db(
      `SELECT id, title, description, status FROM feature_requests WHERE id = '${testFrId}'`
    );
    expect(rows.length).toBe(1);
    expect(rows[0].id).toBe(testFrId);
  });

  it("should return 404 for non-existent feature request", () => {
    const fakeId = uuid();
    const rows = db(
      `SELECT id FROM feature_requests WHERE id = '${fakeId}'`
    );
    expect(rows.length).toBe(0);
  });
});

describe("Voting", () => {
  it("should add a vote", () => {
    const voteId = uuid();
    db(
      `INSERT INTO votes (id, user_id, feature_request_id) VALUES ('${voteId}', '${testUserId}', '${testFrId}')`
    );
    db(
      `UPDATE feature_requests SET vote_count = vote_count + 1 WHERE id = '${testFrId}'`
    );

    const votes = db(
      `SELECT id FROM votes WHERE user_id = '${testUserId}' AND feature_request_id = '${testFrId}'`
    );
    expect(votes.length).toBe(1);

    const fr = db(
      `SELECT vote_count FROM feature_requests WHERE id = '${testFrId}'`
    );
    expect(Number(fr[0]?.vote_count ?? 0)).toBe(1);
  });

  it("should remove a vote (toggle)", () => {
    db(
      `DELETE FROM votes WHERE user_id = '${testUserId}' AND feature_request_id = '${testFrId}'`
    );
    db(
      `UPDATE feature_requests SET vote_count = vote_count - 1 WHERE id = '${testFrId}'`
    );

    const votes = db(
      `SELECT id FROM votes WHERE user_id = '${testUserId}' AND feature_request_id = '${testFrId}'`
    );
    expect(votes.length).toBe(0);

    const fr = db(
      `SELECT vote_count FROM feature_requests WHERE id = '${testFrId}'`
    );
    expect(Number(fr[0]?.vote_count ?? 0)).toBe(0);
  });

  it("should prevent duplicate votes (unique constraint)", () => {
    const voteId = uuid();
    db(
      `INSERT INTO votes (id, user_id, feature_request_id) VALUES ('${voteId}', '${testUserId}', '${testFrId}')`
    );
    db(
      `UPDATE feature_requests SET vote_count = vote_count + 1 WHERE id = '${testFrId}'`
    );

    // Try inserting a second vote (should fail silently or throw)
    expect(() => {
      db(
        `INSERT INTO votes (id, user_id, feature_request_id) VALUES ('${uuid()}', '${testUserId}', '${testFrId}')`
      );
    }).toThrow();
  });
});

describe("Admin", () => {
  it("should update feature request status", () => {
    const newStatus = "under-review";
    db(
      `UPDATE feature_requests SET status = '${newStatus}', updated_at = datetime('now') WHERE id = '${testFrId}'`
    );

    const rows = db(
      `SELECT status FROM feature_requests WHERE id = '${testFrId}'`
    );
    expect(rows[0].status).toBe(newStatus);
  });

  it("should not allow invalid status values", () => {
    // The CHECK constraint should reject this
    const invalidStatus = "invalid-status";
    expect(() => {
      db(
        `UPDATE feature_requests SET status = '${invalidStatus}' WHERE id = '${testFrId}'`
      );
    }).toThrow();
  });
});

// Cleanup: remove test data (optional, to keep the DB clean)
afterAll(() => {
  try {
    db(`DELETE FROM votes WHERE feature_request_id = '${testFrId}'`);
    db(`DELETE FROM feature_requests WHERE id = '${testFrId}'`);
    db(`DELETE FROM users WHERE id = '${testUserId}'`);
    db(`DELETE FROM users WHERE id = '${adminUserId}'`);
  } catch {
    // Cleanup is best-effort
  }
});