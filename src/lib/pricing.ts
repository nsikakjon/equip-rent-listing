/**
 * Fee engine, following the Lagos business model:
 *  - Owner commission: per category (12% heavy plant, 20% small tools). None on our own inventory.
 *  - Renter service fee: 5% of rental (and operator) value.
 *  - Damage waiver: 10% of rental, default on, paid into the claims pool.
 *  - Security deposit (refundable): 1× daily rate with the waiver; without it,
 *    the higher of 3× daily rate or 15% of equipment value.
 *  - Delivery is quoted separately once haulage is arranged (cost + margin).
 * All amounts are integer kobo.
 */

export const FEES = {
  serviceFeeRate: 0.05,
  damageWaiverRate: 0.1,
  depositDaysWithWaiver: 1,
  depositDaysWithoutWaiver: 3,
  depositValueRateWithoutWaiver: 0.15,
  deliveryMarginRate: 0.15,
} as const;

export interface QuoteInput {
  dailyRateKobo: number;
  days: number;
  commissionRate: number;
  isOwnInventory: boolean;
  equipmentValueKobo: number;
  damageWaiver: boolean;
  withOperator: boolean;
  operatorDailyKobo: number;
}

export interface Quote {
  rentalKobo: number;
  operatorKobo: number;
  serviceFeeKobo: number;
  waiverKobo: number;
  depositKobo: number;
  commissionKobo: number;
  ownerPayoutKobo: number;
  /** What the renter pays up front (deposit included, delivery excluded). */
  totalDueKobo: number;
  /** Platform revenue excluding the waiver pool and the refundable deposit. */
  platformTakeKobo: number;
}

const pct = (amount: number, rate: number) => Math.round(amount * rate);

export function quote(input: QuoteInput): Quote {
  if (!Number.isInteger(input.days) || input.days < 1) throw new Error("days must be a whole number ≥ 1");
  if (input.dailyRateKobo <= 0) throw new Error("daily rate must be positive");

  const rentalKobo = input.dailyRateKobo * input.days;
  const operatorKobo = input.withOperator ? input.operatorDailyKobo * input.days : 0;
  const serviceFeeKobo = pct(rentalKobo + operatorKobo, FEES.serviceFeeRate);
  const waiverKobo = input.damageWaiver ? pct(rentalKobo, FEES.damageWaiverRate) : 0;

  const depositKobo = input.damageWaiver
    ? input.dailyRateKobo * FEES.depositDaysWithWaiver
    : Math.max(
        input.dailyRateKobo * FEES.depositDaysWithoutWaiver,
        pct(input.equipmentValueKobo, FEES.depositValueRateWithoutWaiver),
      );

  // Commission is taken on the equipment rental only; operator pay passes through to the owner in full.
  const commissionKobo = input.isOwnInventory ? 0 : pct(rentalKobo, input.commissionRate);
  const ownerPayoutKobo = input.isOwnInventory ? 0 : rentalKobo + operatorKobo - commissionKobo;

  const totalDueKobo = rentalKobo + operatorKobo + serviceFeeKobo + waiverKobo + depositKobo;
  const platformTakeKobo = input.isOwnInventory
    ? rentalKobo + operatorKobo + serviceFeeKobo
    : commissionKobo + serviceFeeKobo;

  return {
    rentalKobo,
    operatorKobo,
    serviceFeeKobo,
    waiverKobo,
    depositKobo,
    commissionKobo,
    ownerPayoutKobo,
    totalDueKobo,
    platformTakeKobo,
  };
}

/** Delivery price to the renter: haulage cost plus our logistics margin. */
export function deliveryPrice(haulageCostKobo: number): number {
  return haulageCostKobo + pct(haulageCostKobo, FEES.deliveryMarginRate);
}

export function formatNaira(kobo: number): string {
  const naira = kobo / 100;
  return "₦" + naira.toLocaleString("en-NG", { maximumFractionDigits: naira % 1 === 0 ? 0 : 2 });
}

/** Parse a naira amount typed by a person ("290,000", "₦290000", "290k") into kobo. */
export function parseNairaToKobo(raw: string): number | null {
  const s = raw.trim().toLowerCase().replace(/[₦,\s]/g, "").replace(/^n(?=\d)/, "");
  const m = s.match(/^(\d+(?:\.\d+)?)(k|m)?$/);
  if (!m) return null;
  const mult = m[2] === "k" ? 1_000 : m[2] === "m" ? 1_000_000 : 1;
  const kobo = Math.round(parseFloat(m[1]) * mult * 100);
  return kobo > 0 ? kobo : null;
}
