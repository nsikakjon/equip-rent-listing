import { NextResponse } from "next/server";
import { paystackConfigured } from "@/lib/paystack";
import { getStore, supabaseEnv } from "@/lib/store";
import { whatsappConfigured } from "@/lib/whatsapp/client";

export const dynamic = "force-dynamic";

/** Shows which integrations are configured (yes/no only, never values). */
export async function GET() {
  const store = getStore();
  let database: string = store.kind === "supabase" ? "supabase" : "demo data (Supabase not configured)";
  if (store.kind === "supabase") {
    try {
      await store.listCategories();
    } catch (err) {
      database = `supabase error: ${(err as Error).message}`;
    }
  }
  const env = process.env;
  const { url, key } = supabaseEnv();
  return NextResponse.json({
    database,
    supabase_url_set: Boolean(url),
    supabase_service_key_set: Boolean(key),
    public_site_url: env.PUBLIC_SITE_URL || null,
    whatsapp_sending: whatsappConfigured(),
    whatsapp_app_secret_set: Boolean(env.WHATSAPP_APP_SECRET),
    whatsapp_verify_token_set: Boolean(env.WHATSAPP_VERIFY_TOKEN),
    ops_alerts_number_set: Boolean(env.OPS_WHATSAPP_NUMBER),
    paystack: paystackConfigured(),
  });
}
