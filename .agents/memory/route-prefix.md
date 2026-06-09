---
name: Route prefix doubling
description: Express routes in api-server must NOT include /api prefix — app.ts already mounts router at /api
---

## Rule
Never use `/api/...` inside route handlers in `artifacts/api-server/src/routes/*.ts`. The app already mounts all routes under `/api` via `app.use("/api", router)`. Adding the prefix again creates double-mounting (`/api/api/...`).

**Why:** `app.ts` does `app.use("/api", router)`. If a route inside the router says `/api/settings`, the real URL becomes `/api/api/settings` — a 404.

**How to apply:** Use relative paths in route files: `/settings`, `/admin/settings`, `/products`, etc. The `curl` test against `localhost:80/api/healthz` (which works) confirms the proxy strips nothing — the `/api` comes purely from `app.use`.
