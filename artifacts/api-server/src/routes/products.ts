import { Router, type IRouter } from "express";
import { db, productsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { logger } from "../lib/logger";

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

const SEED_PRODUCTS = [
  { slug: "lampada", name: "Smart Lâmpada Wi-Fi RGB+", price: "75.98", originalPrice: "109.99", image: "/lampada-rgb2.png", category: "Iluminação Smart", description: "16 milhões de cores RGB+. Controle por voz Alexa. App IzySmart PT-BR. Bivolt.", badge: "🔥 Mais vendido", installments: "3x R$ 25,33", rating: "5.0", reviewCount: "1.240", sortOrder: 1 },
  { slug: "echodot", name: "Alexa Echo Dot Amazon", price: "734.40", originalPrice: "949.90", image: "/produtos/echo-dot.jpg", category: "Assistente de Voz", description: "Controle a casa com a voz. Som 360°. Sensor de temperatura. Bivolt.", badge: "⭐ Amazon", installments: "6x R$ 122,40", rating: "5.0", reviewCount: "15.290", sortOrder: 2 },
  { slug: "echopop", name: "Alexa Echo Pop Amazon", price: "606.40", originalPrice: "769.90", image: "/produtos/echo-pop.jpg", category: "Assistente de Voz", description: "Design compacto. Som frontal nítido. Alexa integrada. Ideal para quartos.", badge: "✨ Novo", installments: "6x R$ 101,07", rating: "5.0", reviewCount: "8.430", sortOrder: 3 },
  { slug: "echoshow5", name: "Alexa Echo Show 5", price: "978.60", originalPrice: "1299.00", image: "/produtos/echo-show5.jpg", category: "Assistente de Voz", description: "Tela de 5,5\". Câmera 2MP. Alexa integrada. Controle central da casa.", badge: null, installments: "6x R$ 163,10", rating: "5.0", reviewCount: "6.180", sortOrder: 4 },
  { slug: "echoshow8", name: "Alexa Echo Show 8", price: "2518.60", originalPrice: "3199.00", image: "/produtos/echo-show8.jpg", category: "Assistente de Voz", description: "Tela HD 8\". Câmera 13MP. Som estéreo. Controle central premium.", badge: "🏆 Premium", installments: "12x R$ 209,88", rating: "5.0", reviewCount: "3.920", sortOrder: 5 },
  { slug: "tomada", name: "Tomada Inteligente Wi-Fi", price: "66.58", originalPrice: "99.90", image: "/produtos/tomada.jpg", category: "Tomadas Smart", description: "16A com monitor de energia. Agendamentos automáticos. Alexa e Google.", badge: null, installments: "3x R$ 22,19", rating: "4.9", reviewCount: "4.560", sortOrder: 6 },
  { slug: "fitaled", name: "Fita LED Wi-Fi RGB", price: "145.19", originalPrice: "199.90", image: "/produtos/fita-led.jpg", category: "Iluminação Smart", description: "5m RGB+branco. Recorte a cada 10cm. Alexa e Google Home. App PT-BR.", badge: null, installments: "3x R$ 48,40", rating: "4.8", reviewCount: "2.870", sortOrder: 7 },
  { slug: "aspirador", name: "Aspirador Robô Inteligente", price: "839.99", originalPrice: "1149.00", image: "/produtos/aspirador.jpg", category: "Robôs Smart", description: "Mapeamento LiDAR. 4000Pa sucção. App + Alexa. Esquiva obstáculos.", badge: "🤖 LiDAR", installments: "6x R$ 140,00", rating: "4.9", reviewCount: "1.650", sortOrder: 8 },
  { slug: "fechadura", name: "Fechadura Biométrica Smart", price: "415.98", originalPrice: "599.00", image: "/produtos/fechadura.jpg", category: "Segurança Smart", description: "Biometria + senha + app + chave. 100 digitais. Histórico de acessos.", badge: "🔐 Segurança", installments: "6x R$ 69,33", rating: "4.8", reviewCount: "2.340", sortOrder: 9 },
  { slug: "camdomes", name: "Câmera Doméstica Wi-Fi", price: "107.82", originalPrice: "169.90", image: "/produtos/camera-dom.jpg", category: "Câmeras Smart", description: "360° pan-tilt. 1080p FullHD. Visão noturna 10m. Detecção de movimento.", badge: null, installments: "3x R$ 35,94", rating: "4.7", reviewCount: "3.890", sortOrder: 10 },
  { slug: "camseg", name: "Câmera Segurança Externa", price: "231.84", originalPrice: "329.00", image: "/produtos/camera-seg.jpg", category: "Câmeras Smart", description: "IP67. 2K Ultra HD. Visão noturna colorida. Detecção pessoa/veículo.", badge: "🏠 IP67", installments: "6x R$ 38,64", rating: "4.8", reviewCount: "1.730", sortOrder: 11 },
  { slug: "camespia", name: "Câmera Espiã Wi-Fi", price: "47.16", originalPrice: "79.90", image: "/produtos/camera-espia.jpg", category: "Câmeras Smart", description: "Mini câmera disfarçada. 1080p. Visão noturna. Detecção movimento.", badge: "🔍 Mini", installments: "3x R$ 15,72", rating: "4.6", reviewCount: "2.150", sortOrder: 12 },
  { slug: "cortina", name: "Cortina Motorizada Alexa", price: "1010.66", originalPrice: "1399.00", image: "/produtos/cortina1.jpg", category: "Automação Residencial", description: "Motor silencioso. App + Alexa + Google. Programação horária. Bivolt.", badge: "🏠 Smart", installments: "12x R$ 84,22", rating: "4.8", reviewCount: "920", sortOrder: 13 },
  { slug: "persiana", name: "Persiana Elétrica Wi-Fi", price: "138.96", originalPrice: "219.00", image: "/produtos/cortina2.jpg", category: "Automação Residencial", description: "Controle por app, voz ou controle remoto. Instalação sem fio.", badge: null, installments: "3x R$ 46,32", rating: "4.7", reviewCount: "480", sortOrder: 14 },
  { slug: "luminaria", name: "Luminária de Teto Wi-Fi RGB", price: "172.62", originalPrice: "249.00", image: "/produtos/luminaria.jpg", category: "Iluminação Smart", description: "36W RGB+Branco. Plafon LED. Alexa e Google Home. TuyaSmart PT-BR.", badge: "✨ Novo", installments: "3x R$ 57,54", rating: "4.8", reviewCount: "1.140", sortOrder: 15 },
  { slug: "controle", name: "Controle Remoto Universal Wi-Fi", price: "75.51", originalPrice: "119.90", image: "/produtos/controle.jpg", category: "Controles Smart", description: "IR + RF universal. +100k modelos. Alexa e Google. TV, AC, som e mais.", badge: "🔥 Custo-benefício", installments: "3x R$ 25,17", rating: "4.8", reviewCount: "3.290", sortOrder: 16 },
  { slug: "alimentador", name: "Alimentador Automático Pet Wi-Fi", price: "479.84", originalPrice: "699.00", image: "/produtos/alimentador.jpg", category: "Pet Smart", description: "6L. Câmera HD bidirecional. 12 refeições/dia. Bateria backup.", badge: "🐾 Pets", installments: "6x R$ 79,97", rating: "4.9", reviewCount: "2.010", sortOrder: 17 },
];

export async function seedProductsIfNeeded() {
  try {
    const existing = await db.select({ id: productsTable.id }).from(productsTable);
    if (existing.length === 0) {
      await db.insert(productsTable).values(SEED_PRODUCTS as any);
      logger.info("Produtos iniciais inseridos no banco de dados");
    }
  } catch (err) {
    logger.warn(err, "Seed de produtos ignorado (tabela pode não existir ainda)");
  }
}

router.get("/products", async (req, res) => {
  try {
    const products = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.active, true))
      .orderBy(asc(productsTable.sortOrder));
    res.json({ products });
  } catch (err) {
    req.log.error(err, "Erro ao buscar produtos");
    res.status(500).json({ error: "Erro ao buscar produtos." });
  }
});

