# Shipwright Backend

Production-quality backend service for client SaaS builds.

## Tech Stack

- **Runtime:** [Bun](https://bun.sh) v1.2+
- **Language:** TypeScript (strict mode)
- **HTTP server:** `Bun.serve` (no framework — lightweight route dispatch)

## Directory Structure

```
src/
├── index.ts          # Entry point — Bun.serve starts here
├── routes/           # Request handlers, one file per resource
│   ├── index.ts      # Route table + dispatcher
│   └── health.ts     # GET /health
├── db/               # Database connection, queries, migrations
│   └── index.ts      # Barrel — connection setup goes here
└── middleware/        # Logging, auth, CORS, error handling
    └── index.ts      # Barrel — middleware wiring goes here
```

## Conventions

- **One file per route/resource** in `src/routes/`. Group related routes (e.g. `users.ts`, `projects.ts`).
- **Route handlers** are plain functions: `(req: ServerRequest) => Response | Promise<Response>`.
- **Register every handler** in `src/routes/index.ts`'s route map.
- **Middleware** (logging, auth, CORS) is wired into `src/middleware/index.ts` and pulled into the request pipeline.
- **Database** setup lives in `src/db/index.ts`. Use the team's Turso SQLite (`team-db` CLI) for shared data.
- **No business logic in route handlers** — extract it to service modules under `src/` as the project grows.

## How to Run

```bash
# Install dependencies
bun install

# Start dev server (with file watching)
bun run dev

# Start production
bun run start

# Type-check
bun run check
```

The server starts on the port from `PORT` env var (default `3001`).

### Health check

```bash
curl http://localhost:3001/health
# → {"status":"ok","service":"shipwright-engineering"}
```