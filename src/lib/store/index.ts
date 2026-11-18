import "server-only";
import { createMemoryStore } from "./memory";
import { createSupabaseStore } from "./supabase";
import type { Store } from "./types";

export type { Store } from "./types";

const globalForStore = globalThis as unknown as { __equiprentStore?: Store };

/**
 * Returns the Supabase store when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set,
 * otherwise a demo in-memory store (kept on globalThis so it survives dev hot reloads).
 */
export function getStore(): Store {
  if (globalForStore.__equiprentStore) return globalForStore.__equiprentStore;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const store = url && key ? createSupabaseStore(url, key) : createMemoryStore();
  globalForStore.__equiprentStore = store;
  return store;
}
