import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_SYNC_EVENT, ADMIN_SYNC_TOPIC, ADMIN_SYNC_WINDOW_EVENT, CLIENT_ID } from "@/lib/adminSync";

/** "polling": realtime unavailable, the 15 s polling still keeps data fresh. */
export type LiveStatus = "connecting" | "live" | "polling" | "offline";

const DEBOUNCE_MS = 400;

/**
 * Refreshes the dashboard when another device announces a change, when the
 * tab becomes visible again and when the network comes back. Polling in the
 * caller stays as a safety net.
 */
export const useAdminLiveSync = (refresh: () => void) => {
  const [status, setStatus] = useState<LiveStatus>("connecting");
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const trigger = (fromRemote: boolean) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        refreshRef.current();
        if (fromRemote) window.dispatchEvent(new Event(ADMIN_SYNC_WINDOW_EVENT));
      }, DEBOUNCE_MS);
    };

    const channel = supabase
      .channel(ADMIN_SYNC_TOPIC)
      .on("broadcast", { event: ADMIN_SYNC_EVENT }, ({ payload }) => {
        if ((payload as { from?: string } | undefined)?.from === CLIENT_ID) return;
        trigger(true);
      })
      .subscribe(s => {
        if (s === "SUBSCRIBED") setStatus("live");
        else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT" || s === "CLOSED") setStatus(navigator.onLine ? "polling" : "offline");
      });

    const onVisible = () => { if (document.visibilityState === "visible") trigger(false); };
    const onOnline = () => { setStatus(channel.state === "joined" ? "live" : "polling"); trigger(false); };
    const onOffline = () => setStatus("offline");
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      void supabase.removeChannel(channel);
    };
  }, []);

  return status;
};
