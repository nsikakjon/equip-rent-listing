import { createHmac, timingSafeEqual } from "node:crypto";
import type { Booking } from "./types";

const API = "https://api.paystack.co";

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

export function paystackConfigured(): boolean {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

/**
 * Paystack needs an email. WhatsApp renters often have none, so we fall back to a
 * phone-based address on our own domain (receipts then go nowhere, which is fine:
 * we send our own receipt over WhatsApp).
 */
export function payerEmail(booking: Pick<Booking, "renter_email" | "renter_phone">): string {
  if (booking.renter_email) return booking.renter_email;
  const domain = process.env.PAYSTACK_FALLBACK_EMAIL_DOMAIN || "renters.equiprent.ng";
  return `${booking.renter_phone}@${domain}`;
}

/**
 * Starts a Paystack checkout. Money settles into our own account (no split), and the
 * owner payout is released manually after return and inspection, escrow-style.
 */
export async function initializeCheckout(booking: Booking, callbackUrl: string): Promise<string> {
  // Paystack references are single-use, so add a suffix in case the renter retries.
  const reference = `${booking.reference}-${Date.now().toString(36).toUpperCase()}`;
  const res = await fetch(`${API}/transaction/initialize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secretKey().trim()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: payerEmail(booking),
      amount: booking.total_due_kobo,
      currency: "NGN",
      reference,
      callback_url: callbackUrl,
      metadata: { booking_reference: booking.reference, renter_phone: booking.renter_phone },
    }),
  });
  const body = (await res.json()) as { status: boolean; message: string; data?: { authorization_url: string } };
  if (!res.ok || !body.status || !body.data) throw new Error(`Paystack: ${body.message}`);
  return body.data.authorization_url;
}

export interface VerifiedTransaction {
  reference: string;
  amountKobo: number;
  bookingReference: string | null;
  paidAt: string | null;
}

/** Confirms a transaction with Paystack's API. Never trust a webhook body or redirect alone. */
export async function verifyTransaction(reference: string): Promise<VerifiedTransaction | null> {
  const res = await fetch(`${API}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey().trim()}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const body = (await res.json()) as {
    data?: {
      status: string;
      reference: string;
      amount: number;
      currency: string;
      paid_at: string | null;
      metadata?: { booking_reference?: string } | string | null;
    };
  };
  const d = body.data;
  if (!d || d.status !== "success" || d.currency !== "NGN") return null;
  const meta = typeof d.metadata === "object" && d.metadata ? d.metadata : {};
  return {
    reference: d.reference,
    amountKobo: d.amount,
    bookingReference: meta.booking_reference ?? null,
    paidAt: d.paid_at,
  };
}

/** Paystack signs webhooks with HMAC-SHA512 of the raw body using the secret key. */
export function isValidPaystackSignature(rawBody: string, signature: string | null, key = secretKey()): boolean {
  if (!signature) return false;
  const expected = createHmac("sha512", key).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
