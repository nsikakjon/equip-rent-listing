"use server";

import { redirect } from "next/navigation";
import { createBookingForListing, lagosTodayIso, normalizePhone, updateBookingOptions } from "@/lib/bookings";
import { notifyNewBooking, notifyNewListing } from "@/lib/notify";
import { parseNairaToKobo } from "@/lib/pricing";
import { getStore } from "@/lib/store";

export type FormState = { error?: string; ok?: boolean; message?: string };

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";

export async function requestBooking(_prev: FormState, fd: FormData): Promise<FormState> {
  const store = getStore();
  const listing = await store.getListing(Number(str(fd, "listingId")));
  if (!listing || listing.status !== "active") return { error: "This listing is no longer available." };

  const renterName = str(fd, "name");
  const phone = normalizePhone(str(fd, "phone"));
  const email = str(fd, "email");
  const startDate = str(fd, "startDate");
  const days = Number(str(fd, "days"));

  if (renterName.length < 2) return { error: "Please enter your name." };
  if (!phone) return { error: "Please enter a valid Nigerian phone number, e.g. 0803 123 4567." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "That email address doesn't look right." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || startDate < lagosTodayIso()) return { error: "Pick a start date from today onwards." };
  if (!Number.isInteger(days) || days < 1 || days > 365) return { error: "Number of days must be between 1 and 365." };

  const booking = await createBookingForListing(store, listing, {
    renterName,
    renterPhone: phone,
    renterEmail: email || null,
    siteAddress: str(fd, "siteAddress"),
    startDate,
    days,
    withOperator: bool(fd, "withOperator"),
    wantsDelivery: bool(fd, "wantsDelivery"),
    damageWaiver: bool(fd, "damageWaiver"),
    channel: "web",
  });
  await notifyNewBooking(booking, listing);
  redirect(`/bookings/${booking.reference}`);
}

export async function changeBookingOptions(fd: FormData): Promise<void> {
  const reference = str(fd, "reference");
  await updateBookingOptions(getStore(), reference, {
    withOperator: bool(fd, "withOperator"),
    damageWaiver: bool(fd, "damageWaiver"),
    siteAddress: str(fd, "siteAddress") || undefined,
    renterEmail: str(fd, "email") || undefined,
  });
  redirect(`/bookings/${reference}`);
}

export async function submitListing(_prev: FormState, fd: FormData): Promise<FormState> {
  const store = getStore();
  const name = str(fd, "ownerName");
  const phone = normalizePhone(str(fd, "phone"));
  const category = await store.getCategory(str(fd, "category"));
  const title = str(fd, "title");
  const area = str(fd, "area");
  const daily = parseNairaToKobo(str(fd, "dailyRate"));
  const valueRaw = str(fd, "equipmentValue");
  const value = valueRaw ? parseNairaToKobo(valueRaw) : 0;
  const operator = bool(fd, "operatorAvailable");
  const operatorRaw = str(fd, "operatorRate");
  const operatorDaily = operator && operatorRaw ? parseNairaToKobo(operatorRaw) : 0;

  if (name.length < 2) return { error: "Please enter your name." };
  if (!phone) return { error: "Please enter a valid Nigerian phone number." };
  if (!category) return { error: "Choose a category." };
  if (title.length < 4) return { error: "Give the equipment a short title, e.g. \"CAT 320D excavator\"." };
  if (area.length < 2) return { error: "Where in Lagos is the equipment kept?" };
  if (!daily) return { error: "Enter a daily rate in naira, e.g. 290,000." };
  if (value === null) return { error: "Enter the approximate equipment value in naira, or leave it blank." };
  if (operatorDaily === null) return { error: "Enter the operator's daily rate in naira." };

  const listing = await store.createListing({
    owner: { name, business_name: str(fd, "business") || undefined, phone, email: str(fd, "email") || undefined },
    category_slug: category.slug,
    title,
    description: str(fd, "description"),
    area,
    daily_rate_kobo: daily,
    equipment_value_kobo: value,
    operator_available: operator,
    operator_daily_kobo: operatorDaily,
    delivery_available: bool(fd, "deliveryAvailable"),
  });
  await notifyNewListing(listing, phone);
  return {
    ok: true,
    message: `Thanks! "${listing.title}" is in review. We'll WhatsApp you on ${phone} to verify it, usually within one working day.`,
  };
}
