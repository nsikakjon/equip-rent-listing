export type CategoryKind = "heavy_plant" | "small_tools";

export interface Category {
  slug: string;
  name: string;
  kind: CategoryKind;
  commission_rate: number;
  sort_order: number;
}

export type ListingStatus = "pending" | "active" | "paused";

export interface Listing {
  id: number;
  owner_id: string | null;
  is_own_inventory: boolean;
  category_slug: string;
  title: string;
  description: string;
  area: string;
  daily_rate_kobo: number;
  equipment_value_kobo: number;
  operator_available: boolean;
  operator_daily_kobo: number;
  delivery_available: boolean;
  image_url: string | null;
  status: ListingStatus;
  created_at: string;
}

export interface Owner {
  id: string;
  name: string;
  business_name: string | null;
  phone: string;
  email: string | null;
  verified: boolean;
}

export type BookingStatus =
  | "requested"
  | "confirmed"
  | "paid"
  | "on_hire"
  | "returned"
  | "payout_released"
  | "cancelled";

export interface Booking {
  id: string;
  reference: string;
  listing_id: number;
  channel: "web" | "whatsapp";
  renter_name: string;
  renter_phone: string;
  renter_email: string | null;
  site_address: string;
  start_date: string;
  days: number;
  with_operator: boolean;
  wants_delivery: boolean;
  damage_waiver: boolean;
  rental_kobo: number;
  operator_kobo: number;
  service_fee_kobo: number;
  waiver_kobo: number;
  deposit_kobo: number;
  delivery_kobo: number | null;
  commission_kobo: number;
  owner_payout_kobo: number;
  total_due_kobo: number;
  status: BookingStatus;
  payment_provider: "paystack" | "flutterwave" | null;
  payment_reference: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface ListingFilter {
  category?: string;
  area?: string;
  q?: string;
}

export interface NewListingInput {
  owner: { name: string; business_name?: string; phone: string; email?: string };
  category_slug: string;
  title: string;
  description: string;
  area: string;
  daily_rate_kobo: number;
  equipment_value_kobo: number;
  operator_available: boolean;
  operator_daily_kobo: number;
  delivery_available: boolean;
}

export type NewBookingInput = Omit<
  Booking,
  "id" | "status" | "payment_provider" | "payment_reference" | "paid_at" | "created_at" | "delivery_kobo"
>;
