"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig, supabaseSetupMessage } from "./config";

export function createSupabaseBrowserClient() {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error(supabaseSetupMessage);
  }

  return createBrowserClient(config.url, config.anonKey);
}
