# Shipwright Backend

Production-quality backend service for client SaaS builds.

## Tech Stack

- **Runtime:** [Bun](https://bun.sh) v1.2+
- **Language:** TypeScript (strict mode)
- **HTTP server:** `Bun.serve` (no framework — lightweight route dispatch)

## Directory Structure

```
src/
├── index.ts           # Entry point — Bun.serve, route registration, dispatch
├── auth/
│   └── index.ts       # HMAC-signed tokens (createToken / verifyToken)
├── routes/            # Request handlers, one file per resource
│   ├── index.ts       # Route table + dispatcher (registerRoute / matchRoute)
│   ├── health.ts      # GET /health
│   ├── auth.ts        # POST /auth/signup, POST /auth/login
│   └── feature-requests.ts  # Feature request board CRUD, voting, admin
├── db/
│   └── index.ts       # db() query helper (sqlite3 / team-db), uuid(), now()
└── middleware/
    ├── index.ts       # Barrel — middleware wiring
    └── auth.ts        # getUserFromRequest / requireAdmin
scripts/
└── smoke.sh           # End-to-end curl smoke test against a throwaway DB
tests/
├── setup.sql          # Schema (users, feature_requests, votes)
├── setup-test-db.ts   # bun test preload — isolated SQLite per run
├── health.test.ts
├── feature-requests.test.ts
└── integration.test.ts
```

## Conventions

- **One file per route/resource** in `src/routes/`. Group related routes (e.g. `users.ts`, `projects.ts`).
- **Route handlers** are plain functions: `(req: Request, ...params: string[]) => Response | Promise<Response>`. Path params (`/resource/:id`) arrive as positional arguments.
- **Register handlers in the route module itself** with `registerRoute(METHOD, path, handler)`, then side-effect import the module from `src/index.ts`. Do **not** import route modules from `src/routes/index.ts` — route modules import `registerRoute` from it, and ES imports are hoisted, so that cycle registers routes before the route table exists.
- **Auth** is a bearer token: `Authorization: Bearer <token>`. Use `getUserFromRequest(req)` for an optional caller and `requireAdmin(user)` (throws `AuthError` with a status) where admin is required.
- **Database** access goes through `db()` in `src/db/index.ts`. `TEST_DB=<path>` makes it use a local `sqlite3` file; otherwise it uses the team's shared `team-db` CLI.
- **No business logic in route handlers** — extract it to service modules under `src/` as the project grows.

## Environment Variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | HTTP port |
| `AUTH_SECRET` | *(dev-only fallback)* | HMAC secret for auth tokens. **Required in production** — the server refuses to sign/verify tokens with the fallback when `NODE_ENV=production`. |
| `TEST_DB` | *(unset)* | Path to a local SQLite file. When set, `db()` shells out to `sqlite3 -json <file>` instead of `team-db`. |

## How to Run

```bash
bun install

bun run dev     # dev server with file watching
bun run start   # production start
bun run check   # type-check (tsc --noEmit)
bun test        # unit + integration tests (isolated SQLite, see bunfig.toml)
bun run smoke   # end-to-end curl smoke test on a spare port
```

The server starts on the port from `PORT` env var (default `3001`).

### Health check

```bash
curl http://localhost:3001/health
# → {"status":"ok","service":"shipwright-engineering"}
```

## API

Response shapes match `site/src/lib/api.ts` (the frontend client). Errors are `{ "error": string }`.

| Method | Path | Auth | Response |
| --- | --- | --- | --- |
| GET | `/health` | — | `{ status, service }` |
| POST | `/auth/signup` | — | `{ user, token }` — 201 new, 200 existing |
| POST | `/auth/login` | — | `{ user, token }` — 404 unknown email |
| GET | `/api/feature-requests?page=&per_page=` | optional | `{ items, total, page, per_page, total_pages }` |
| GET | `/api/feature-requests/:id` | optional | `FeatureRequest` — 404 if missing |
| POST | `/api/feature-requests` | user | `FeatureRequest` — 201 |
| PATCH | `/api/feature-requests/:id` | admin | `FeatureRequest` — 401/403/404/400 |
| POST | `/api/feature-requests/:id/vote` | user | `{ vote_count, has_voted }` (toggles) |

`FeatureRequest` = `{ id, title, description, status, vote_count, user_id, created_at, updated_at, author_name, author_email, has_voted }`.

`status` is one of `open`, `under-review`, `planned`, `in-progress`, `done`, `declined`.
`title` ≤ 120 chars, `description` ≤ 2000 chars.

## Tests

`bunfig.toml` preloads `tests/setup-test-db.ts`, which creates a throwaway SQLite
database from `tests/setup.sql` for every `bun test` run, so tests never touch
the shared `team-db`. `tests/integration.test.ts` additionally spawns the real
server on port 3333 with its own `test.db`, and removes it afterwards.
