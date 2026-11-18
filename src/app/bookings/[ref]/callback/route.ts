import { NextResponse, type NextRequest } from "next/server";
import { siteUrl } from "@/lib/bookings";
import { notifyPaid } from "@/lib/notify";
import { confirmPaystackPayment } from "@/lib/payments";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Paystack redirects here after checkout. We verify with Paystack before trusting it. */
export async function GET(req: NextRequest, ctx: RouteContext<"/bookings/[ref]/callback">) {
  const { ref } = await ctx.params;
  const back = `${siteUrl()}/bookings/${ref}`;
  const reference = req.nextUrl.searchParams.get("reference");
  if (!reference || !reference.startsWith(ref)) return NextResponse.redirect(back, 303);
  const store = getStore();
  const before = await store.getBookingByReference(ref);
  const booking = await confirmPaystackPayment(store, reference);
  if (booking?.status === "paid" && before?.status !== "paid") {
    await notifyPaid(booking, await store.getListing(booking.listing_id));
  }
  return NextResponse.redirect(booking?.status === "paid" ? `${back}?paid=1` : `${back}?pay=pending`, 303);
}
