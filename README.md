# EquipRent

Construction equipment rental marketplace for Lagos. Owners list equipment, contractors book and pay on the
web or over WhatsApp, and EquipRent holds the money until the equipment is returned and inspected.
Based on the *Construction Equipment Rental Marketplace — Lagos Business Model* plan.

**Stack:** Next.js 16 (App Router) · Supabase Postgres · WhatsApp Cloud API · Paystack · hosted on Railway.

## What's in this first cut

| Area | What it does |
| --- | --- |
| Web | Home, browse/search by category and area, listing page with a live price quote, booking request, booking page with Paystack checkout, "list your equipment" form for owners |
| WhatsApp | Webhook at `/api/whatsapp/webhook`. Menu → category or free-text search → `book 7` → `25/11 5` → quote and payment link. `status`, `list`, `cancel` also work |
| Payments | Paystack checkout into our own account (no split), verified server-side via webhook (`/api/paystack/webhook`) and the redirect. Owner payout is released after return, escrow-style |
| Fees | `src/lib/pricing.ts`: 12% commission on heavy plant, 20% on small tools, none on own stock; 5% renter service fee; 10% damage waiver (default on); deposit of 1× daily rate with the waiver, or the higher of 3× daily rate / 15% of value without it. Matches the plan's 5-day excavator example (tested) |
| Ops alerts | New bookings, listings and payments are sent to `OPS_WHATSAPP_NUMBER` |

Owner phone numbers are never shown to renters, to reduce off-platform deals. New owner listings go in as
`pending` until someone verifies them and sets `status = 'active'` in Supabase.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000, uses built-in demo data when Supabase isn't configured
npm test           # pricing, WhatsApp bot and signature tests
```

Without WhatsApp credentials, bot replies are printed to the server log, so you can try the bot by POSTing a
webhook payload to `/api/whatsapp/webhook` (see `src/lib/whatsapp/bot.test.ts` for the shape).

## Deploy

1. **Supabase:** run `supabase/migrations/20261118120000_init.sql`, then `supabase/seed.sql` (SQL editor, or
   `supabase db push`). Copy the project URL and **service role** key.
2. **Railway:** create a service from this repo. `railway.json` sets the build and start commands. Add the
   variables from `.env.example`.
3. **WhatsApp (Meta app):** set the webhook callback to `https://<your-domain>/api/whatsapp/webhook`, with the
   same verify token as `WHATSAPP_VERIFY_TOKEN`, and subscribe to `messages`. Use a permanent system-user
   token for `WHATSAPP_ACCESS_TOKEN`.
4. **Paystack:** set the webhook URL to `https://<your-domain>/api/paystack/webhook` and add
   `PAYSTACK_SECRET_KEY`.

Note: free-form WhatsApp messages only deliver inside the 24-hour window after the person last messaged us.
Renter replies are always inside it; ops alerts need the ops phone to message the business number daily
until we switch them to approved templates.

## Not built yet

- Admin screen for approving listings, confirming bookings, quoting delivery and releasing payouts
  (do these in the Supabase table editor for now)
- Owner and renter accounts (Supabase Auth), photo uploads
- Flutterwave as a second payment option
- Operator booking fee, verification badges, featured listings, corporate credit accounts
