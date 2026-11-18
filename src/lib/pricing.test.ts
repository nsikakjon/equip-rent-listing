import { describe, expect, it } from "vitest";
import { deliveryPrice, formatNaira, parseNairaToKobo, quote } from "./pricing";

const N = (naira: number) => naira * 100;

describe("quote", () => {
  it("matches the business model's 5-day excavator example", () => {
    const q = quote({
      dailyRateKobo: N(290_000),
      days: 5,
      commissionRate: 0.12,
      isOwnInventory: false,
      equipmentValueKobo: N(60_000_000),
      damageWaiver: true,
      withOperator: false,
      operatorDailyKobo: 0,
    });
    expect(q.rentalKobo).toBe(N(1_450_000));
    expect(q.commissionKobo).toBe(N(174_000));
    expect(q.serviceFeeKobo).toBe(N(72_500));
    expect(q.waiverKobo).toBe(N(145_000));
    expect(q.platformTakeKobo).toBe(N(246_500));
    expect(q.ownerPayoutKobo).toBe(N(1_276_000));
    expect(q.depositKobo).toBe(N(290_000));
    expect(q.totalDueKobo).toBe(N(1_450_000 + 72_500 + 145_000 + 290_000));
  });

  it("charges a bigger deposit when the waiver is declined", () => {
    const q = quote({
      dailyRateKobo: N(290_000),
      days: 5,
      commissionRate: 0.12,
      isOwnInventory: false,
      equipmentValueKobo: N(60_000_000),
      damageWaiver: false,
      withOperator: false,
      operatorDailyKobo: 0,
    });
    expect(q.waiverKobo).toBe(0);
    expect(q.depositKobo).toBe(N(9_000_000)); // 15% of ₦60m beats 3 × daily rate
  });

  it("takes no commission on own inventory and passes operator pay through", () => {
    const own = quote({
      dailyRateKobo: N(25_000),
      days: 2,
      commissionRate: 0.2,
      isOwnInventory: true,
      equipmentValueKobo: 0,
      damageWaiver: true,
      withOperator: false,
      operatorDailyKobo: 0,
    });
    expect(own.commissionKobo).toBe(0);
    expect(own.ownerPayoutKobo).toBe(0);
    expect(own.platformTakeKobo).toBe(N(50_000 + 2_500));

    const withOp = quote({
      dailyRateKobo: N(100_000),
      days: 3,
      commissionRate: 0.12,
      isOwnInventory: false,
      equipmentValueKobo: 0,
      damageWaiver: true,
      withOperator: true,
      operatorDailyKobo: N(10_000),
    });
    expect(withOp.operatorKobo).toBe(N(30_000));
    expect(withOp.commissionKobo).toBe(N(36_000));
    expect(withOp.ownerPayoutKobo).toBe(N(300_000 + 30_000 - 36_000));
  });

  it("rejects bad input", () => {
    const base = {
      dailyRateKobo: 100,
      commissionRate: 0.1,
      isOwnInventory: false,
      equipmentValueKobo: 0,
      damageWaiver: true,
      withOperator: false,
      operatorDailyKobo: 0,
    };
    expect(() => quote({ ...base, days: 0 })).toThrow();
    expect(() => quote({ ...base, days: 1.5 })).toThrow();
  });
});

describe("helpers", () => {
  it("formats naira", () => {
    expect(formatNaira(N(1_450_000))).toBe("₦1,450,000");
  });
  it("parses typed amounts", () => {
    expect(parseNairaToKobo("290,000")).toBe(N(290_000));
    expect(parseNairaToKobo("₦290000")).toBe(N(290_000));
    expect(parseNairaToKobo("290k")).toBe(N(290_000));
    expect(parseNairaToKobo("1.5m")).toBe(N(1_500_000));
    expect(parseNairaToKobo("abc")).toBeNull();
  });
  it("adds the delivery margin", () => {
    expect(deliveryPrice(N(100_000))).toBe(N(115_000));
  });
});
