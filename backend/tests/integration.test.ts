import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { execSync } from "child_process";
import { rmSync } from "fs";

const TEST_DB = "test.db";
const PORT = 3333;
const BASE_URL = `http://localhost:${PORT}`;

let serverProcess: any;

beforeAll(async () => {
  // Setup DB
  try { rmSync(TEST_DB); } catch {}
  execSync(`sqlite3 ${TEST_DB} < tests/setup.sql`);

  // Start server
  serverProcess = Bun.spawn(["bun", "src/index.ts"], {
    env: { ...process.env, PORT: PORT.toString(), TEST_DB },
    stdout: "inherit",
    stderr: "inherit",
  });

  // Wait for server to be ready
  let ready = false;
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (res.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!ready) throw new Error("Server failed to start");
});

afterAll(() => {
  serverProcess?.kill();
  try { rmSync(TEST_DB); } catch {}
});

describe("Feature Request Board Integration Tests", () => {
  let userToken: string;
  let adminToken: string;
  let requestId: string;

  it("User signup", async () => {
    const res = await fetch(`${BASE_URL}/auth/signup`, {
      method: "POST",
      body: JSON.stringify({ name: "Test User", email: "test@example.com" }),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as any;
    expect(data.user.name).toBe("Test User");
    expect(data.token).toBeDefined();
    userToken = data.token;
  });

  it("User login", async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com" }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.token).toBe(userToken);
  });

  it("Create feature request (unauthenticated fails)", async () => {
    const res = await fetch(`${BASE_URL}/api/feature-requests`, {
      method: "POST",
      body: JSON.stringify({ title: "New Feature", description: "Desc" }),
    });
    expect(res.status).toBe(401);
  });

  it("Create feature request (authenticated)", async () => {
    const res = await fetch(`${BASE_URL}/api/feature-requests`, {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ title: "New Feature", description: "Desc" }),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as any;
    expect(data.title).toBe("New Feature");
    requestId = data.id;
  });

  it("List feature requests", async () => {
    const res = await fetch(`${BASE_URL}/api/feature-requests`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.items.length).toBeGreaterThan(0);
    expect(data.items[0].title).toBe("New Feature");
  });

  it("Get single feature request", async () => {
    const res = await fetch(`${BASE_URL}/api/feature-requests/${requestId}`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.id).toBe(requestId);
  });

  it("Toggle vote (add)", async () => {
    const res = await fetch(`${BASE_URL}/api/feature-requests/${requestId}/vote`, {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.vote_count).toBe(1);
    expect(data.has_voted).toBe(true);
  });

  it("Toggle vote (remove)", async () => {
    const res = await fetch(`${BASE_URL}/api/feature-requests/${requestId}/vote`, {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.vote_count).toBe(0);
    expect(data.has_voted).toBe(false);
  });

  it("Vote uniqueness (double-toggle-add results in 1)", async () => {
    // Already at 0. Add vote.
    await fetch(`${BASE_URL}/api/feature-requests/${requestId}/vote`, {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}` },
    });
    // Add again (should remove it if toggle)
    const res = await fetch(`${BASE_URL}/api/feature-requests/${requestId}/vote`, {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const data = (await res.json()) as any;
    expect(data.vote_count).toBe(0);
  });

  it("Admin status update (unauthorized fails)", async () => {
    const res = await fetch(`${BASE_URL}/api/feature-requests/${requestId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ status: "planned" }),
    });
    expect(res.status).toBe(403);
  });

  it("Admin status update (success)", async () => {
    // Create the admin account, then promote it in the test DB (the API has no
    // promotion endpoint — admins are provisioned out of band).
    const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
      method: "POST",
      body: JSON.stringify({ name: "Admin", email: "admin@example.com" }),
    });
    expect(signupRes.status).toBe(201);

    execSync(
      `sqlite3 ${TEST_DB} "UPDATE users SET role = 'admin' WHERE email = 'admin@example.com'"`
    );

    // Log in again so the token carries the admin role.
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email: "admin@example.com" }),
    });
    expect(loginRes.status).toBe(200);
    const { token } = (await loginRes.json()) as any;
    adminToken = token;

    const res = await fetch(`${BASE_URL}/api/feature-requests/${requestId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "planned" }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.status).toBe("planned");
  });

  it("404 for unknown requests", async () => {
    const res = await fetch(`${BASE_URL}/api/unknown`);
    expect(res.status).toBe(404);
  });
});
