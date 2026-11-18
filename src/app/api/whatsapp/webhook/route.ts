import { NextResponse, type NextRequest } from "next/server";
import { siteUrl } from "@/lib/bookings";
import { notifyNewBooking } from "@/lib/notify";
import { getStore } from "@/lib/store";
import { handleMessage } from "@/lib/whatsapp/bot";
import { extractIncomingTexts, isValidMetaSignature, sendText } from "@/lib/whatsapp/client";

export const dynamic = "force-dynamic";

/** Meta's one-time webhook verification handshake. */
export function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (expected && p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === expected) {
    return new NextResponse(p.get("hub.challenge") ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// Meta retries deliveries, so remember recent message ids and skip duplicates.
const seen = new Set<string>();
function firstTime(id: string) {
  if (!id || seen.has(id)) return !id;
  seen.add(id);
  if (seen.size > 5000) seen.delete(seen.values().next().value as string);
  return true;
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (secret) {
    if (!isValidMetaSignature(raw, req.headers.get("x-hub-signature-256"), secret)) {
      return new NextResponse("Invalid signature", { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return new NextResponse("WHATSAPP_APP_SECRET not configured", { status: 500 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new NextResponse("Bad JSON", { status: 400 });
  }

  const store = getStore();
  for (const msg of extractIncomingTexts(payload)) {
    if (!firstTime(msg.messageId)) continue;
    try {
      const before = await store.latestBookingForPhone(msg.from);
      const replies = await handleMessage(msg, { store, siteUrl: siteUrl() });
      for (const r of replies) await sendText(msg.from, r);
      const after = await store.latestBookingForPhone(msg.from);
      if (after && after.reference !== before?.reference) {
        const listing = await store.getListing(after.listing_id);
        if (listing) await notifyNewBooking(after, listing);
      }
    } catch (err) {
      console.error("WhatsApp handler error", err);
      await sendText(msg.from, "Sorry, something went wrong on our side. Please try again in a moment.");
    }
  }
  // Always 200 for valid deliveries so Meta doesn't retry.
  return NextResponse.json({ ok: true });
}
