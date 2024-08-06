import { createClient } from "@supabase/supabase-js";
import supabaseConfig from "@config/supabase.config";

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
    auth: {
        flowType: "pkce"
    }
});

export {
    supabase
}