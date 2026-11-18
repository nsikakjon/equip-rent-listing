"use client";

import { useActionState, useMemo, useState } from "react";
import { requestBooking, type FormState } from "@/app/actions";
import { formatNaira, quote } from "@/lib/pricing";
import type { Listing } from "@/lib/types";

export function BookingForm({ listing, commissionRate, minDate }: { listing: Listing; commissionRate: number; minDate: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(requestBooking, {});
  const [days, setDays] = useState(3);
  const [waiver, setWaiver] = useState(true);
  const [operator, setOperator] = useState(false);

  const q = useMemo(() => {
    if (!Number.isInteger(days) || days < 1) return null;
    return quote({
      dailyRateKobo: listing.daily_rate_kobo,
      days,
      commissionRate,
      isOwnInventory: listing.is_own_inventory,
      equipmentValueKobo: listing.equipment_value_kobo,
      damageWaiver: waiver,
      withOperator: operator,
      operatorDailyKobo: listing.operator_daily_kobo,
    });
  }, [days, waiver, operator, listing, commissionRate]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="listingId" value={listing.id} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="startDate">Start date</label>
          <input id="startDate" name="startDate" type="date" min={minDate} defaultValue={minDate} required className="field" />
        </div>
        <div>
          <label className="label" htmlFor="days">Days</label>
          <input
            id="days"
            name="days"
            type="number"
            min={1}
            max={365}
            value={Number.isNaN(days) ? "" : days}
            onChange={(e) => setDays(e.target.valueAsNumber)}
            required
            className="field"
          />
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <label className="flex items-start gap-2">
          <input type="checkbox" name="damageWaiver" checked={waiver} onChange={(e) => setWaiver(e.target.checked)} className="mt-0.5" />
          <span>
            <strong>Damage waiver</strong> (10% of rental). Covers accidental damage and keeps your deposit low.
          </span>
        </label>
        {listing.operator_available && (
          <label className="flex items-start gap-2">
            <input type="checkbox" name="withOperator" checked={operator} onChange={(e) => setOperator(e.target.checked)} className="mt-0.5" />
            <span>
              <strong>Add an operator</strong> ({formatNaira(listing.operator_daily_kobo)}/day)
            </span>
          </label>
        )}
        {listing.delivery_available && (
          <label className="flex items-start gap-2">
            <input type="checkbox" name="wantsDelivery" defaultChecked className="mt-0.5" />
            <span>
              <strong>Deliver to my site</strong> (quoted separately once haulage is arranged)
            </span>
          </label>
        )}
      </div>

      {q && (
        <dl className="space-y-1.5 rounded-lg bg-background p-4 text-sm">
          <Row label={`Rental (${days} × ${formatNaira(listing.daily_rate_kobo)})`} value={q.rentalKobo} />
          {q.operatorKobo > 0 && <Row label="Operator" value={q.operatorKobo} />}
          <Row label="Service fee (5%)" value={q.serviceFeeKobo} />
          {q.waiverKobo > 0 && <Row label="Damage waiver" value={q.waiverKobo} />}
          <Row label="Refundable deposit" value={q.depositKobo} />
          <div className="mt-2 flex justify-between border-t border-line pt-2 text-base font-bold">
            <dt>Total to pay</dt>
            <dd>{formatNaira(q.totalDueKobo)}</dd>
          </div>
          {!waiver && <p className="pt-1 text-xs text-muted">Without the waiver the deposit is higher: 3 days&apos; rent or 15% of the equipment value.</p>}
        </dl>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">Your name</label>
          <input id="name" name="name" required autoComplete="name" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone (WhatsApp)</label>
          <input id="phone" name="phone" required inputMode="tel" autoComplete="tel" placeholder="0803 123 4567" className="field" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="email">Email for receipt (optional)</label>
          <input id="email" name="email" type="email" autoComplete="email" className="field" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="siteAddress">Site address</label>
          <input id="siteAddress" name="siteAddress" placeholder="e.g. Plot 12, Admiralty Way, Lekki" className="field" />
        </div>
      </div>

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <button className="btn w-full py-3 text-base" disabled={pending}>
        {pending ? "Sending…" : "Request booking"}
      </button>
      <p className="text-center text-xs text-muted">You won&apos;t be charged yet. Next you&apos;ll review and pay securely.</p>
    </form>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd>{formatNaira(value)}</dd>
    </div>
  );
}
