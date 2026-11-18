import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createMemoryStore } from "../store/memory";
import { extractIncomingTexts, isValidMetaSignature } from "./client";
import { handleMessage, parseDatesAndDays } from "./bot";
import { createHmac } from "node:crypto";

const NOW = new Date("2026-11-18T12:00:00Z");

function setup() {
  const store = createMemoryStore();
  const ctx = { store, siteUrl: "https://equiprent.example", now: NOW };
  const say = async (text: string) =>
    (await handleMessage({ from: "2348011112222", name: "Ada Obi", text }, ctx)).join("\n");
  return { store, say };
}

describe("parseDatesAndDays", () => {
  it("parses day-first dates", () => {
    expect(parseDatesAndDays("25/11 5", NOW)).toEqual({ startDate: "2026-11-25", days: 5 });
    expect(parseDatesAndDays("25-11-2026 for 5 days", NOW)).toEqual({ startDate: "2026-11-25", days: 5 });
  });
  it("rolls past dates without a year into next year", () => {
    expect(parseDatesAndDays("2/1 3", NOW)).toEqual({ startDate: "2027-01-02", days: 3 });
  });
  it("handles today and tomorrow in Lagos time", () => {
    expect(parseDatesAndDays("tomorrow 3", NOW)).toEqual({ startDate: "2026-11-19", days: 3 });
    // 23:30 UTC is already the next day in Lagos.
    expect(parseDatesAndDays("today 1", new Date("2026-11-18T23:30:00Z"))).toEqual({
      startDate: "2026-11-19",
      days: 1,
    });
  });
  it("rejects nonsense", () => {
    expect(parseDatesAndDays("31/02 3", NOW)).toBeNull();
    expect(parseDatesAndDays("1/1/2020 3", NOW)).toBeNull();
    expect(parseDatesAndDays("next week", NOW)).toBeNull();
    expect(parseDatesAndDays("25/11 0", NOW)).toBeNull();
  });
});

describe("handleMessage", () => {
  it("greets with a numbered menu", async () => {
    const { say } = setup();
    const reply = await say("Hello");
    expect(reply).toContain("Hi Ada!");
    expect(reply).toContain("*1* Excavators");
  });

  it("lists a category by number and by search", async () => {
    const { say } = setup();
    expect(await say("1")).toContain("CAT 320D excavator");
    expect(await say("mixer")).toContain("concrete mixer");
    expect(await say("excavators")).toContain("CAT 320D");
  });

  it("books end to end and reports status", async () => {
    const { say, store } = setup();
    const excavator = (await store.listListings({ category: "excavators" }))[0];
    expect(await say(`book ${excavator.id}`)).toContain("how many days");
    expect(await say("whenever")).toContain("didn't catch that");
    const reply = await say("25/11 5");
    expect(reply).toMatch(/Booking \*ER-[A-Z2-9]{6}\*/);
    expect(reply).toContain("Rental: ₦1,450,000");
    expect(reply).toContain("Service fee: ₦72,500");
    expect(reply).toContain("Damage waiver: ₦145,000");
    expect(reply).toContain("https://equiprent.example/bookings/ER-");

    const booking = await store.latestBookingForPhone("2348011112222");
    expect(booking?.channel).toBe("whatsapp");
    expect(booking?.renter_name).toBe("Ada Obi");
    expect(await say("status")).toContain(booking!.reference);
    expect(await store.getSession("2348011112222")).toEqual({});
  });

  it("cancels an in-progress booking", async () => {
    const { say, store } = setup();
    await say("book 1");
    expect(await say("cancel")).toContain("cleared");
    expect(await store.getSession("2348011112222")).toEqual({});
  });
});

describe("webhook helpers", () => {
  it("extracts text and interactive replies", () => {
    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                contacts: [{ wa_id: "2348011112222", profile: { name: "Ada" } }],
                messages: [
                  { from: "2348011112222", id: "m1", type: "text", text: { body: "hi" } },
                  { from: "2348011112222", id: "m2", type: "interactive", interactive: { list_reply: { id: "3" } } },
                  { from: "2348011112222", id: "m3", type: "image", image: {} },
                ],
              },
            },
          ],
        },
      ],
    };
    expect(extractIncomingTexts(payload)).toEqual([
      { from: "2348011112222", name: "Ada", text: "hi", messageId: "m1" },
      { from: "2348011112222", name: "Ada", text: "3", messageId: "m2" },
    ]);
    expect(extractIncomingTexts({})).toEqual([]);
  });

  it("checks Meta signatures", () => {
    const body = '{"a":1}';
    const sig = "sha256=" + createHmac("sha256", "secret").update(body).digest("hex");
    expect(isValidMetaSignature(body, sig, "secret")).toBe(true);
    expect(isValidMetaSignature(body, sig, "wrong")).toBe(false);
    expect(isValidMetaSignature(body, null, "secret")).toBe(false);
  });
});
