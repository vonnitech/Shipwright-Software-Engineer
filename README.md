# Shipwright Software Engineer — Monorepo

End-to-end SaaS engineering by a small, focused team. This monorepo contains the full stack — site, backend, and QA — for client builds delivered by **Shipwright Engineering**.

## Structure

```
site/       — Public website (TanStack Start / React + Vite + Tailwind)
backend/    — Backend API service (Bun + TypeScript)
qa/         — Test plans and QA infrastructure
```

## Tech Stack

| Layer     | Stack                         |
|-----------|-------------------------------|
| Frontend  | TanStack Start, React, Vite, Tailwind CSS |
| Backend   | Bun, TypeScript, SQLite (Turso) |
| QA        | Test plans, integration specs  |

## Getting Started

```bash
# Install dependencies for each project
cd site && bun install
cd ../backend && bun install

# Run the site
cd site && bun run dev

# Run the backend
cd backend && bun run dev
```

Port 3000 serves the public website; the backend runs on port 3001.

## Workflow

- Feature branches → pull requests → lead review → merge to `main`
- See `WORKFLOW.md` at the team-shared root for the full process.
