import "server-only";
import { cache } from "react";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export class SupabaseAdminConfigError extends Error {
  constructor() {
    super("Supabase admin ortam değişkenleri eksik.");
    this.name = "SupabaseAdminConfigError";
  }
}

export const createSupabaseAdminClient = cache(() => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new SupabaseAdminConfigError();
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
});
