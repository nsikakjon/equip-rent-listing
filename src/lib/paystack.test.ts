import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { isValidPaystackSignature, payerEmail } from "./paystack";

describe("paystack", () => {
  it("validates webhook signatures", () => {
    const body = '{"event":"charge.success"}';
    const sig = createHmac("sha512", "sk_test_x").update(body).digest("hex");
    expect(isValidPaystackSignature(body, sig, "sk_test_x")).toBe(true);
    expect(isValidPaystackSignature(body, sig, "sk_test_y")).toBe(false);
    expect(isValidPaystackSignature(body, null, "sk_test_x")).toBe(false);
  });
  it("falls back to a phone-based email for WhatsApp renters", () => {
    expect(payerEmail({ renter_email: null, renter_phone: "2348011112222" })).toBe("2348011112222@renters.equiprent.ng");
    expect(payerEmail({ renter_email: "a@b.co", renter_phone: "2348011112222" })).toBe("a@b.co");
  });
});
