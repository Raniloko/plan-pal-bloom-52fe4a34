import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface OpeningHour { open: string; close: string }
interface Settings {
  opening_hours: Record<string, OpeningHour>;
  areas_enabled: Record<string, boolean>;
  email_sender: { name: string; email: string };
  notifications_enabled: { new_reservation: boolean; cancellation: boolean };
  booking_rules: { min_lead_time_hours: number; max_duration_minutes: Record<string, number> };
}

const defaultSettings: Settings = {
  opening_hours: Object.fromEntries(
    ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].map(d => [d, { open: "14:00", close: "02:00" }])
  ),
  areas_enabled: { billard: true, kicker: true, dart: true, restaurant: true, vip: true },
  email_sender: { name: "Rondo Sportsbar", email: "" },
  notifications_enabled: { new_reservation: true, cancellation: true },
  booking_rules: { min_lead_time_hours: 2, max_duration_minutes: { billard: 120, kicker: 60, dart: 60, restaurant: 180, vip: 300 } },
};

const SettingsContext = createContext<{
  settings: Settings;
  loading: boolean;
  updateSetting: (key: string, value: any) => Promise<void>;
}>({ settings: defaultSettings, loading: true, updateSetting: async () => {} });

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    const { data } = await supabase.from("settings").select("*");
    if (data) {
      const map: any = {};
      data.forEach((s: any) => { map[s.key] = s.value; });
      setSettings(prev => ({ ...prev, ...map }));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
    const channel = supabase.channel("settings-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "settings" }, () => loadSettings())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadSettings]);

  const updateSetting = async (key: string, value: any) => {
    await supabase.from("settings").update({ value, updated_at: new Date().toISOString() } as any).eq("key", key);
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
};
