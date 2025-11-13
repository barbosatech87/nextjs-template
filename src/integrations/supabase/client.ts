import { createBrowserClient } from '@supabase/ssr'

// This function creates a new Supabase client for the browser.
// It's a singleton, so you can import it from anywhere in your app.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)