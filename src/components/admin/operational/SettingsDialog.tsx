import { useState, useEffect } from "react";
import { X, Clock, Users, Save } from "lucide-react";
import { toast } from "sonner";
import { adm } from "@/components/admin/theme";
import { invokeAdmin } from "@/lib/adminApi";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface OpeningHours {
  [day: string]: { open: string; close: string; closed: boolean };
}

const DAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const DEFAULT_HOURS: OpeningHours = Object.fromEntries(
  DAY_KEYS.map(d => [d, { open: "17:00", close: "02:00", closed: false }])
);

const DEFAULT_DURATION = 120;
const DEFAULT_AUTO_CANCEL = 15;

const inputStyle: React.CSSProperties = {
  background: adm.surface, border: `1px solid ${adm.border}`, borderRadius: 6, padding: "6px 10px",
  color: adm.text, fontSize: 13, width: 90, fontFamily: "'DM Sans', sans-serif",
};

export const SettingsDialog = ({ open, onClose }: Props) => {
  const [tab, setTab] = useState<"hours" | "capacity">("hours");
  const [hours, setHours] = useState<OpeningHours>(DEFAULT_HOURS);
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [autoCancelMin, setAutoCancelMin] = useState(DEFAULT_AUTO_CANCEL);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await invokeAdmin({
          body: { action: "get_settings" },
        });
        if (res.data?.settings) {
          const s = res.data.settings;
          if (s.opening_hours) setHours(s.opening_hours);
          if (s.reservation_duration) setDuration(Number(s.reservation_duration) || DEFAULT_DURATION);
          if (s.auto_cancel_minutes) setAutoCancelMin(Number(s.auto_cancel_minutes) || DEFAULT_AUTO_CANCEL);
        }
      } catch { /* use defaults */ }
    })();
  }, [open]);

  const save = async () => {
    setSaving(true);
    try {
      await invokeAdmin({
        body: { action: "save_settings", settings: { opening_hours: hours, reservation_duration: duration, auto_cancel_minutes: autoCancelMin } },
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
    { key: "capacity" as const, label: "Kapazitäten", icon: <Users size={14} /> },
  ];

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: adm.overlay, zIndex: 9998 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 560, maxHeight: "80vh", background: adm.bg, border: `1px solid ${adm.border}`,
        borderRadius: 12, zIndex: 9999, display: "flex", flexDirection: "column",
        fontFamily: "'DM Sans', sans-serif", overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${adm.border}` }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: adm.text }}>Einstellungen</span>
          <button onClick={onClose} style={{ color: adm.muted, background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
        </div>

        <div style={{ display: "flex", borderBottom: `1px solid ${adm.border}` }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "10px 0", fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? adm.text : adm.muted, background: tab === t.key ? adm.surface2 : "transparent",
              border: "none", borderBottom: tab === t.key ? "2px solid #4ade80" : "2px solid transparent",
              cursor: "pointer",
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
          {tab === "hours" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {DAY_KEYS.map((dk, i) => (
                <div key={dk} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 100, fontSize: 13, color: hours[dk]?.closed ? adm.muted : adm.text2, fontWeight: 500 }}>{DAYS[i]}</span>
                  <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: adm.muted, cursor: "pointer" }}>
                    <input type="checkbox" checked={hours[dk]?.closed || false} onChange={e => setHours(h => ({ ...h, [dk]: { ...h[dk], closed: e.target.checked } }))} />
                    Ruhetag
                  </label>
                  {!hours[dk]?.closed && (
                    <>
                      <input type="time" value={hours[dk]?.open || "17:00"} onChange={e => setHours(h => ({ ...h, [dk]: { ...h[dk], open: e.target.value } }))} style={inputStyle} />
                      <span style={{ color: adm.muted }}>–</span>
                      <input type="time" value={hours[dk]?.close || "02:00"} onChange={e => setHours(h => ({ ...h, [dk]: { ...h[dk], close: e.target.value } }))} style={inputStyle} />
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === "capacity" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: adm.text2, marginBottom: 8 }}>Standard-Reservierungsdauer</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <select value={duration} onChange={e => setDuration(Number(e.target.value))} style={{ ...inputStyle, width: 160 }}>
                    {[60, 90, 120, 150, 180, 240].map(m => (
                      <option key={m} value={m}>{m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}min` : ""}` : `${m} Min`}</option>
                    ))}
                  </select>
                  <span style={{ fontSize: 11, color: adm.muted }}>Gilt für alle Bereiche außer Billard</span>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: adm.text2, marginBottom: 8 }}>Automatische Stornierung</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <select value={autoCancelMin} onChange={e => setAutoCancelMin(Number(e.target.value))} style={{ ...inputStyle, width: 160 }}>
                    {[0, 5, 10, 15, 20, 30, 45, 60].map(m => (
                      <option key={m} value={m}>{m === 0 ? "Deaktiviert" : `${m} Minuten`}</option>
                    ))}
                  </select>
                  <span style={{ fontSize: 11, color: adm.muted }}>Reservierungen werden automatisch storniert wenn nicht eingecheckt</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "12px 20px", borderTop: `1px solid ${adm.border}` }}>
          <button onClick={onClose} style={{ padding: "8px 20px", fontSize: 13, color: adm.muted, background: "transparent", border: `1px solid ${adm.border}`, borderRadius: 8, cursor: "pointer" }}>
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
