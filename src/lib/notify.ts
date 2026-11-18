import { formatNaira } from "./pricing";
import { sendText } from "./whatsapp/client";
import type { Booking, Listing } from "./types";

/**
 * Operations alerts go to OPS_WHATSAPP_NUMBER. Note: free-form WhatsApp messages only
 * deliver inside the 24-hour customer service window, so the ops number should message
 * the business number once a day (or swap these for approved templates later).
 */
async function toOps(body: string) {
  const ops = process.env.OPS_WHATSAPP_NUMBER;
  if (!ops) return console.info(`[ops] ${body}`);
  // An alert must never break the booking or payment that triggered it.
  try {
    await sendText(ops.replace(/\D/g, ""), body);
  } catch (err) {
    console.error("Ops alert failed", err);
  }
}

export async function notifyNewBooking(b: Booking, l: Listing) {
  await toOps(
    `New booking ${b.reference} (${b.channel})\n${l.title} · #${l.id}${l.is_own_inventory ? " · own stock" : ""}\n` +
      `${b.renter_name} ${b.renter_phone}\nStart ${b.start_date} · ${b.days} days\nDue now ${formatNaira(b.total_due_kobo)}` +
      `${b.with_operator ? "\nOperator requested" : ""}${b.wants_delivery ? `\nDelivery to: ${b.site_address || "ask renter"}` : ""}`,
  );
}

export async function notifyPaid(b: Booking, l: Listing | null) {
  await toOps(`PAID ${b.reference}: ${formatNaira(b.total_due_kobo)} for ${l?.title ?? `listing #${b.listing_id}`}. Arrange delivery.`);
  await sendText(
    b.renter_phone,
    `Payment received for booking *${b.reference}*. Thank you!\n\nWe'll call you shortly to confirm delivery for ${b.start_date}. Send *status* any time.`,
  );
}

export async function notifyNewListing(l: Listing, ownerPhone: string) {
  await toOps(`New listing to review: #${l.id} ${l.title} (${l.area}) at ${formatNaira(l.daily_rate_kobo)}/day. Owner ${ownerPhone}`);
}
