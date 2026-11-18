import { verifyTransaction } from "./paystack";
import type { Store } from "./store/types";
import type { Booking } from "./types";

/**
 * Marks a booking paid after confirming the Paystack transaction server-side.
 * Idempotent: safe to call from both the webhook and the checkout redirect.
 */
export async function confirmPaystackPayment(
  store: Store,
  paystackReference: string,
): Promise<Booking | null> {
  const tx = await verifyTransaction(paystackReference);
  if (!tx) return null;
  const bookingRef = tx.bookingReference ?? paystackReference.replace(/-[A-Z0-9]+$/, "");
  const booking = await store.getBookingByReference(bookingRef);
  if (!booking) return null;
  if (booking.status === "paid" || booking.paid_at) return booking;
  if (tx.amountKobo < booking.total_due_kobo) {
    console.error(`Underpayment on ${bookingRef}: got ${tx.amountKobo}, expected ${booking.total_due_kobo}`);
    return booking;
  }
  return store.updateBooking(bookingRef, {
    status: "paid",
    payment_provider: "paystack",
    payment_reference: tx.reference,
    paid_at: tx.paidAt ?? new Date().toISOString(),
  });
}
