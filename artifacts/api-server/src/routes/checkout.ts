import { Router, type IRouter } from "express";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { db, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendNewOrderNotification } from "../lib/mailer";

const router: IRouter = Router();

router.post("/checkout", async (req, res) => {
  const { items, customer, address, back_urls } = req.body as {
    items: { name: string; price: number; qty: number }[];
    customer: { name: string; email: string; phone: string; cpf: string };
    address: {
      zip: string; street: string; number: string; complement?: string;
      neighborhood: string; city: string; state: string;
    };
    back_urls?: { success?: string; failure?: string; pending?: string };
  };

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: "Carrinho vazio ou inválido." });
    return;
  }
  if (!customer?.name || !customer?.email || !customer?.phone || !customer?.cpf) {
    res.status(400).json({ error: "Dados do cliente incompletos." });
    return;
  }
  if (!address?.zip || !address?.street || !address?.number || !address?.city) {
    res.status(400).json({ error: "Endereço incompleto." });
    return;
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    req.log.error("MP_ACCESS_TOKEN não configurado");
    res.status(500).json({ error: "Gateway de pagamento não configurado." });
    return;
  }

  const totalAmount = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  try {
    const [order] = await db.insert(ordersTable).values({
      status: "pending",
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerCpf: customer.cpf,
      addressZip: address.zip,
      addressStreet: address.street,
      addressNumber: address.number,
      addressComplement: address.complement ?? null,
      addressNeighborhood: address.neighborhood,
      addressCity: address.city,
      addressState: address.state,
      items: items as any,
      totalAmount: totalAmount.toFixed(2),
    }).returning();

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        external_reference: String(order.id),
        items: items.map((i) => ({
          id: i.name.toLowerCase().replace(/\s+/g, "-"),
          title: i.name,
          quantity: i.qty,
          unit_price: i.price,
          currency_id: "BRL",
        })),
        payer: {
          name: customer.name,
          email: customer.email,
          phone: { number: customer.phone },
          identification: { type: "CPF", number: customer.cpf.replace(/\D/g, "") },
          address: {
            zip_code: address.zip.replace(/\D/g, ""),
            street_name: address.street,
            street_number: String(Number(address.number) || 0),
          },
        },
        back_urls: {
          success: back_urls?.success ?? "",
          failure: back_urls?.failure ?? "",
          pending: back_urls?.pending ?? "",
        },
        auto_return: "approved",
        payment_methods: { installments: 12 },
        statement_descriptor: "NEXHOME",
      },
    });

    await db.update(ordersTable)
      .set({ mpPreferenceId: result.id ?? null })
      .where(eq(ordersTable.id, order.id));

    res.json({
      orderId: order.id,
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    });
  } catch (err: unknown) {
    req.log.error(err, "Erro ao criar preferência Mercado Pago");
    res.status(502).json({ error: "Erro ao conectar com o Mercado Pago." });
  }
});

router.post("/webhook/mercadopago", async (req, res) => {
  const { type, data } = req.body as { type?: string; data?: { id?: string } };
  if (type === "payment" && data?.id) {
    try {
      const accessToken = process.env.MP_ACCESS_TOKEN;
      if (accessToken) {
        const mpRes = await fetch(
          `https://api.mercadopago.com/v1/payments/${data.id}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (mpRes.ok) {
          const payment = await mpRes.json() as {
            status?: string; external_reference?: string;
            id?: number;
          };
          const orderId = Number(payment.external_reference);
          if (orderId) {
            const statusMap: Record<string, "paid" | "pending" | "cancelled"> = {
              approved: "paid",
              pending: "pending",
              in_process: "pending",
              rejected: "cancelled",
              cancelled: "cancelled",
            };
            const newStatus = statusMap[payment.status ?? ""] ?? "pending";
            const [updated] = await db.update(ordersTable)
              .set({
                status: newStatus,
                mpPaymentId: String(payment.id ?? data.id),
                updatedAt: new Date(),
              })
              .where(eq(ordersTable.id, orderId))
              .returning();

            if (newStatus === "paid" && updated) {
              const orderItems = Array.isArray(updated.items)
                ? (updated.items as { name: string; price: number; qty: number }[])
                : [];
              await sendNewOrderNotification({
                orderId: updated.id,
                customerName: updated.customerName,
                customerEmail: updated.customerEmail,
                customerPhone: updated.customerPhone,
                customerCpf: updated.customerCpf,
                addressStreet: updated.addressStreet,
                addressNumber: updated.addressNumber,
                addressComplement: updated.addressComplement,
                addressNeighborhood: updated.addressNeighborhood,
                addressCity: updated.addressCity,
                addressState: updated.addressState,
                addressZip: updated.addressZip,
                items: orderItems,
                totalAmount: updated.totalAmount,
                mpPaymentId: updated.mpPaymentId,
              });
            }
          }
        }
      }
    } catch (err) {
      req.log.error(err, "Erro ao processar webhook MP");
    }
  }
  res.sendStatus(200);
});

export default router;
