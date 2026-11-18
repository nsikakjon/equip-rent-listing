import type { Booking, Category, Listing, ListingFilter, Owner } from "../types";
import type { Store } from "./types";
import { DEMO_CATEGORIES, DEMO_LISTINGS, DEMO_OWNERS } from "./demo-data";

/**
 * In-process store seeded with demo data. Used when Supabase is not configured,
 * so the app runs locally and in tests with no setup. Data resets on restart.
 */
export function createMemoryStore(): Store {
  const categories: Category[] = structuredClone(DEMO_CATEGORIES);
  const owners: Owner[] = structuredClone(DEMO_OWNERS);
  const listings: Listing[] = structuredClone(DEMO_LISTINGS);
  const bookings: Booking[] = [];
  const sessions = new Map<string, Record<string, unknown>>();
  let nextListingId = Math.max(0, ...listings.map((l) => l.id)) + 1;

  const matches = (l: Listing, f: ListingFilter) => {
    if (l.status !== "active") return false;
    if (f.category && l.category_slug !== f.category) return false;
    if (f.area && !l.area.toLowerCase().includes(f.area.toLowerCase())) return false;
    if (f.q) {
      const hay = `${l.title} ${l.description} ${l.category_slug}`.toLowerCase();
      if (!f.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    return true;
  };

  return {
    kind: "memory",
    async listCategories() {
      return [...categories].sort((a, b) => a.sort_order - b.sort_order);
    },
    async getCategory(slug) {
      return categories.find((c) => c.slug === slug) ?? null;
    },
    async listListings(filter = {}, limit = 50) {
      return listings
        .filter((l) => matches(l, filter))
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, limit);
    },
    async getListing(id) {
      return listings.find((l) => l.id === id) ?? null;
    },
    async getOwner(id) {
      return owners.find((o) => o.id === id) ?? null;
    },
    async createListing(input) {
      let owner = owners.find((o) => o.phone === input.owner.phone);
      if (!owner) {
        owner = {
          id: crypto.randomUUID(),
          name: input.owner.name,
          business_name: input.owner.business_name ?? null,
          phone: input.owner.phone,
          email: input.owner.email ?? null,
          verified: false,
        };
        owners.push(owner);
      }
      const listing: Listing = {
        id: nextListingId++,
        owner_id: owner.id,
        is_own_inventory: false,
        category_slug: input.category_slug,
        title: input.title,
        description: input.description,
        area: input.area,
        daily_rate_kobo: input.daily_rate_kobo,
        equipment_value_kobo: input.equipment_value_kobo,
        operator_available: input.operator_available,
        operator_daily_kobo: input.operator_daily_kobo,
        delivery_available: input.delivery_available,
        image_url: null,
        status: "pending",
        created_at: new Date().toISOString(),
      };
      listings.push(listing);
      return listing;
    },
    async createBooking(input) {
      const booking: Booking = {
        ...input,
        id: crypto.randomUUID(),
        delivery_kobo: null,
        status: "requested",
        payment_provider: null,
        payment_reference: null,
        paid_at: null,
        created_at: new Date().toISOString(),
      };
      bookings.push(booking);
      return booking;
    },
    async getBookingByReference(reference) {
      return bookings.find((b) => b.reference === reference) ?? null;
    },
    async latestBookingForPhone(phone) {
      return [...bookings].reverse().find((b) => b.renter_phone === phone) ?? null;
    },
    async updateBooking(reference, patch) {
      const b = bookings.find((x) => x.reference === reference);
      if (!b) return null;
      Object.assign(b, patch);
      return b;
    },
    async getSession(phone) {
      return sessions.get(phone) ?? {};
    },
    async setSession(phone, state) {
      sessions.set(phone, state);
    },
  };
}
