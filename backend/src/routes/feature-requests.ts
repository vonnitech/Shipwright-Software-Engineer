/**
 * Feature Request routes — CRUD, voting, admin status updates.
 * Each handler receives (req, ...params) where params come from the URL.
 */

import { registerRoute } from "./index";
import { db, uuid, now } from "../db/index";
import { getUserFromRequest, requireAdmin } from "../middleware/auth";

// ---- Helpers ----

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function parseBody(req: Request): Promise<Record<string, unknown>> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

function sanitize(val: string): string {
  return val.replace(/'/g, "''");
}

// ---- GET /api/feature-requests ----

function handleListFeatureRequests(req: Request): Response {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const perPage = Math.min(
    50,
    Math.max(1, parseInt(url.searchParams.get("per_page") ?? "10", 10))
  );
  const offset = (page - 1) * perPage;

  const total = db("SELECT COUNT(*) as count FROM feature_requests");
  const totalCount = (total[0]?.count ?? 0) as number;

  const rows = db(
    `SELECT fr.id, fr.title, fr.description, fr.status, fr.vote_count,
            fr.created_at, fr.updated_at,
            u.name as author_name, u.email as author_email
     FROM feature_requests fr
     JOIN users u ON fr.user_id = u.id
     ORDER BY fr.vote_count DESC, fr.created_at DESC
     LIMIT ${perPage} OFFSET ${offset}`
  );

  return json({
    data: rows,
    pagination: {
      page,
      per_page: perPage,
      total: totalCount,
      total_pages: Math.ceil(totalCount / perPage),
    },
  });
}

// ---- GET /api/feature-requests/:id ----

function handleGetFeatureRequest(
  _req: Request,
  id: string
): Response {
  const rows = db(
    `SELECT fr.id, fr.title, fr.description, fr.status, fr.vote_count,
            fr.created_at, fr.updated_at,
            u.name as author_name, u.email as author_email
     FROM feature_requests fr
     JOIN users u ON fr.user_id = u.id
     WHERE fr.id = '${sanitize(id)}'`
  );

  if (rows.length === 0) {
    return json({ error: "Feature request not found" }, 404);
  }

  return json({ data: rows[0] });
}

// ---- POST /api/feature-requests ----

async function handleCreateFeatureRequest(
  req: Request
): Promise<Response> {
  const user = getUserFromRequest(req);
  if (!user) {
    return json({ error: "Authentication required" }, 401);
  }

  const body = await parseBody(req);
  const title =
    typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";

  if (!title) {
    return json({ error: "title is required" }, 400);
  }
  if (title.length > 120) {
    return json({ error: "title must be 120 characters or fewer" }, 400);
  }
  if (!description) {
    return json({ error: "description is required" }, 400);
  }
  if (description.length > 2000) {
    return json({ error: "description must be 2000 characters or fewer" }, 400);
  }

  const id = uuid();
  const ts = now();

  db(
    `INSERT INTO feature_requests (id, title, description, user_id, created_at, updated_at)
     VALUES ('${id}', '${sanitize(title)}', '${sanitize(description)}', '${sanitize(user.id)}', '${ts}', '${ts}')`
  );

  const rows = db(
    `SELECT fr.id, fr.title, fr.description, fr.status, fr.vote_count,
            fr.created_at, fr.updated_at,
            u.name as author_name, u.email as author_email
     FROM feature_requests fr
     JOIN users u ON fr.user_id = u.id
     WHERE fr.id = '${id}'`
  );

  return json({ data: rows[0] }, 201);
}

// ---- PATCH /api/feature-requests/:id (admin only) ----

async function handleUpdateFeatureRequest(
  req: Request,
  id: string
): Promise<Response> {
  const user = getUserFromRequest(req);
  try {
    requireAdmin(user);
  } catch {
    return json({ error: "Forbidden — admin access required" }, 403);
  }

  const body = await parseBody(req);
  const status = typeof body.status === "string" ? body.status : "";

  const validStatuses = [
    "open",
    "under-review",
    "planned",
    "in-progress",
    "done",
    "declined",
  ];

  if (status && !validStatuses.includes(status)) {
    return json(
      { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
      400
    );
  }

  const existing = db(
    `SELECT id FROM feature_requests WHERE id = '${sanitize(id)}'`
  );
  if (existing.length === 0) {
    return json({ error: "Feature request not found" }, 404);
  }

  const ts = now();
  const updates: string[] = [`updated_at = '${ts}'`];

  if (status) {
    updates.push(`status = '${sanitize(status)}'`);
  }

  db(
    `UPDATE feature_requests SET ${updates.join(", ")} WHERE id = '${sanitize(
      id
    )}'`
  );

  const rows = db(
    `SELECT fr.id, fr.title, fr.description, fr.status, fr.vote_count,
            fr.created_at, fr.updated_at,
            u.name as author_name, u.email as author_email
     FROM feature_requests fr
     JOIN users u ON fr.user_id = u.id
     WHERE fr.id = '${sanitize(id)}'`
  );

  return json({ data: rows[0] });
}

// ---- POST /api/feature-requests/:id/vote ----

function handleToggleVote(
  _req: Request,
  id: string
): Response {
  const user = getUserFromRequest(_req);
  if (!user) {
    return json({ error: "Authentication required" }, 401);
  }

  const existing = db(
    `SELECT id FROM feature_requests WHERE id = '${sanitize(id)}'`
  );
  if (existing.length === 0) {
    return json({ error: "Feature request not found" }, 404);
  }

  const existingVote = db(
    `SELECT id FROM votes
     WHERE user_id = '${sanitize(user.id)}'
       AND feature_request_id = '${sanitize(id)}'`
  );

  if (existingVote.length > 0) {
    db(
      `DELETE FROM votes
       WHERE user_id = '${sanitize(user.id)}'
         AND feature_request_id = '${sanitize(id)}'`
    );
    db(
      `UPDATE feature_requests SET vote_count = vote_count - 1
       WHERE id = '${sanitize(id)}'`
    );
    return json({ data: { voted: false, feature_request_id: id } });
  } else {
    const voteId = uuid();
    db(
      `INSERT INTO votes (id, user_id, feature_request_id)
       VALUES ('${voteId}', '${sanitize(user.id)}', '${sanitize(id)}')`
    );
    db(
      `UPDATE feature_requests SET vote_count = vote_count + 1
       WHERE id = '${sanitize(id)}'`
    );
    return json({ data: { voted: true, feature_request_id: id } }, 201);
  }
}

// ---- Register all Feature Request routes ----

registerRoute("GET", "/api/feature-requests", handleListFeatureRequests);
registerRoute("GET", "/api/feature-requests/:id", handleGetFeatureRequest);
registerRoute("POST", "/api/feature-requests", handleCreateFeatureRequest);
registerRoute(
  "PATCH",
  "/api/feature-requests/:id",
  handleUpdateFeatureRequest
);
registerRoute("POST", "/api/feature-requests/:id/vote", handleToggleVote);