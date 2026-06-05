import { Router, type IRouter } from "express";
import { db, ordersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod/v4";

const router: IRouter = Router();

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "nexhome-admin-2024";

function requireAdmin(req: any, res: any, next: any) {
  const token = req.headers["x-admin-token"] ?? req.query.token;
  if (token !== ADMIN_TOKEN) {
    res.status(401).json({ error: "Não autorizado." });
    return;
  }
  next();
}

router.get("/admin/orders", requireAdmin, async (req, res) => {
  try {
    const orders = await db
      .select()
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt));
    res.json({ orders });
  } catch (err) {
    req.log.error(err, "Erro ao buscar pedidos");
    res.status(500).json({ error: "Erro ao buscar pedidos." });
  }
});

router.patch("/admin/orders/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { status, notes, supplierLinks } = req.body as {
    status?: string;
    notes?: string;
    supplierLinks?: string;
  };

  const validStatuses = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"] as const;
  type OrderStatus = typeof validStatuses[number];

  try {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (status && validStatuses.includes(status as OrderStatus)) {
      updates.status = status as OrderStatus;
    }
    if (notes !== undefined) updates.notes = notes;
    if (supplierLinks !== undefined) updates.supplierLinks = supplierLinks;

    const [updated] = await db
      .update(ordersTable)
      .set(updates)
      .where(eq(ordersTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Pedido não encontrado." });
      return;
    }
    res.json({ order: updated });
  } catch (err) {
    req.log.error(err, "Erro ao atualizar pedido");
    res.status(500).json({ error: "Erro ao atualizar pedido." });
  }
});

export default router;
