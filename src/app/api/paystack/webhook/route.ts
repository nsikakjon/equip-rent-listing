import { NextResponse, type NextRequest } from "next/server";
import { notifyPaid } from "@/lib/notify";
import { confirmPaystackPayment } from "@/lib/payments";
import { isValidPaystackSignature, paystackConfigured } from "@/lib/paystack";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!paystackConfigured()) return new NextResponse("Paystack not configured", { status: 500 });
  const raw = await req.text();
  if (!isValidPaystackSignature(raw, req.headers.get("x-paystack-signature"))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }
  const event = JSON.parse(raw) as { event: string; data?: { reference?: string } };
  if (event.event === "charge.success" && event.data?.reference) {
    const store = getStore();
    const before = await store.getBookingByReference(event.data.reference.replace(/-[A-Z0-9]+$/, ""));
    const booking = await confirmPaystackPayment(store, event.data.reference);
    if (booking?.status === "paid" && before?.status !== "paid") {
      await notifyPaid(booking, await store.getListing(booking.listing_id));
    }
  }
  return NextResponse.json({ ok: true });
}
