import { createBookingForListing, STATUS_LABEL } from "../bookings";
import { formatNaira } from "../pricing";
import type { Store } from "../store/types";
import type { Category, Listing } from "../types";

/**
 * WhatsApp booking assistant. Pure apart from the store, so it is easy to test:
 * give it a message, get back the replies to send.
 *
 *  hi / menu      → numbered category menu
 *  3              → listings in category 3
 *  mixer lekki    → search
 *  book 12        → asks for start date and days
 *  25/11 5        → creates the booking and sends a payment link
 *  status         → latest booking
 *  list           → link for owners to list equipment
 *  cancel         → clears the conversation
 */

type Session = { step?: "awaiting_dates"; listingId?: number };

export interface BotMessage {
  from: string;
  name: string | null;
  text: string;
}

export interface BotContext {
  store: Store;
  siteUrl: string;
  now?: Date;
}

const GREETINGS = /^(hi|hello|hey|good (morning|afternoon|evening)|menu|start|help|0)\b/i;

export async function handleMessage(msg: BotMessage, ctx: BotContext): Promise<string[]> {
  const { store } = ctx;
  const text = msg.text.trim();
  const lower = text.toLowerCase();
  const session = (await store.getSession(msg.from)) as Session;
  const categories = await store.listCategories();

  if (lower === "cancel" || lower === "stop") {
    await store.setSession(msg.from, {});
    return ["No problem, I've cleared that. Send *menu* any time to start again."];
  }

  if (lower === "status") return [await statusReply(store, msg.from)];

  if (/^(list|owner|list my equipment)$/.test(lower)) {
    return [
      `To list your equipment, fill this short form: ${ctx.siteUrl}/list\n\nWe review every listing before it goes live. Owners are paid after the equipment is returned and inspected.`,
    ];
  }

  const bookMatch = lower.match(/^book\s*#?(\d+)$/);
  if (bookMatch) return startBooking(Number(bookMatch[1]), msg, ctx);

  if (session.step === "awaiting_dates" && session.listingId) {
    const parsed = parseDatesAndDays(text, ctx.now ?? new Date());
    if (parsed) return finishBooking(session.listingId, parsed, msg, ctx);
    if (!GREETINGS.test(lower)) {
      return [
        "Sorry, I didn't catch that. Send the start date and number of days, like *25/11 5* or *tomorrow 3*. Send *cancel* to stop.",
      ];
    }
  }

  if (GREETINGS.test(lower)) return [menu(categories, msg.name)];

  const n = Number(lower);
  if (Number.isInteger(n) && n >= 1 && n <= categories.length) {
    const cat = categories[n - 1];
    const listings = await store.listListings({ category: cat.slug }, 5);
    return [listingsReply(cat.name, listings, ctx.siteUrl)];
  }

  const listings = await store.listListings({ q: text }, 5);
  if (listings.length) return [listingsReply(`"${text}"`, listings, ctx.siteUrl)];

  // Try matching a category name ("excavator" → Excavators).
  const cat = categories.find((c) => c.name.toLowerCase().includes(lower.replace(/s$/, "")));
  if (cat) return [listingsReply(cat.name, await store.listListings({ category: cat.slug }, 5), ctx.siteUrl)];

  return [`I couldn't find anything for "${text}".\n\n` + menu(categories, null)];
}

function menu(categories: Category[], name: string | null): string {
  const hello = name ? `Hi ${name.split(" ")[0]}! ` : "";
  const lines = categories.map((c, i) => `*${i + 1}* ${c.name}`);
  return (
    `${hello}Welcome to EquipRent, construction equipment for hire across Lagos.\n\n` +
    `Reply with a number, or type what you need (e.g. *mixer lekki*):\n\n${lines.join("\n")}\n\n` +
    `Send *status* to check a booking, or *list* to list your own equipment.`
  );
}

function listingsReply(title: string, listings: Listing[], siteUrl: string): string {
  if (!listings.length) return `Nothing available for ${title} right now. Send *menu* to see other categories.`;
  const lines = listings.map(
    (l) => `*#${l.id}* ${l.title}\n${formatNaira(l.daily_rate_kobo)}/day · ${l.area}\n${siteUrl}/equipment/${l.id}`,
  );
  return `${title}:\n\n${lines.join("\n\n")}\n\nReply *book <number>* to book, e.g. *book ${listings[0].id}*.`;
}

async function startBooking(listingId: number, msg: BotMessage, ctx: BotContext): Promise<string[]> {
  const listing = await ctx.store.getListing(listingId);
  if (!listing || listing.status !== "active") {
    return [`I couldn't find listing #${listingId}. Send *menu* to browse.`];
  }
  await ctx.store.setSession(msg.from, { step: "awaiting_dates", listingId });
  return [
    `*${listing.title}*\n${formatNaira(listing.daily_rate_kobo)}/day · ${listing.area}\n\n` +
      `When do you need it, and for how many days? Reply like *25/11 5* (start 25 Nov, 5 days) or *tomorrow 3*.`,
  ];
}

async function finishBooking(
  listingId: number,
  parsed: { startDate: string; days: number },
  msg: BotMessage,
  ctx: BotContext,
): Promise<string[]> {
  const listing = await ctx.store.getListing(listingId);
  await ctx.store.setSession(msg.from, {});
  if (!listing) return ["That listing is no longer available. Send *menu* to browse."];

  const b = await createBookingForListing(ctx.store, listing, {
    renterName: msg.name ?? "WhatsApp renter",
    renterPhone: msg.from,
    startDate: parsed.startDate,
    days: parsed.days,
    withOperator: false,
    wantsDelivery: listing.delivery_available,
    damageWaiver: true,
    channel: "whatsapp",
  });

  const lines = [
    `Booking *${b.reference}* for *${listing.title}*`,
    `Start ${formatDate(b.start_date)} · ${b.days} day${b.days === 1 ? "" : "s"}`,
    "",
    `Rental: ${formatNaira(b.rental_kobo)}`,
    `Service fee: ${formatNaira(b.service_fee_kobo)}`,
    `Damage waiver: ${formatNaira(b.waiver_kobo)}`,
    `Refundable deposit: ${formatNaira(b.deposit_kobo)}`,
    `*Total now: ${formatNaira(b.total_due_kobo)}*`,
    b.wants_delivery ? "Delivery is quoted separately once we've arranged haulage." : "",
    "",
    `Pay securely here to lock it in: ${ctx.siteUrl}/bookings/${b.reference}`,
    "",
    "You can add an operator or turn off the damage waiver on that page before paying.",
  ];
  return [lines.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n")];
}

async function statusReply(store: Store, phone: string): Promise<string> {
  const b = await store.latestBookingForPhone(phone);
  if (!b) return "You don't have any bookings yet. Send *menu* to browse equipment.";
  const listing = await store.getListing(b.listing_id);
  return `Booking *${b.reference}*${listing ? ` for ${listing.title}` : ""}\nStart ${formatDate(b.start_date)} · ${b.days} days\nStatus: ${STATUS_LABEL[b.status]}`;
}

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Today's date in Lagos (UTC+1, no DST) as YYYY-MM-DD parts. */
function lagosToday(now: Date): { y: number; m: number; d: number } {
  const t = new Date(now.getTime() + 60 * 60 * 1000);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/**
 * Parses "25/11 5", "25/11/2026 5 days", "25-11 for 5 days", "today 2", "tomorrow 3".
 * Dates are day-first, as written in Nigeria. A date without a year that has already
 * passed this year rolls to next year.
 */
export function parseDatesAndDays(text: string, now: Date): { startDate: string; days: number } | null {
  const s = text.toLowerCase().replace(/\b(for|days?|from|starting)\b/g, " ").trim();
  const today = lagosToday(now);
  const todayIso = iso(today.y, today.m, today.d);

  let startDate: string | null = null;
  let rest = s;

  const rel = s.match(/^(today|tomorrow|tmrw|tmr)\s+(.*)$/);
  if (rel) {
    const base = new Date(Date.UTC(today.y, today.m - 1, today.d + (rel[1] === "today" ? 0 : 1)));
    startDate = iso(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate());
    rest = rel[2];
  } else {
    const dm = s.match(/^(\d{1,2})[/\-.](\d{1,2})(?:[/\-.](\d{2,4}))?\s+(.*)$/);
    if (!dm) return null;
    const d = Number(dm[1]);
    const m = Number(dm[2]);
    let y = dm[3] ? Number(dm[3]) : today.y;
    if (y < 100) y += 2000;
    const date = new Date(Date.UTC(y, m - 1, d));
    if (date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null; // e.g. 31/02
    let candidate = iso(y, m, d);
    if (!dm[3] && candidate < todayIso) candidate = iso(y + 1, m, d);
    if (candidate < todayIso) return null;
    startDate = candidate;
    rest = dm[4];
  }

  const daysMatch = rest.trim().match(/^(\d{1,3})$/);
  if (!daysMatch) return null;
  const days = Number(daysMatch[1]);
  if (days < 1 || days > 365) return null;
  return { startDate, days };
}
