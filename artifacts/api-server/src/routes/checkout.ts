import { Router, type IRouter } from "express";
import { MercadoPagoConfig, Preference } from "mercadopago";

const router: IRouter = Router();

router.post("/checkout", async (req, res) => {
  const { items, back_urls } = req.body as {
    items: { name: string; price: number; qty: number }[];
    back_urls?: { success?: string; failure?: string; pending?: string };
  };

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: "Carrinho vazio ou inválido." });
    return;
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    req.log.error("MP_ACCESS_TOKEN não configurado");
    res.status(500).json({ error: "Gateway de pagamento não configurado." });
    return;
  }

  const client = new MercadoPagoConfig({ accessToken });
  const preference = new Preference(client);

  try {
    const result = await preference.create({
      body: {
        items: items.map((i) => ({
          id: i.name.toLowerCase().replace(/\s+/g, "-"),
          title: i.name,
          quantity: i.qty,
          unit_price: i.price,
          currency_id: "BRL",
        })),
        back_urls: {
          success: back_urls?.success ?? "",
          failure: back_urls?.failure ?? "",
          pending: back_urls?.pending ?? "",
        },
        auto_return: "approved",
        payment_methods: {
          installments: 12,
        },
        statement_descriptor: "NEXHOME",
      },
    });

    res.json({
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    });
  } catch (err: unknown) {
    req.log.error(err, "Erro ao criar preferência Mercado Pago");
    res.status(502).json({ error: "Erro ao conectar com o Mercado Pago." });
  }
});

export default router;
