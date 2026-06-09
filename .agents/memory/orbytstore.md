---
name: OrbytStore project
description: Smart home e-commerce dropshipping site — key decisions and integration details.
---

# OrbytStore Key Facts

**Why:** Prevent re-discovering these non-obvious details in future sessions.

## Admin token
Default: `nexhome-admin-2024` (override via env `ADMIN_TOKEN`).

## Product slugs (17 seeded)
lampada, echodot, echopop, echoshow5, echoshow8, tomada, fitaled, aspirador, fechadura, camdomes, camseg, camespia, cortina, persiana, luminaria, controle, alimentador.

## API response shapes
- `GET /api/products` → `{ products: [...] }` (NOT a bare array)
- `GET /api/admin/orders` → `{ orders: [...] }`

**How to apply:** Any client-side JS consuming these endpoints must destructure `.products` / `.orders`.

## Public routes vs admin routes
- Public: `GET /api/products`
- Admin (require `x-admin-token` header): `/api/admin/products/*`, `/api/admin/orders/*`

## Seed
`seedProductsIfNeeded()` is called on server startup from `artifacts/api-server/src/index.ts`; it inserts 17 products only if the table is empty.
