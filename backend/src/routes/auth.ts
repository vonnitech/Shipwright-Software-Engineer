/**
 * Auth routes — signup and login (passwordless, email + name).
 */

import { registerRoute } from "./index";
import { createToken } from "../auth/index";
import { db, uuid } from "../db/index";

interface AuthBody {
  email?: string;
  name?: string;
}

async function parseBody(req: Request): Promise<AuthBody> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

/**
 * POST /auth/signup — Create account or return existing.
 */
async function handleSignup(req: Request): Promise<Response> {
  const body = await parseBody(req);
  const { email, name } = body;

  if (!email || !name) {
    return new Response(
      JSON.stringify({ error: "email and name are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (typeof email !== "string" || typeof name !== "string") {
    return new Response(
      JSON.stringify({ error: "email and name must be strings" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const safeEmail = email.replace(/'/g, "''");
  const existing = db(
    `SELECT id, name, email, role FROM users WHERE email = '${safeEmail}'`
  );

  if (existing.length > 0) {
    const u = existing[0];
    const token = createToken(u.id as string, u.role as string);
    return new Response(
      JSON.stringify({
        user: { id: u.id, name: u.name, email: u.email, role: u.role },
        token,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  const id = uuid();
  const safeName = name.replace(/'/g, "''");
  db(
    `INSERT INTO users (id, name, email, role) VALUES ('${id}', '${safeName}', '${safeEmail}', 'user')`
  );

  const token = createToken(id, "user");
  return new Response(
    JSON.stringify({
      user: { id, name, email, role: "user" },
      token,
    }),
    { status: 201, headers: { "Content-Type": "application/json" } }
  );
}

/**
 * POST /auth/login — Returns token for existing user.
 */
async function handleLogin(req: Request): Promise<Response> {
  const body = await parseBody(req);
  const { email } = body;

  if (!email) {
    return new Response(
      JSON.stringify({ error: "email is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const safeEmail = (email as string).replace(/'/g, "''");
  const users = db(
    `SELECT id, name, email, role FROM users WHERE email = '${safeEmail}'`
  );

  if (users.length === 0) {
    return new Response(
      JSON.stringify({ error: "User not found. Please sign up first." }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const u = users[0];
  const token = createToken(u.id as string, u.role as string);
  return new Response(
    JSON.stringify({
      user: { id: u.id, name: u.name, email: u.email, role: u.role },
      token,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

registerRoute("POST", "/auth/signup", handleSignup);
registerRoute("POST", "/auth/login", handleLogin);