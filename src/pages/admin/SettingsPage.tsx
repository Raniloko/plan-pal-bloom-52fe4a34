import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/contexts/SettingsContext";
import { useToast } from "@/hooks/use-toast";
import { Save, Key } from "lucide-react";

const SettingsPage = () => {
  const { toast } = useToast();
  const { settings, loading, updateSetting } = useSettings();
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [savingAdmin, setSavingAdmin] = useState(false);

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const dayLabels: Record<string, string> = { monday: "Montag", tuesday: "Dienstag", wednesday: "Mittwoch", thursday: "Donnerstag", friday: "Freitag", saturday: "Samstag", sunday: "Sonntag" };
  const ic = "bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

  if (loading) return <p className="text-muted-foreground">Laden...</p>;

  const openingHours = settings.opening_hours || {};
  const areasEnabled = settings.areas_enabled || {};
  const emailSender = settings.email_sender || { name: "", email: "" };
  const notifEnabled = settings.notifications_enabled || { new_reservation: true, cancellation: true };
  const bookingRules = settings.booking_rules || { min_lead_time_hours: 2, max_duration_minutes: {} };

  const handleSave = async (key: string) => {
    await updateSetting(key, (settings as any)[key]);
    // Log activity
    await (supabase as any).from("activity_log").insert({ action: "settings_updated", details: `${key} aktualisiert` });
    toast({ title: "✅ Gespeichert" });
  };

  const handleAdminUpdate = async () => {
    setSavingAdmin(true);
    try {
      const updates: any = {};
      if (adminEmail) updates.email = adminEmail;
      if (adminPassword) updates.password = adminPassword;
      if (Object.keys(updates).length === 0) { toast({ title: "Keine Änderungen" }); return; }
      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;
      toast({ title: "✅ Admin-Daten aktualisiert" });
      setAdminEmail(""); setAdminPassword("");
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    } finally { setSavingAdmin(false); }
  };

  const updateLocal = (key: string, value: any) => {
    // Update settings in context directly for immediate local feedback
    (settings as any)[key] = value;
  };

  const SaveBtn = ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} className="mt-4 flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20">
      <Save size={14} /> Speichern
    </button>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="font-display text-3xl tracking-wider">⚙️ Einstellungen</h2>

      {/* Opening hours */}
      <section className="glass-card rounded-xl p-5">
        <h3 className="font-display text-xl tracking-wider mb-4">Öffnungszeiten</h3>
        <div className="space-y-3">
          {days.map(day => (
            <div key={day} className="grid grid-cols-3 gap-3 items-center">
              <span className="text-sm">{dayLabels[day]}</span>
              <input type="time" value={openingHours[day]?.open || ""} onChange={(e) => {
                const updated = { ...openingHours, [day]: { ...openingHours[day], open: e.target.value } };
                updateLocal("opening_hours", updated);
              }} className={ic} />
              <input type="time" value={openingHours[day]?.close || ""} onChange={(e) => {
                const updated = { ...openingHours, [day]: { ...openingHours[day], close: e.target.value } };
                updateLocal("opening_hours", updated);
              }} className={ic} />
            </div>
          ))}
        </div>
        <SaveBtn onClick={() => handleSave("opening_hours")} />
      </section>

      {/* Areas */}
      <section className="glass-card rounded-xl p-5">
        <h3 className="font-display text-xl tracking-wider mb-4">Bereiche verwalten</h3>
        <div className="space-y-3">
          {["billard", "kicker", "dart", "restaurant", "vip"].map(area => (
            <label key={area} className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={areasEnabled[area] ?? true} onChange={(e) => {
                const updated = { ...areasEnabled, [area]: e.target.checked };
                updateLocal("areas_enabled", updated);
              }} className="rounded border-border accent-primary" />
              <span className="text-sm capitalize group-hover:text-primary transition-colors">{area}</span>
            </label>
          ))}
        </div>
        <SaveBtn onClick={() => handleSave("areas_enabled")} />
      </section>

      {/* Booking rules */}
      <section className="glass-card rounded-xl p-5">
        <h3 className="font-display text-xl tracking-wider mb-4">Buchungsregeln</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Mindestvorlaufzeit (Stunden)</label>
            <input type="number" min={0} max={72} value={bookingRules.min_lead_time_hours} onChange={(e) => {
              const updated = { ...bookingRules, min_lead_time_hours: parseInt(e.target.value) || 0 };
              updateLocal("booking_rules", updated);
            }} className={`${ic} w-32`} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Max. Buchungsdauer (Minuten pro Bereich)</label>
            <div className="grid grid-cols-2 gap-3">
              {["billard", "kicker", "dart", "restaurant", "vip"].map(area => (
                <div key={area} className="flex items-center gap-2">
                  <span className="text-sm capitalize w-24">{area}</span>
                  <input type="number" min={15} max={600} step={15}
                    value={bookingRules.max_duration_minutes?.[area] || 120}
                    onChange={(e) => {
                      const updated = { ...bookingRules, max_duration_minutes: { ...bookingRules.max_duration_minutes, [area]: parseInt(e.target.value) || 120 } };
                      updateLocal("booking_rules", updated);
                    }} className={`${ic} w-24`} />
                  <span className="text-xs text-muted-foreground">Min.</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <SaveBtn onClick={() => handleSave("booking_rules")} />
      </section>

      {/* Admin credentials */}
      <section className="glass-card rounded-xl p-5">
        <h3 className="font-display text-xl tracking-wider mb-4 flex items-center gap-2"><Key size={18} /> Admin-Zugangsdaten</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Neue E-Mail</label>
            <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@rondo-sportsbar.de" className={`${ic} w-full`} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Neues Passwort</label>
            <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="••••••••" className={`${ic} w-full`} />
          </div>
        </div>
        <button onClick={handleAdminUpdate} disabled={savingAdmin} className="mt-4 flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20 disabled:opacity-50">
          <Save size={14} /> {savingAdmin ? "Speichern..." : "Zugangsdaten aktualisieren"}
        </button>
      </section>

      {/* Email sender */}
      <section className="glass-card rounded-xl p-5">
        <h3 className="font-display text-xl tracking-wider mb-4">E-Mail Absender</h3>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-muted-foreground mb-1 block">Absendername</label>
            <input value={emailSender.name || ""} onChange={(e) => updateLocal("email_sender", { ...emailSender, name: e.target.value })} className={`${ic} w-full`} /></div>
          <div><label className="text-xs text-muted-foreground mb-1 block">E-Mail</label>
            <input value={emailSender.email || ""} onChange={(e) => updateLocal("email_sender", { ...emailSender, email: e.target.value })} className={`${ic} w-full`} /></div>
        </div>
        <SaveBtn onClick={() => handleSave("email_sender")} />
      </section>

      {/* Notifications */}
      <section className="glass-card rounded-xl p-5">
        <h3 className="font-display text-xl tracking-wider mb-4">Benachrichtigungen</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={notifEnabled.new_reservation ?? true} onChange={(e) => updateLocal("notifications_enabled", { ...notifEnabled, new_reservation: e.target.checked })} className="rounded border-border accent-primary" />
            <span className="text-sm">Bei neuer Reservierung</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={notifEnabled.cancellation ?? true} onChange={(e) => updateLocal("notifications_enabled", { ...notifEnabled, cancellation: e.target.checked })} className="rounded border-border accent-primary" />
            <span className="text-sm">Bei Stornierung</span>
          </label>
        </div>
        <SaveBtn onClick={() => handleSave("notifications_enabled")} />
      </section>
    </div>
  );
};

export default SettingsPage;
