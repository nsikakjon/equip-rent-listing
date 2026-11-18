import type { Category, Listing, Owner } from "../types";

// Mirrors supabase/seed.sql, plus a few sample third-party listings for the demo.
export const DEMO_CATEGORIES: Category[] = [
  { slug: "excavators", name: "Excavators", kind: "heavy_plant", commission_rate: 0.12, sort_order: 1 },
  { slug: "cranes", name: "Cranes", kind: "heavy_plant", commission_rate: 0.12, sort_order: 2 },
  { slug: "loaders", name: "Loaders & backhoes", kind: "heavy_plant", commission_rate: 0.12, sort_order: 3 },
  { slug: "tippers", name: "Tippers & trucks", kind: "heavy_plant", commission_rate: 0.12, sort_order: 4 },
  { slug: "scaffolding", name: "Scaffolding & props", kind: "small_tools", commission_rate: 0.2, sort_order: 5 },
  { slug: "formwork", name: "Formwork panels", kind: "small_tools", commission_rate: 0.2, sort_order: 6 },
  { slug: "mixers", name: "Concrete mixers", kind: "small_tools", commission_rate: 0.2, sort_order: 7 },
  { slug: "vibrators", name: "Poker vibrators", kind: "small_tools", commission_rate: 0.2, sort_order: 8 },
  { slug: "compactors", name: "Plate compactors", kind: "small_tools", commission_rate: 0.2, sort_order: 9 },
  { slug: "power", name: "Generators & water pumps", kind: "small_tools", commission_rate: 0.2, sort_order: 10 },
];

export const DEMO_OWNERS: Owner[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Demo Plant Hire",
    business_name: "Demo Plant Hire Ltd",
    phone: "2348000000001",
    email: null,
    verified: true,
  },
];

const N = (naira: number) => naira * 100;
const owner = DEMO_OWNERS[0].id;

let id = 0;
const listing = (l: Partial<Listing> & Pick<Listing, "category_slug" | "title" | "area" | "daily_rate_kobo">): Listing => ({
  id: ++id,
  owner_id: null,
  is_own_inventory: true,
  description: "",
  equipment_value_kobo: 0,
  operator_available: false,
  operator_daily_kobo: 0,
  delivery_available: true,
  image_url: null,
  status: "active",
  created_at: new Date(Date.UTC(2026, 10, 18, 0, id)).toISOString(),
  ...l,
});

export const DEMO_LISTINGS: Listing[] = [
  listing({ category_slug: "mixers", title: "Half-bag diesel concrete mixer", description: "Diesel, towable. Ideal for slabs and columns.", area: "Lekki", daily_rate_kobo: N(25_000), equipment_value_kobo: N(1_200_000) }),
  listing({ category_slug: "vibrators", title: "Petrol poker vibrator, 6 m hose", description: "Honda engine with 45 mm needle.", area: "Lekki", daily_rate_kobo: N(12_000), equipment_value_kobo: N(450_000) }),
  listing({ category_slug: "compactors", title: "Plate compactor, 90 kg", description: "For interlocking, sub-base and trenches.", area: "Ikeja", daily_rate_kobo: N(18_000), equipment_value_kobo: N(950_000) }),
  listing({ category_slug: "scaffolding", title: "H-frame scaffolding set (20 frames)", description: "Frames, braces, base jacks and planks.", area: "Ajah", daily_rate_kobo: N(30_000), equipment_value_kobo: N(2_500_000) }),
  listing({ category_slug: "formwork", title: "Steel formwork panels (50 m²)", description: "Raft and slab work. Ties included.", area: "Ajah", daily_rate_kobo: N(45_000), equipment_value_kobo: N(4_000_000) }),
  listing({ category_slug: "power", title: "20 kVA soundproof generator", description: "Diesel. Fuel not included.", area: "Ikeja", daily_rate_kobo: N(35_000), equipment_value_kobo: N(6_500_000) }),
  listing({ owner_id: owner, is_own_inventory: false, category_slug: "excavators", title: "CAT 320D excavator, 20 t", description: "8-hour day. Bucket and breaker available.", area: "Ikorodu", daily_rate_kobo: N(290_000), equipment_value_kobo: N(60_000_000), operator_available: true, operator_daily_kobo: N(12_000) }),
  listing({ owner_id: owner, is_own_inventory: false, category_slug: "cranes", title: "50-tonne mobile crane", description: "8-hour day. Rigger supplied.", area: "Apapa", daily_rate_kobo: N(700_000), equipment_value_kobo: N(250_000_000), operator_available: true, operator_daily_kobo: N(20_000) }),
  listing({ owner_id: owner, is_own_inventory: false, category_slug: "loaders", title: "JCB 3CX backhoe loader", description: "Trenching, loading and site clearing.", area: "Lekki", daily_rate_kobo: N(180_000), equipment_value_kobo: N(45_000_000), operator_available: true, operator_daily_kobo: N(10_000) }),
  listing({ owner_id: owner, is_own_inventory: false, category_slug: "tippers", title: "30 t tipper truck", description: "Sand, laterite and debris haulage within Lagos.", area: "Ikeja", daily_rate_kobo: N(120_000), equipment_value_kobo: N(35_000_000) }),
];
