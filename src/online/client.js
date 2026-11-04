// Supabase client. Online play is enabled only when both env vars are set at build time.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isOnlineConfigured = Boolean(url && anonKey);

export const supabase = isOnlineConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'sabaq-auth' },
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : null;
