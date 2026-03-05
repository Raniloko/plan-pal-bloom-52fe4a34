import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

const SettingsPage = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("settings").select("*").then(({ data }) => {
      const map: Record<string, any> = {};
      data?.forEach((s: any) => { map[s.key] = s.value; });
      setSettings(map);
      setLoading(false);
    });
  }, []);

  const saveSetting = async (key: string, value: any) => {
    const { error } = await supabase.from("settings").update({ value, updated_at: new Date().toISOString() } as any).eq("key", key);
    if (error) toast({ title: "Fehler", description: error.message, variant: "destructive" });
    else toast({ title: "Gespeichert" });
  };

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const dayLabels: Record<string, string> = { monday: "Montag", tuesday: "Dienstag", wednesday: "Mittwoch", thursday: "Donnerstag", friday: "Freitag", saturday: "Samstag", sunday: "Sonntag" };
  const ic = "bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  if (loading) return <p className="text-muted-foreground">Laden...</p>;

  const openingHours = settings.opening_hours || {};
  const areasEnabled = settings.areas_enabled || {};
  const emailSender = settings.email_sender || {};
  const notifEnabled = settings.notifications_enabled || {};

  return (
    <div className="space-y-8 max-w-3xl">
      <h2 className="font-display text-3xl tracking-wider">⚙️ Einstellungen</h2>

      <section className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-display text-xl tracking-wider mb-4">Öffnungszeiten</h3>
        <div className="space-y-3">
          {days.map(day => (
            <div key={day} className="grid grid-cols-3 gap-3 items-center">
              <span className="text-sm">{dayLabels[day]}</span>
              <input type="time" value={openingHours[day]?.open || ""} onChange={(e) => setSettings({ ...settings, opening_hours: { ...openingHours, [day]: { ...openingHours[day], open: e.target.value } } })} className={ic} />
              <input type="time" value={openingHours[day]?.close || ""} onChange={(e) => setSettings({ ...settings, opening_hours: { ...openingHours, [day]: { ...openingHours[day], close: e.target.value } } })} className={ic} />
            </div>
          ))}
        </div>
        <button onClick={() => saveSetting("opening_hours", settings.opening_hours)} className="mt-4 flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"><Save size={14} /> Speichern</button>
      </section>

      <section className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-display text-xl tracking-wider mb-4">Bereiche verwalten</h3>
        <div className="space-y-3">
          {["billard", "kicker", "dart", "restaurant", "vip"].map(area => (
            <label key={area} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={areasEnabled[area] ?? true} onChange={(e) => setSettings({ ...settings, areas_enabled: { ...areasEnabled, [area]: e.target.checked } })} className="rounded border-border" />
              <span className="text-sm capitalize">{area}</span>
            </label>
          ))}
        </div>
        <button onClick={() => saveSetting("areas_enabled", settings.areas_enabled)} className="mt-4 flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"><Save size={14} /> Speichern</button>
      </section>

      <section className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-display text-xl tracking-wider mb-4">E-Mail Absender</h3>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-muted-foreground mb-1 block">Absendername</label>
            <input value={emailSender.name || ""} onChange={(e) => setSettings({ ...settings, email_sender: { ...emailSender, name: e.target.value } })} className={`${ic} w-full`} /></div>
          <div><label className="text-xs text-muted-foreground mb-1 block">E-Mail</label>
            <input value={emailSender.email || ""} onChange={(e) => setSettings({ ...settings, email_sender: { ...emailSender, email: e.target.value } })} className={`${ic} w-full`} /></div>
        </div>
        <button onClick={() => saveSetting("email_sender", settings.email_sender)} className="mt-4 flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"><Save size={14} /> Speichern</button>
      </section>

      <section className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-display text-xl tracking-wider mb-4">Benachrichtigungen</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={notifEnabled.new_reservation ?? true} onChange={(e) => setSettings({ ...settings, notifications_enabled: { ...notifEnabled, new_reservation: e.target.checked } })} className="rounded border-border" />
            <span className="text-sm">Bei neuer Reservierung</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={notifEnabled.cancellation ?? true} onChange={(e) => setSettings({ ...settings, notifications_enabled: { ...notifEnabled, cancellation: e.target.checked } })} className="rounded border-border" />
            <span className="text-sm">Bei Stornierung</span>
          </label>
        </div>
        <button onClick={() => saveSetting("notifications_enabled", settings.notifications_enabled)} className="mt-4 flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"><Save size={14} /> Speichern</button>
      </section>
    </div>
  );
};

export default SettingsPage;
