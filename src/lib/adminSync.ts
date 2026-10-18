import { supabase } from "@/integrations/supabase/client";

/**
 * Live sync for the admin dashboard via Realtime Broadcast.
 * The payload never carries guest data, only "something changed" and the
 * sender id, because public broadcast channels are readable with the anon key.
 * Listeners refetch through the authenticated admin API.
 */
export const ADMIN_SYNC_TOPIC = "admin-sync";
export const ADMIN_SYNC_EVENT = "changed";

/** Window event fired when another device changed data; widgets with their own data refetch on it. */
export const ADMIN_SYNC_WINDOW_EVENT = "admin-sync:changed";

/** Identifies this browser tab so it can ignore its own announcements. */
export const CLIENT_ID = Math.random().toString(36).slice(2);

export const announceChange = async () => {
  window.dispatchEvent(new Event(ADMIN_SYNC_WINDOW_EVENT));
  const channel = supabase.channel(ADMIN_SYNC_TOPIC);
  try {
    await channel.httpSend(ADMIN_SYNC_EVENT, { from: CLIENT_ID });
  } catch {
    // Best effort: polling still picks the change up.
  } finally {
    // Only drop the channel if it was created just for sending.
    if (channel.state !== "joined" && channel.state !== "joining") void supabase.removeChannel(channel);
  }
};
