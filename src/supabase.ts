import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_PROJECT_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_PROJECT_URL = process.env.SUPABASE_PROJECT_URL;

if (!SUPABASE_KEY || !SUPABASE_URL || !SUPABASE_PROJECT_URL)
  throw new Error("Invalid supabase key config. Contact developer!");

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
export { SUPABASE_PROJECT_URL };
