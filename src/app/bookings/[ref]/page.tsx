import Link from "next/link";
import { notFound } from "next/navigation";
import { changeBookingOptions } from "@/app/actions";
import { STATUS_LABEL } from "@/lib/bookings";
import { formatNaira } from "@/lib/pricing";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

const maskPhone = (p: string) => p.replace(/^(\d{6})\d+(\d{2})$/, "$1•••••$2");

export default async function BookingPage({ params, searchParams }: PageProps<"/bookings/[ref]">) {
  const { ref } = await params;
  const sp = await searchParams;
  const store = getStore();
  const booking = await store.getBookingByReference(ref);
  if (!booking) notFound();
  const listing = await store.getListing(booking.listing_id);
  const payable = booking.status === "requested" || booking.status === "confirmed";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {sp.paid && (
        <p className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-ok">Payment received. We&apos;ll call you shortly to confirm delivery.</p>
      )}
      {sp.pay === "unavailable" && (
        <p className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-amber-800">
          Online payment isn&apos;t switched on yet. We&apos;ll WhatsApp you a payment link to complete this booking.
        </p>
      )}
      {(sp.pay === "failed" || sp.pay === "pending") && (
        <p className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-amber-800">
          We couldn&apos;t confirm your payment yet. If you were charged, it will show here within a few minutes.
        </p>
      )}

      <p className="text-sm text-muted">Booking</p>
      <h1 className="font-mono text-3xl font-bold tracking-tight">{booking.reference}</h1>
      <p className="mt-2 inline-block rounded-full bg-brand px-3 py-1 text-sm font-semibold text-brand-ink">{STATUS_LABEL[booking.status]}</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="mb-3 font-semibold">Details</h2>
          <dl className="space-y-2 text-sm">
            <Item k="Equipment" v={listing ? <Link className="underline" href={`/equipment/${listing.id}`}>{listing.title}</Link> : `#${booking.listing_id}`} />
            <Item k="Start" v={new Date(booking.start_date + "T00:00:00Z").toLocaleDateString("en-GB", { dateStyle: "medium", timeZone: "UTC" })} />
            <Item k="Duration" v={`${booking.days} day${booking.days === 1 ? "" : "s"}`} />
            <Item k="Renter" v={`${booking.renter_name} · ${maskPhone(booking.renter_phone)}`} />
            <Item k="Site" v={booking.site_address || "Not given yet"} />
            <Item k="Delivery" v={booking.wants_delivery ? (booking.delivery_kobo != null ? formatNaira(booking.delivery_kobo) : "To be quoted") : "Collecting myself"} />
          </dl>
        </section>

        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="mb-3 font-semibold">Price</h2>
          <dl className="space-y-2 text-sm">
            <Money k="Rental" v={booking.rental_kobo} />
            {booking.operator_kobo > 0 && <Money k="Operator" v={booking.operator_kobo} />}
            <Money k="Service fee" v={booking.service_fee_kobo} />
            {booking.waiver_kobo > 0 && <Money k="Damage waiver" v={booking.waiver_kobo} />}
            <Money k="Refundable deposit" v={booking.deposit_kobo} />
            <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
              <dt>{payable ? "Total to pay" : "Total paid"}</dt>
              <dd>{formatNaira(booking.total_due_kobo)}</dd>
            </div>
          </dl>
          {payable && (
            <form action={`/bookings/${booking.reference}/pay`} method="post" className="mt-4">
              <button className="btn w-full py-3 text-base">Pay {formatNaira(booking.total_due_kobo)} with Paystack</button>
            </form>
          )}
        </section>
      </div>

      {payable && listing && (
        <form action={changeBookingOptions} className="mt-6 space-y-3 rounded-xl border border-line bg-surface p-5 text-sm">
          <h2 className="font-semibold">Change options before paying</h2>
          <input type="hidden" name="reference" value={booking.reference} />
          <label className="flex items-center gap-2">
            <input type="checkbox" name="damageWaiver" defaultChecked={booking.damage_waiver} /> Damage waiver (10% of rental, lower deposit)
          </label>
          {listing.operator_available && (
            <label className="flex items-center gap-2">
              <input type="checkbox" name="withOperator" defaultChecked={booking.with_operator} /> Add an operator ({formatNaira(listing.operator_daily_kobo)}/day)
            </label>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="siteAddress" defaultValue={booking.site_address} placeholder="Site address" className="field" />
            <input name="email" type="email" defaultValue={booking.renter_email ?? ""} placeholder="Email for receipt" className="field" />
          </div>
          <button className="btn-ghost">Update price</button>
        </form>
      )}

      <p className="mt-8 text-sm text-muted">
        Your payment is held by EquipRent and only released to the owner after the equipment is returned and inspected. Questions? Message us
        on WhatsApp with your booking reference.
      </p>
    </div>
  );
}

function Item({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right">{v}</dd>
    </div>
  );
}

function Money({ k, v }: { k: string; v: number }) {
  return <Item k={k} v={formatNaira(v)} />;
}
