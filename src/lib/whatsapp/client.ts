import { createHmac, timingSafeEqual } from "node:crypto";

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v23.0";

export function whatsappConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/** Sends a plain text message through the WhatsApp Cloud API. */
export async function sendText(to: string, body: string): Promise<void> {
  if (!whatsappConfigured()) {
    console.info(`[whatsapp:dry-run] to ${to}:\n${body}`);
    return;
  }
  let res: Response;
  try {
    res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN?.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: { preview_url: true, body },
        }),
      },
    );
  } catch (err) {
    console.error("WhatsApp send failed (network)", err);
    return;
  }
  if (!res.ok) console.error(`WhatsApp send failed (${res.status}): ${await res.text().catch(() => "")}`);
}

/** Meta signs webhook POSTs with HMAC-SHA256 of the raw body using the app secret. */
export function isValidMetaSignature(rawBody: string, header: string | null, appSecret: string): boolean {
  if (!header?.startsWith("sha256=")) return false;
  const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(header);
  return a.length === b.length && timingSafeEqual(a, b);
}

export interface IncomingText {
  from: string;
  name: string | null;
  text: string;
  messageId: string;
}

/** Pulls text messages (and button/list replies) out of a Cloud API webhook payload. */
export function extractIncomingTexts(payload: unknown): IncomingText[] {
  const out: IncomingText[] = [];
  const entries = (payload as { entry?: unknown[] })?.entry ?? [];
  for (const entry of entries as { changes?: { value?: Record<string, unknown> }[] }[]) {
    for (const change of entry.changes ?? []) {
      const value = change.value ?? {};
      const contacts = (value.contacts as { wa_id: string; profile?: { name?: string } }[]) ?? [];
      const messages = (value.messages as Record<string, unknown>[]) ?? [];
      for (const m of messages) {
        const from = String(m.from ?? "");
        let text: string | undefined;
        if (m.type === "text") text = (m.text as { body?: string })?.body;
        else if (m.type === "button") text = (m.button as { text?: string })?.text;
        else if (m.type === "interactive") {
          const i = m.interactive as { button_reply?: { id: string }; list_reply?: { id: string } };
          text = i.button_reply?.id ?? i.list_reply?.id;
        }
        if (!from || !text) continue;
        const contact = contacts.find((c) => c.wa_id === from);
        out.push({ from, name: contact?.profile?.name ?? null, text, messageId: String(m.id ?? "") });
      }
    }
  }
  return out;
}
