import "server-only";
import { createMemoryStore } from "./memory";
import { createSupabaseStore } from "./supabase";
import type { Store } from "./types";

export type { Store } from "./types";

const globalForStore = globalThis as unknown as { __equiprentStore?: Store };

/** Accepts the usual Supabase variable names, so an existing Railway setup works as-is. */
export function supabaseEnv(): { url?: string; key?: string } {
  const e = process.env;
  return {
    url: e.SUPABASE_URL || e.NEXT_PUBLIC_SUPABASE_URL,
    key: e.SUPABASE_SERVICE_ROLE_KEY || e.SUPABASE_SERVICE_KEY || e.SUPABASE_SECRET_KEY,
  };
}

/**
 * Returns the Supabase store when a Supabase URL and service key are set,
 * otherwise a demo in-memory store (kept on globalThis so it survives dev hot reloads).
 */
export function getStore(): Store {
  if (globalForStore.__equiprentStore) return globalForStore.__equiprentStore;
  const { url, key } = supabaseEnv();
  if (!(url && key) && process.env.NODE_ENV === "production") {
    console.warn("Supabase is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY): serving DEMO data.");
  }
  const store = url && key ? createSupabaseStore(url, key) : createMemoryStore();
  globalForStore.__equiprentStore = store;
  return store;
}
