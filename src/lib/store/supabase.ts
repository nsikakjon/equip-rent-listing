import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Booking, Category, Listing, Owner } from "../types";
import type { Store } from "./types";

// Postgres bigint comes back as number for values below 2^53, which covers any naira amount.
function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

/** Server-side store using the service role key. Never import this from client components. */
export function createSupabaseStore(url: string, serviceRoleKey: string): Store {
  const db: SupabaseClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    kind: "supabase",
    async listCategories() {
      return must(await db.from("equip_categories").select("*").order("sort_order")) as Category[];
    },
    async getCategory(slug) {
      return must(await db.from("equip_categories").select("*").eq("slug", slug).maybeSingle()) as Category | null;
    },
    async listListings(filter = {}, limit = 50) {
      let q = db.from("equip_listings").select("*").eq("status", "active");
      if (filter.category) q = q.eq("category_slug", filter.category);
      if (filter.area) q = q.ilike("area", `%${filter.area}%`);
      if (filter.q) {
        const term = filter.q.replace(/[%,()]/g, " ").trim();
        if (term) q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
      }
      return must(await q.order("created_at", { ascending: false }).limit(limit)) as Listing[];
    },
    async getListing(id) {
      return must(await db.from("equip_listings").select("*").eq("id", id).maybeSingle()) as Listing | null;
    },
    async getOwner(id) {
      return must(await db.from("equip_owners").select("*").eq("id", id).maybeSingle()) as Owner | null;
    },
    async createListing(input) {
      let owner = must(
        await db.from("equip_owners").select("*").eq("phone", input.owner.phone).maybeSingle(),
      ) as Owner | null;
      if (!owner) {
        owner = must(
          await db
            .from("equip_owners")
            .insert({
              name: input.owner.name,
              business_name: input.owner.business_name || null,
              phone: input.owner.phone,
              email: input.owner.email || null,
            })
            .select()
            .single(),
        ) as Owner;
      }
      const { owner: _owner, ...fields } = input;
      void _owner;
      return must(
        await db
          .from("equip_listings")
          .insert({ ...fields, owner_id: owner.id, is_own_inventory: false, status: "pending" })
          .select()
          .single(),
      ) as Listing;
    },
    async createBooking(input) {
      return must(await db.from("equip_bookings").insert(input).select().single()) as Booking;
    },
    async getBookingByReference(reference) {
      return must(
        await db.from("equip_bookings").select("*").eq("reference", reference).maybeSingle(),
      ) as Booking | null;
    },
    async latestBookingForPhone(phone) {
      return must(
        await db
          .from("equip_bookings")
          .select("*")
          .eq("renter_phone", phone)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ) as Booking | null;
    },
    async updateBooking(reference, patch) {
      return must(
        await db.from("equip_bookings").update(patch).eq("reference", reference).select().maybeSingle(),
      ) as Booking | null;
    },
    async getSession(phone) {
      const row = must(
        await db.from("equip_whatsapp_sessions").select("state").eq("phone", phone).maybeSingle(),
      ) as { state: Record<string, unknown> } | null;
      return row?.state ?? {};
    },
    async setSession(phone, state) {
      must(
        await db
          .from("equip_whatsapp_sessions")
          .upsert({ phone, state, updated_at: new Date().toISOString() })
          .select(),
      );
    },
  };
}
