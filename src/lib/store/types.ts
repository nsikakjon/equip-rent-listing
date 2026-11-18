import type {
  Booking,
  Category,
  Listing,
  ListingFilter,
  NewBookingInput,
  NewListingInput,
  Owner,
} from "../types";

/** Data access used by the web app, the WhatsApp bot and the payment webhooks. */
export interface Store {
  readonly kind: "supabase" | "memory";
  listCategories(): Promise<Category[]>;
  getCategory(slug: string): Promise<Category | null>;
  listListings(filter?: ListingFilter, limit?: number): Promise<Listing[]>;
  getListing(id: number): Promise<Listing | null>;
  getOwner(id: string): Promise<Owner | null>;
  /** Creates (or reuses by phone) the owner and a listing pending review. */
  createListing(input: NewListingInput): Promise<Listing>;
  createBooking(input: NewBookingInput): Promise<Booking>;
  getBookingByReference(reference: string): Promise<Booking | null>;
  latestBookingForPhone(phone: string): Promise<Booking | null>;
  updateBooking(reference: string, patch: Partial<Booking>): Promise<Booking | null>;
  getSession(phone: string): Promise<Record<string, unknown>>;
  setSession(phone: string, state: Record<string, unknown>): Promise<void>;
}
