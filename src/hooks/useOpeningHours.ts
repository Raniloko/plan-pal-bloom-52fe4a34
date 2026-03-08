import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface OpeningHours {
  [day: string]: { open: string; close: string; closed: boolean };
}

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

// Generate 15-min interval times between open and close
function generateTimeSlots(open: string, close: string): string[] {
  if (!open || !close) return [];
  const slots: string[] = [];
  const [oh, om] = open.split(":").map(Number);
  const [ch, cm] = close.split(":").map(Number);

  let startMin = oh * 60 + om;
  let endMin = ch * 60 + cm;

  // Handle overnight (e.g. 17:00 - 02:00)
  if (endMin <= startMin) endMin += 24 * 60;

  for (let m = startMin; m < endMin; m += 15) {
    const hour = Math.floor(m / 60) % 24;
    const min = m % 60;
    slots.push(`${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }
  return slots;
}

// Default fallback times (15-min steps, 14:00-23:00)
const DEFAULT_TIMES = generateTimeSlots("14:00", "23:45");

export function useOpeningHours() {
  const [hours, setHours] = useState<OpeningHours | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await supabase.functions.invoke("admin-actions", {
          body: { action: "get_settings" },
        });
        if (res.data?.settings?.opening_hours) {
          setHours(res.data.settings.opening_hours);
        }
      } catch {
        // use defaults
      }
      setLoading(false);
    })();
  }, []);

  const getTimesForDate = useMemo(() => {
    return (dateStr: string): string[] => {
      if (!hours || !dateStr) return DEFAULT_TIMES;

      const date = new Date(dateStr + "T00:00:00");
      const jsDay = date.getDay(); // 0=Sun
      const dayKey = DAY_KEYS[jsDay === 0 ? 6 : jsDay - 1];
      const dayConfig = hours[dayKey];

      if (!dayConfig || dayConfig.closed) return [];

      return generateTimeSlots(dayConfig.open, dayConfig.close);
    };
  }, [hours]);

  return { getTimesForDate, loading, hours };
}

// Static 15-min time list for edge function validation
export const ALL_VALID_TIMES_15MIN: string[] = (() => {
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return times;
})();
