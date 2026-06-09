import { Router } from "express";
import { db, siteSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const DEFAULT_SETTINGS: Record<string, string> = {
  hero_line1: "Sua Casa.",
  hero_line2: "Inteligente.",
  hero_line3: "Conectada ao Futuro.",
  hero_subtitle: "Os melhores dispositivos de automação residencial com os menores preços do Brasil. Controle tudo pelo celular, voz ou automações inteligentes.",
  hero_cta_primary: "Ver Kit Promocional",
  hero_cta_secondary: "Explorar produtos →",
  hero_eyebrow: "Smart Home · Tendência 2026",
  announcement_active: "false",
  announcement_text: "🚀 Frete grátis em compras acima de R$ 299!",
  announcement_bg: "#0E6FE8",
  whatsapp_number: "5511999999999",
  whatsapp_message: "Olá! Tenho interesse nos produtos OrbytStore.",
  site_name: "OrbytStore",
  site_tagline: "Casa Inteligente do Futuro",
  footer_company: "OrbytStore Comércio de Eletrônicos Ltda.",
  footer_cnpj: "XX.XXX.XXX/XXXX-XX",
  footer_city: "São Paulo/SP",
  footer_email_contact: "contato@orbytstore.com.br",
  footer_email_sac: "sac@orbytstore.com.br",
  footer_email_privacy: "privacidade@orbytstore.com.br",
  footer_email_trocas: "trocas@orbytstore.com.br",
  footer_phone: "(11) 99999-9999",
  why_title: "Por que a OrbytStore?",
  why_subtitle: "Especialistas em automação residencial com o suporte mais completo do Brasil",
  kit_title: "Kit Casa Inteligente",
  kit_subtitle: "Tudo que você precisa para transformar sua casa",
  brands_list: "POSITIVO,INTELBRAS,AMAZON,XIAOMI,TP-LINK TAPO,AQARA,ROBOROCK,GOOGLE HOME,MATTER",
};

export async function seedSettingsIfNeeded() {
  try {
    const existing = await db.select().from(siteSettingsTable);
    if (existing.length === 0) {
      const rows = Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({ key, value }));
      await db.insert(siteSettingsTable).values(rows).onConflictDoNothing();
    }
  } catch (e) {
    console.error("seedSettingsIfNeeded error:", e);
  }
}

function adminAuth(req: any, res: any, next: any) {
  const token = req.headers["x-admin-token"];
  const expected = process.env["ADMIN_TOKEN"] || "nexhome-admin-2024";
  if (token !== expected) return res.status(401).json({ error: "Unauthorized" });
  next();
}

router.get("/settings", async (_req, res) => {
  try {
    const rows = await db.select().from(siteSettingsTable);
    const obj: Record<string, string> = {};
    rows.forEach((r) => { obj[r.key] = r.value; });
    Object.entries(DEFAULT_SETTINGS).forEach(([k, v]) => {
      if (!(k in obj)) obj[k] = v;
    });
    res.json({ settings: obj });
  } catch (e) {
    res.status(500).json({ error: "Internal error" });
  }
});

router.get("/admin/settings", adminAuth, async (_req, res) => {
  try {
    const rows = await db.select().from(siteSettingsTable);
    const obj: Record<string, string> = {};
    rows.forEach((r) => { obj[r.key] = r.value; });
    Object.entries(DEFAULT_SETTINGS).forEach(([k, v]) => {
      if (!(k in obj)) obj[k] = v;
    });
    res.json({ settings: obj, defaults: DEFAULT_SETTINGS });
  } catch (e) {
    res.status(500).json({ error: "Internal error" });
  }
});

router.patch("/admin/settings", adminAuth, async (req, res): Promise<void> => {
  try {
    const updates: Record<string, string> = req.body;
    if (!updates || typeof updates !== "object") {
      res.status(400).json({ error: "Invalid body" });
      return;
    }
    for (const [key, value] of Object.entries(updates)) {
      const strVal = String(value);
      const existing = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.key, key));
      if (existing.length > 0) {
        await db.update(siteSettingsTable)
          .set({ value: strVal, updatedAt: new Date() })
          .where(eq(siteSettingsTable.key, key));
      } else {
        await db.insert(siteSettingsTable).values({ key, value: strVal });
      }
    }
    const rows = await db.select().from(siteSettingsTable);
    const obj: Record<string, string> = {};
    rows.forEach((r) => { obj[r.key] = r.value; });
    res.json({ settings: obj });
  } catch (e) {
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
