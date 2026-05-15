import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Repeat, X } from "lucide-react";
import { useOpeningHours } from "@/hooks/useOpeningHours";

interface UnitOption {
  id: string;
  name: string;
  area: string;
  capacity?: number | null;
  status?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  allUnits: UnitOption[];
}

const ZONES = [
  { value: "hauptbereich", label: "Restaurant 140 Zoll" },
  { value: "fenster", label: "Restaurant 75 Zoll" },
  { value: "vip", label: "VIP" },
  { value: "podest", label: "Podest" },
  { value: "billard", label: "Billard" },
];

const WEEKDAYS = [
  { v: 1, l: "Mo" }, { v: 2, l: "Di" }, { v: 3, l: "Mi" }, { v: 4, l: "Do" },
  { v: 5, l: "Fr" }, { v: 6, l: "Sa" }, { v: 0, l: "So" },
];

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", fontSize: 13,
  border: "1px solid #3a3a3a", borderRadius: 6, outline: "none",
  background: "#1a1a1a", color: "#fff", fontFamily: "'DM Sans', sans-serif",
};
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: "#999", marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: 0.4 };

const RecurringBookingDialog = ({ open, onClose, onSuccess, allUnits }: Props) => {
  const { getTimesForDate } = useOpeningHours();
  const today = format(new Date(), "yyyy-MM-dd");
  const in30 = format(new Date(Date.now() + 30 * 86400000), "yyyy-MM-dd");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [guests, setGuests] = useState(2);
  const [zone, setZone] = useState("hauptbereich");
  const [unitId, setUnitId] = useState<string>("");
  const [time, setTime] = useState("19:00");
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(in30);
  const [weekdays, setWeekdays] = useState<number[]>([3]); // Mi default
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ created_count: number; skipped: { date: string; reason: string }[] } | null>(null);

  const times = useMemo(() => getTimesForDate(fromDate), [fromDate, getTimesForDate]);

  useEffect(() => {
    // Reset table when zone changes
    setUnitId("");
  }, [zone]);

  if (!open) return null;

  const zoneUnits = allUnits.filter(u => u.area === zone);

  const toggleWd = (v: number) => {
    setWeekdays(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v].sort());
  };

  const submit = async () => {
    if (!name.trim()) { toast.error("Name fehlt"); return; }
    if (weekdays.length === 0) { toast.error("Mindestens ein Wochentag"); return; }
    if (!fromDate || !toDate) { toast.error("Datum fehlt"); return; }

    setSaving(true);
    try {
      const res = await supabase.functions.invoke("create-recurring-reservations", {
        body: {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          guests,
          zone,
          unit_id: unitId || undefined,
          time,
          from_date: fromDate,
          to_date: toDate,
          weekdays,
          note: note.trim(),
        },
      });
      if (res.error) throw res.error;
      const body = res.data;
      if (body?.error) { toast.error(body.error); setSaving(false); return; }
      setResult({ created_count: body.created_count || 0, skipped: body.skipped || [] });
      toast.success(`${body.created_count} Reservierung(en) angelegt`);
      onSuccess();
    } catch (e: any) {
      toast.error(e?.message || "Fehler beim Anlegen");
    } finally {
      setSaving(false);
    }
  };

  const close = () => {
    setResult(null);
    onClose();
  };

  return (
    <div onClick={close} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#0e0e0e", border: "1px solid #2a2a2a", borderRadius: 12,
        width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "14px 18px",
          borderBottom: "1px solid #2a2a2a",
        }}>
          <Repeat size={18} color="#c9a84c" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Stammkunden-Reservierung</div>
            <div style={{ fontSize: 11, color: "#777" }}>Wiederkehrend über mehrere Tage anlegen</div>
          </div>
          <button onClick={close} style={{
            background: "transparent", border: "none", color: "#888", cursor: "pointer", padding: 4,
          }}><X size={18} /></button>
        </div>

        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          {result ? (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#4ade80", marginBottom: 8 }}>
                ✓ {result.created_count} Reservierung(en) angelegt
              </div>
              {result.skipped.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#e07820", marginBottom: 6 }}>
                    {result.skipped.length} Tag(e) übersprungen:
                  </div>
                  <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 6, padding: 10, maxHeight: 200, overflowY: "auto" }}>
                    {result.skipped.map((s, i) => (
                      <div key={i} style={{ fontSize: 12, color: "#bbb", marginBottom: 3 }}>
                        <span style={{ color: "#fff", fontWeight: 600 }}>{s.date}</span> – {s.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={close} style={{
                marginTop: 16, width: "100%", padding: 10, fontSize: 13, fontWeight: 700,
                background: "#c9a84c", color: "#111", border: "none", borderRadius: 6, cursor: "pointer",
              }}>Schließen</button>
            </div>
          ) : (
            <>
              <div>
                <label style={labelStyle}>Stammkunde – Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Vor- und Nachname" style={inputStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Telefon (optional)</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="—" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>E-Mail (optional)</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="—" style={inputStyle} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Personen</label>
                  <select value={guests} onChange={e => setGuests(Number(e.target.value))} style={inputStyle}>
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Bereich</label>
                  <select value={zone} onChange={e => setZone(e.target.value)} style={inputStyle}>
                    {ZONES.map(z => <option key={z.value} value={z.value}>{z.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Uhrzeit</label>
                  <select value={time} onChange={e => setTime(e.target.value)} style={inputStyle}>
                    {times.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Tisch (optional)</label>
                <select value={unitId} onChange={e => setUnitId(e.target.value)} style={inputStyle}>
                  <option value="">— Automatisch passenden Tisch wählen —</option>
                  {zoneUnits.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.capacity ?? 4}P.)</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Von</label>
                  <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Bis</label>
                  <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Wochentage</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {WEEKDAYS.map(w => {
                    const sel = weekdays.includes(w.v);
                    return (
                      <button key={w.v} type="button" onClick={() => toggleWd(w.v)} style={{
                        padding: "8px 14px", fontSize: 12, fontWeight: 700, borderRadius: 6, cursor: "pointer",
                        border: sel ? "1.5px solid #c9a84c" : "1px solid #3a3a3a",
                        background: sel ? "#c9a84c22" : "#1a1a1a",
                        color: sel ? "#c9a84c" : "#888",
                      }}>{w.l}</button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Notiz (optional)</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="z.B. immer am Stammtisch" style={{ ...inputStyle, height: 60, resize: "none" }} />
              </div>

              <div style={{
                background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 6,
                padding: 10, fontSize: 11, color: "#999", lineHeight: 1.5,
              }}>
                Bereits belegte Tage werden automatisch übersprungen und am Ende aufgelistet.
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button onClick={close} style={{
                  flex: 1, padding: 11, fontSize: 13, fontWeight: 600, borderRadius: 6,
                  background: "#1a1a1a", color: "#999", border: "1px solid #3a3a3a", cursor: "pointer",
                }}>Abbrechen</button>
                <button onClick={submit} disabled={saving || !name.trim()} style={{
                  flex: 2, padding: 11, fontSize: 13, fontWeight: 700, borderRadius: 6,
                  background: !name.trim() ? "#444" : "#c9a84c", color: "#111", border: "none", cursor: "pointer",
                  opacity: saving ? 0.6 : 1,
                }}>{saving ? "Wird angelegt..." : "Reservierungen anlegen"}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecurringBookingDialog;
