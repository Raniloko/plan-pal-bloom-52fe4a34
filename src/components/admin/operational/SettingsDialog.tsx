import { useState, useEffect } from "react";
import { X, Clock, UtensilsCrossed, Users, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface OpeningHours {
  [day: string]: { open: string; close: string; closed: boolean };
}

interface MealSlot {
  name: string;
  start: string;
  end: string;
}

const DAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const DEFAULT_HOURS: OpeningHours = Object.fromEntries(
  DAY_KEYS.map(d => [d, { open: "17:00", close: "02:00", closed: false }])
);

const DEFAULT_MEALS: MealSlot[] = [
  { name: "Mittagessen", start: "11:30", end: "14:30" },
  { name: "Abendessen", start: "17:00", end: "22:00" },
  { name: "Spätabend", start: "22:00", end: "02:00" },
];

const DEFAULT_DURATION = 120; // minutes

const inputStyle: React.CSSProperties = {
  background: "#1a1a1a", border: "1px solid #333", borderRadius: 6, padding: "6px 10px",
  color: "#fff", fontSize: 13, width: 90, fontFamily: "'DM Sans', sans-serif",
};

export const SettingsDialog = ({ open, onClose }: Props) => {
  const [tab, setTab] = useState<"hours" | "meals" | "capacity">("hours");
  const [hours, setHours] = useState<OpeningHours>(DEFAULT_HOURS);
  const [meals, setMeals] = useState<MealSlot[]>(DEFAULT_MEALS);
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await supabase.functions.invoke("admin-actions", {
          body: { action: "get_settings" },
        });
        if (res.data?.settings) {
          const s = res.data.settings;
          if (s.opening_hours) setHours(s.opening_hours);
          if (s.meal_slots) setMeals(s.meal_slots);
          if (s.reservation_duration) setDuration(Number(s.reservation_duration) || DEFAULT_DURATION);
        }
      } catch { /* use defaults */ }
    })();
  }, [open]);

  const save = async () => {
    setSaving(true);
    try {
      await supabase.functions.invoke("admin-actions", {
        body: { action: "save_settings", settings: { opening_hours: hours, meal_slots: meals, reservation_duration: duration } },
      });
      toast.success("Einstellungen gespeichert");
      onClose();
    } catch {
      toast.error("Fehler beim Speichern");
    }
    setSaving(false);
  };

  if (!open) return null;

  const tabs = [
    { key: "hours" as const, label: "Öffnungszeiten", icon: <Clock size={14} /> },
    { key: "meals" as const, label: "Mahlzeiten", icon: <UtensilsCrossed size={14} /> },
    { key: "capacity" as const, label: "Kapazitäten", icon: <Users size={14} /> },
  ];

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9998 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 560, maxHeight: "80vh", background: "#141414", border: "1px solid #2a2a2a",
        borderRadius: 12, zIndex: 9999, display: "flex", flexDirection: "column",
        fontFamily: "'DM Sans', sans-serif", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #2a2a2a" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Einstellungen</span>
          <button onClick={onClose} style={{ color: "#666", background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #2a2a2a" }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "10px 0", fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? "#fff" : "#666", background: tab === t.key ? "#1e1e1e" : "transparent",
              border: "none", borderBottom: tab === t.key ? "2px solid #4ade80" : "2px solid transparent",
              cursor: "pointer",
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
          {tab === "hours" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {DAY_KEYS.map((dk, i) => (
                <div key={dk} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 100, fontSize: 13, color: hours[dk]?.closed ? "#555" : "#ccc", fontWeight: 500 }}>{DAYS[i]}</span>
                  <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#888", cursor: "pointer" }}>
                    <input type="checkbox" checked={hours[dk]?.closed || false} onChange={e => setHours(h => ({ ...h, [dk]: { ...h[dk], closed: e.target.checked } }))} />
                    Ruhetag
                  </label>
                  {!hours[dk]?.closed && (
                    <>
                      <input type="time" value={hours[dk]?.open || "17:00"} onChange={e => setHours(h => ({ ...h, [dk]: { ...h[dk], open: e.target.value } }))} style={inputStyle} />
                      <span style={{ color: "#555" }}>–</span>
                      <input type="time" value={hours[dk]?.close || "02:00"} onChange={e => setHours(h => ({ ...h, [dk]: { ...h[dk], close: e.target.value } }))} style={inputStyle} />
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === "meals" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {meals.map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "#1a1a1a", borderRadius: 8 }}>
                  <input value={m.name} onChange={e => { const nm = [...meals]; nm[i] = { ...nm[i], name: e.target.value }; setMeals(nm); }}
                    style={{ ...inputStyle, width: 140 }} placeholder="Name" />
                  <input type="time" value={m.start} onChange={e => { const nm = [...meals]; nm[i] = { ...nm[i], start: e.target.value }; setMeals(nm); }} style={inputStyle} />
                  <span style={{ color: "#555" }}>–</span>
                  <input type="time" value={m.end} onChange={e => { const nm = [...meals]; nm[i] = { ...nm[i], end: e.target.value }; setMeals(nm); }} style={inputStyle} />
                  <button onClick={() => setMeals(meals.filter((_, j) => j !== i))} style={{ color: "#f87171", background: "none", border: "none", cursor: "pointer", fontSize: 18 }}>×</button>
                </div>
              ))}
              <button onClick={() => setMeals([...meals, { name: "", start: "12:00", end: "15:00" }])} style={{
                padding: "8px 16px", fontSize: 13, color: "#4ade80", background: "transparent",
                border: "1px dashed #333", borderRadius: 8, cursor: "pointer",
              }}>
                + Mahlzeit hinzufügen
              </button>
            </div>
          )}

          {tab === "capacity" && (
            <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>
              <p style={{ marginBottom: 12 }}>Tisch-Kapazitäten werden direkt über die Einheiten-Verwaltung konfiguriert. Klicke auf einen Tisch im Grundriss, um dessen Kapazität anzupassen.</p>
              <p style={{ color: "#555" }}>Geplant: Bereichs-übergreifende Kapazitätslimits und automatische Overbooking-Regeln.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "12px 20px", borderTop: "1px solid #2a2a2a" }}>
          <button onClick={onClose} style={{ padding: "8px 20px", fontSize: 13, color: "#888", background: "transparent", border: "1px solid #333", borderRadius: 8, cursor: "pointer" }}>
            Abbrechen
          </button>
          <button onClick={save} disabled={saving} style={{
            padding: "8px 20px", fontSize: 13, color: "#111", fontWeight: 600,
            background: "#4ade80", border: "none", borderRadius: 8, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6, opacity: saving ? 0.6 : 1,
          }}>
            <Save size={14} /> Speichern
          </button>
        </div>
      </div>
    </>
  );
};
