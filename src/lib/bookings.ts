import { quote } from "./pricing";
import type { Store } from "./store/types";
import type { Booking, Listing } from "./types";

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid misreads on WhatsApp

export function newReference(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return "ER-" + Array.from(bytes, (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join("");
}

/** Normalise a Nigerian phone number to 234XXXXXXXXXX (the format WhatsApp uses). */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (/^234\d{10}$/.test(digits)) return digits;
  if (/^0\d{10}$/.test(digits)) return "234" + digits.slice(1);
  if (/^\d{10}$/.test(digits) && /^[789]/.test(digits)) return "234" + digits;
  return null;
}

export interface BookingRequest {
  renterName: string;
  renterPhone: string;
  renterEmail?: string | null;
  siteAddress?: string;
  startDate: string; // YYYY-MM-DD
  days: number;
  withOperator: boolean;
  wantsDelivery: boolean;
  damageWaiver: boolean;
  channel: "web" | "whatsapp";
}

export async function createBookingForListing(
  store: Store,
  listing: Listing,
  req: BookingRequest,
): Promise<Booking> {
  if (listing.status !== "active") throw new Error("This listing is not available for booking.");
  const category = await store.getCategory(listing.category_slug);
  if (!category) throw new Error("Unknown category.");
  const withOperator = req.withOperator && listing.operator_available;
  const q = quote({
    dailyRateKobo: listing.daily_rate_kobo,
    days: req.days,
    commissionRate: category.commission_rate,
    isOwnInventory: listing.is_own_inventory,
    equipmentValueKobo: listing.equipment_value_kobo,
    damageWaiver: req.damageWaiver,
    withOperator,
    operatorDailyKobo: listing.operator_daily_kobo,
  });

  return store.createBooking({
    reference: newReference(),
    listing_id: listing.id,
    channel: req.channel,
    renter_name: req.renterName,
    renter_phone: req.renterPhone,
    renter_email: req.renterEmail ?? null,
    site_address: req.siteAddress ?? "",
    start_date: req.startDate,
    days: req.days,
    with_operator: withOperator,
    wants_delivery: req.wantsDelivery && listing.delivery_available,
    damage_waiver: req.damageWaiver,
    rental_kobo: q.rentalKobo,
    operator_kobo: q.operatorKobo,
    service_fee_kobo: q.serviceFeeKobo,
    waiver_kobo: q.waiverKobo,
    deposit_kobo: q.depositKobo,
    commission_kobo: q.commissionKobo,
    owner_payout_kobo: q.ownerPayoutKobo,
    total_due_kobo: q.totalDueKobo,
  });
}

export const STATUS_LABEL: Record<Booking["status"], string> = {
  requested: "Requested: we're confirming availability",
  confirmed: "Confirmed: awaiting payment",
  paid: "Paid: preparing for delivery",
  on_hire: "On hire",
  returned: "Returned: inspection in progress",
  payout_released: "Completed",
  cancelled: "Cancelled",
};

export function siteUrl(): string {
  return (process.env.PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

/** Lets the renter add an operator or toggle the damage waiver before paying. */
export async function updateBookingOptions(
  store: Store,
  reference: string,
  opts: { withOperator: boolean; damageWaiver: boolean; siteAddress?: string; renterEmail?: string | null },
): Promise<Booking | null> {
  const booking = await store.getBookingByReference(reference);
  if (!booking || !["requested", "confirmed"].includes(booking.status)) return booking;
  const listing = await store.getListing(booking.listing_id);
  const category = listing && (await store.getCategory(listing.category_slug));
  if (!listing || !category) return booking;
  const withOperator = opts.withOperator && listing.operator_available;
  const q = quote({
    dailyRateKobo: listing.daily_rate_kobo,
    days: booking.days,
    commissionRate: category.commission_rate,
    isOwnInventory: listing.is_own_inventory,
    equipmentValueKobo: listing.equipment_value_kobo,
    damageWaiver: opts.damageWaiver,
    withOperator,
    operatorDailyKobo: listing.operator_daily_kobo,
  });
  return store.updateBooking(reference, {
    with_operator: withOperator,
    damage_waiver: opts.damageWaiver,
    site_address: opts.siteAddress ?? booking.site_address,
    renter_email: opts.renterEmail ?? booking.renter_email,
    rental_kobo: q.rentalKobo,
    operator_kobo: q.operatorKobo,
    service_fee_kobo: q.serviceFeeKobo,
    waiver_kobo: q.waiverKobo,
    deposit_kobo: q.depositKobo,
    commission_kobo: q.commissionKobo,
    owner_payout_kobo: q.ownerPayoutKobo,
    total_due_kobo: q.totalDueKobo,
  });
}

/** Today's date in Lagos (UTC+1, no daylight saving) as YYYY-MM-DD. */
export function lagosTodayIso(now: Date = new Date()): string {
  return new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 10);
}
