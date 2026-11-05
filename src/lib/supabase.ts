import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

function getProjectOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

const url = getProjectOrigin(rawUrl);

export const supabase =
  url && key
    ? createClient(url, key, { realtime: { params: { eventsPerSecond: 40 } } })
    : null;
