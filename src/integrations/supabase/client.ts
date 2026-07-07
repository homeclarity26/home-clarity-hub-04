// This file is generated, but the project-ref guard below is maintained by
// hand. Do not remove the assertSupabaseConfig call — it is the runtime
// backstop against connecting to the wrong Supabase project (see
// src/integrations/supabase/project-ref.ts).
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { assertSupabaseConfig } from './project-ref';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Fail loudly at startup if env vars are missing or point at the wrong
// project, instead of silently building a client against the wrong database.
assertSupabaseConfig({ url: SUPABASE_URL, key: SUPABASE_PUBLISHABLE_KEY });

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});