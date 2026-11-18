import { NextResponse, type NextRequest } from "next/server";
import { siteUrl } from "@/lib/bookings";
import { initializeCheckout, paystackConfigured } from "@/lib/paystack";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Starts Paystack checkout for a booking and redirects the renter to it. */
export async function POST(_req: NextRequest, ctx: RouteContext<"/bookings/[ref]/pay">) {
  const { ref } = await ctx.params;
  const back = `${siteUrl()}/bookings/${ref}`;
  const booking = await getStore().getBookingByReference(ref);
  if (!booking) return NextResponse.redirect(`${siteUrl()}/equipment`, 303);
  if (!["requested", "confirmed"].includes(booking.status)) return NextResponse.redirect(back, 303);
  if (!paystackConfigured()) return NextResponse.redirect(`${back}?pay=unavailable`, 303);
  try {
    const url = await initializeCheckout(booking, `${back}/callback`);
    return NextResponse.redirect(url, 303);
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(`${back}?pay=failed`, 303);
  }
}
