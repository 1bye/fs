import { SupabaseConfig } from "@config/types/supabase";
import { env } from "@utils/env";

export default {
    anonKey: env("SUPABASE_PROJECT_ANON_KEY"),
    password: env("SUPABASE_PROJECT_PASSWORD"),
    url: env("SUPABASE_PROJECT_URL"),
} as SupabaseConfig;