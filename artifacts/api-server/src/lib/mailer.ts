import nodemailer from "nodemailer";
import { logger } from "./logger";

function createTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export interface OrderEmailData {
  orderId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCpf: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement?: string | null;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  items: { name: string; price: number; qty: number }[];
  totalAmount: string;
  mpPaymentId?: string | null;
}

export async function sendNewOrderNotification(order: OrderEmailData) {
  const transport = createTransport();
  if (!transport) {
    logger.warn("GMAIL_USER ou GMAIL_APP_PASSWORD não configurados — e-mail não enviado");
    return;
  }

  const adminEmail = process.env.GMAIL_USER!;
  const itemsHtml = order.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #1C2E4A;color:#D6E8FF;">${i.qty}× ${i.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #1C2E4A;color:#D6E8FF;text-align:right;">R$ ${(i.price * i.qty).toFixed(2).replace(".", ",")}</td>
        </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#020408;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#101D35;border:1px solid #1C2E4A;border-radius:16px;overflow:hidden;">
    
    <div style="background:linear-gradient(135deg,#0E6FE8,#2589FF);padding:28px 32px;">
      <div style="font-size:1.6rem;font-weight:700;color:#fff;letter-spacing:.05em;">⚡ Nex<span style="color:#0CF">Home</span></div>
      <div style="color:rgba(255,255,255,.8);font-size:.85rem;margin-top:4px;">Novo pedido recebido!</div>
    </div>

    <div style="padding:28px 32px;">
      <div style="background:#152240;border:1px solid #1C2E4A;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
        <div style="font-size:.7rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#6B8BAF;margin-bottom:6px;">Pedido</div>
        <div style="font-size:1.6rem;font-weight:700;color:#0CF;">#${order.orderId}</div>
        ${order.mpPaymentId ? `<div style="font-size:.75rem;color:#6B8BAF;margin-top:4px;">ID Mercado Pago: ${order.mpPaymentId}</div>` : ""}
      </div>

      <div style="margin-bottom:20px;">
        <div style="font-size:.7rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#6B8BAF;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #1C2E4A;">👤 Cliente</div>
        <div style="color:#D6E8FF;font-size:.88rem;line-height:1.8;">
          <b>${order.customerName}</b><br>
          📧 ${order.customerEmail}<br>
          📱 ${order.customerPhone}<br>
          🪪 CPF: ${order.customerCpf}
        </div>
      </div>

      <div style="margin-bottom:20px;">
        <div style="font-size:.7rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#6B8BAF;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #1C2E4A;">📍 Endereço de Entrega</div>
        <div style="color:#D6E8FF;font-size:.88rem;line-height:1.8;">
          ${order.addressStreet}, ${order.addressNumber}${order.addressComplement ? " " + order.addressComplement : ""}<br>
          ${order.addressNeighborhood}<br>
          ${order.addressCity} – ${order.addressState}<br>
          CEP: ${order.addressZip}
        </div>
      </div>

      <div style="margin-bottom:20px;">
        <div style="font-size:.7rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#6B8BAF;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #1C2E4A;">🛒 Itens do Pedido</div>
        <table style="width:100%;border-collapse:collapse;">
          ${itemsHtml}
          <tr>
            <td style="padding:12px 12px 4px;font-weight:700;color:#fff;font-size:.9rem;">Total</td>
            <td style="padding:12px 12px 4px;font-weight:700;color:#0CF;font-size:1.1rem;text-align:right;">R$ ${parseFloat(order.totalAmount).toFixed(2).replace(".", ",")}</td>
          </tr>
        </table>
      </div>

      <div style="text-align:center;margin-top:24px;">
        <a href="${process.env.ADMIN_URL ?? ""}/admin.html" style="display:inline-block;background:linear-gradient(135deg,#0E6FE8,#2589FF);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:.88rem;">Ver no Painel Admin →</a>
      </div>
    </div>

    <div style="padding:16px 32px;border-top:1px solid #1C2E4A;text-align:center;color:#6B8BAF;font-size:.72rem;">
      NexHome · Notificação automática de pedido
    </div>
  </div>
</body>
</html>`;

  try {
    await transport.sendMail({
      from: `"NexHome Pedidos" <${adminEmail}>`,
      to: adminEmail,
      subject: `🛒 Novo pedido #${order.orderId} — R$ ${parseFloat(order.totalAmount).toFixed(2).replace(".", ",")}`,
      html,
    });
    logger.info({ orderId: order.orderId }, "E-mail de notificação enviado");
  } catch (err) {
    logger.error(err, "Erro ao enviar e-mail de notificação");
  }
}