router.get("/admin/products", requireAdmin, async (req, res) => {
  try {
    const products = await db
      .select()
      .from(productsTable)
      .orderBy(asc(productsTable.sortOrder));
    res.json({ products });
  } catch (err) {
    req.log.error(err, "Erro ao buscar produtos admin");
    res.status(500).json({ error: "Erro ao buscar produtos." });
  }
});

router.post("/admin/products", requireAdmin, async (req, res) => {
  const { slug, name, price, originalPrice, image, category, description, badge, installments, rating, reviewCount } = req.body as Record<string, string>;
  if (!slug || !name || !price || !image || !category || !description) {
    res.status(400).json({ error: "Campos obrigatórios: slug, name, price, image, category, description" });
    return;
  }
  try {
    const [product] = await db.insert(productsTable).values({
      slug, name, price,
      originalPrice: originalPrice || null,
      image, category, description,
      badge: badge || null,
      installments: installments || null,
      rating: rating || "5.0",
      reviewCount: reviewCount || "0",
    }).returning();
    res.json({ product });
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "Já existe um produto com esse slug." });
    } else {
      req.log.error(err, "Erro ao criar produto");
      res.status(500).json({ error: "Erro ao criar produto." });
    }
  }
});

router.patch("/admin/products/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const body = req.body as Record<string, any>;
  try {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    const fields = ["name","price","originalPrice","image","category","description","badge","installments","rating","reviewCount","sortOrder"];
    fields.forEach(f => { if (body[f] !== undefined) updates[f === "originalPrice" ? "originalPrice" : f] = body[f]; });
    if (body.active !== undefined) updates.active = Boolean(body.active);
    if (body.originalPrice !== undefined) updates.originalPrice = body.originalPrice || null;

    const [product] = await db.update(productsTable)
      .set(updates)
      .where(eq(productsTable.id, id))
      .returning();
    if (!product) { res.status(404).json({ error: "Produto não encontrado." }); return; }
    res.json({ product });
  } catch (err) {
    req.log.error(err, "Erro ao atualizar produto");
    res.status(500).json({ error: "Erro ao atualizar produto." });
  }
});

router.delete("/admin/products/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  try {
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err, "Erro ao excluir produto");
    res.status(500).json({ error: "Erro ao excluir produto." });
  }
});

export default router;
