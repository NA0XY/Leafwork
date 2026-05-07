import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/auth/types";

let serviceClient: ReturnType<typeof createClient<Database>> | null = null;

export const getSupabaseServiceClient = (): ReturnType<typeof createClient<Database>> => {
  if (serviceClient) {
    return serviceClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase service role environment variables are missing");
  }

  serviceClient = createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  return serviceClient;
};
