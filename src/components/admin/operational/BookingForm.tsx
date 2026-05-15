import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, Timer } from "lucide-react";
import { useOpeningHours } from "@/hooks/useOpeningHours";

interface UnitOption {
  id: string;
  name: string;
  area: string;
  status: string | null;
  capacity?: number | null;
}

interface ReservationRef {
  id: string;
  unit_id: string | null;
  status: string;
  customer_name?: string;
  reservation_time?: string;
  guest_count?: number;
}

interface Props {
  tableLabel?: string;
  initialZone?: string;
  initialUnitId?: string;
  initialWalkIn?: boolean;
  initialGuest?: string;
  initialEmail?: string;
  initialPhone?: string;
  initialDate?: string;
  initialTime?: string;
  initialPax?: number;
  allUnits?: UnitOption[];
  reservations?: ReservationRef[];
  onSuccess: () => void;
  onCancel: () => void;
}

const ZONE_FOR_AREA: Record<string, string> = {
  billard: "billard",
  kicker: "billard",
  dart: "billard",
  restaurant: "hauptbereich",
  hauptbereich: "hauptbereich",
  fenster: "fenster",
  vip: "vip",
  podest: "podest",
  salitos: "salitos",
};

const ZONE_OPTIONS: { value: string; label: string }[] = [
  { value: "hauptbereich", label: "Restaurant 140 Zoll" },
  { value: "fenster", label: "Restaurant 75 Zoll" },
  { value: "salitos", label: "Salitos Lounge / Outdoor" },
  { value: "podest", label: "Podest" },
  { value: "vip", label: "VIP" },
  { value: "billard", label: "Billard" },
];

/** Normalize an arbitrary time string to strict "HH:MM" (15-min aligned). */
const normalizeTime = (raw: string): string => {
  if (!raw) return "00:00";
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return "00:00";
  let h = Math.max(0, Math.min(23, parseInt(m[1], 10)));
  let min = Math.max(0, Math.min(59, parseInt(m[2], 10)));
  // round down to nearest quarter
  min = Math.floor(min / 15) * 15;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
};

const OCCASIONS = [
  { value: "essen", label: "Essen" },
  { value: "sport", label: "Sport schauen" },
  { value: "feier", label: "Feier" },
  { value: "billard", label: "Billard spielen" },
  { value: "sonstiges", label: "Sonstiges" },
];

const getNextQuarterHour = (): string => {
  const now = new Date();
  const totalMins = now.getHours() * 60 + now.getMinutes();
  const nextTotal = Math.ceil(totalMins / 15) * 15;
  const h = Math.floor(nextTotal / 60) % 24;
  const m = nextTotal % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const BookingForm = ({ tableLabel, initialZone, initialUnitId, initialWalkIn = false, initialGuest, initialEmail, initialPhone, initialDate, initialTime, initialPax, allUnits = [], reservations = [], onSuccess, onCancel }: Props) => {
  const { getTimesForDate } = useOpeningHours();
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const defaultTime = getNextQuarterHour();
  const availableTimes = getTimesForDate(todayStr);
  const smartDefault = availableTimes.find(t => t >= defaultTime) || availableTimes[0] || "19:00";

  const [guest, setGuest] = useState(initialGuest || "");
  const [email, setEmail] = useState(initialEmail || "");
  const [phone, setPhone] = useState(initialPhone || "");
  const [pax, setPax] = useState(initialPax ?? 2);
  const [date, setDate] = useState(initialDate || todayStr);
  const [startTime, setStartTime] = useState(initialTime || smartDefault);
  const [selectedUnitId, setSelectedUnitId] = useState(initialUnitId || "");
  const [selectedZone, setSelectedZone] = useState<string>(initialZone || "hauptbereich");
  const [occasion, setOccasion] = useState<string[]>(["essen"]);
  const [sonstigesText, setSonstigesText] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isWalkIn, setIsWalkIn] = useState(initialWalkIn);

  useEffect(() => {
    setIsWalkIn(initialWalkIn);
  }, [initialWalkIn]);

  // Derive zone from selected unit
  const zone = useMemo(() => {
    if (selectedUnitId) {
      const unit = allUnits.find(u => u.id === selectedUnitId);
      if (unit) return ZONE_FOR_AREA[unit.area] || unit.area;
    }
    return selectedZone;
  }, [selectedUnitId, allUnits, selectedZone]);

  const isBillard = zone === "billard";

  // Group units by area for the dropdown
  const groupedUnits = useMemo(() => {
    const groups: Record<string, UnitOption[]> = {};
    allUnits.filter(u => {
      const lower = u.name.toLowerCase();
      return !lower.startsWith("kicker") && !lower.startsWith("dart");
    }).forEach(u => {
      (groups[u.area] = groups[u.area] || []).push(u);
    });
    return groups;
  }, [allUnits]);

  // Build unit status map for icons in dropdown
  const unitStatusMap = useMemo(() => {
    const map = new Map<string, "occupied" | "reserved">();
    reservations.forEach(r => {
      if (!r.unit_id) return;
      if (r.status === "checked_in") map.set(r.unit_id, "occupied");
      else if ((r.status === "confirmed" || r.status === "pending") && !map.has(r.unit_id)) {
        map.set(r.unit_id, "reserved");
      }
    });
    return map;
  }, [reservations]);

  /**
   * Pick the best fitting free table in `zone` for `pax` people.
   * Prefers smallest capacity that is >= pax.
   */
  const pickAutoUnit = (): string | null => {
    // Map ZONE -> matching area names in DB
    const areaMatchers: Record<string, (a: string) => boolean> = {
      hauptbereich: a => a === "restaurant" || a === "hauptbereich",
      fenster: a => a === "fenster",
      vip: a => a === "vip",
      billard: a => a === "billard",
      podest: a => a === "podest",
      salitos: a => a === "salitos",
    };
    const match = areaMatchers[zone] || ((a: string) => a === zone);

    const candidates = allUnits.filter(u => {
      if (!match(u.area)) return false;
      const lower = u.name.toLowerCase();
      if (lower.startsWith("kicker") || lower.startsWith("dart")) return false;
      if (u.status === "blocked") return false;
      const reservedStatus = unitStatusMap.get(u.id);
      if (reservedStatus) return false; // already booked / occupied
      const cap = (u.capacity ?? 4);
      // For billard tables, capacity matching is loose (game tables often listed at 4)
      if (zone === "billard") return true;
      return cap >= pax;
    });

    if (candidates.length === 0) return null;
    // Sort by smallest fitting capacity (then by position/name)
    candidates.sort((a, b) => {
      const ca = a.capacity ?? 4;
      const cb = b.capacity ?? 4;
      if (ca !== cb) return ca - cb;
      return a.name.localeCompare(b.name);
    });
    return candidates[0].id;
  };

  const handleSubmit = async () => {
    if (!isWalkIn && !guest.trim()) {
      toast.error("Bitte mindestens einen Gastnamen eingeben");
      return;
    }

    // Normalize time to strict HH:MM, 15-min aligned
    const cleanTime = normalizeTime(startTime);
    if (cleanTime !== startTime) {
      console.warn(`[BookingForm] time normalized: "${startTime}" -> "${cleanTime}"`);
    }

    // Auto-pick a unit if none selected
    let unitToAssign = selectedUnitId;
    if (!unitToAssign) {
      const auto = pickAutoUnit();
      if (auto) {
        unitToAssign = auto;
        const u = allUnits.find(x => x.id === auto);
        if (u) toast.message(`Tisch automatisch gewählt: ${u.name}`);
      }
    }

    setSaving(true);
    try {
      const res = await supabase.functions.invoke("create-reservation", {
        body: {
          name: guest.trim() || (isWalkIn ? "Walk-in Gast" : ""),
          email: email.trim() || "walkin@intern.local",
          phone: phone.trim() || "000",
          guests: pax,
          date,
          time: cleanTime,
          zone,
          unit_id: unitToAssign || undefined,
          anlass: occasion.includes("sonstiges") && sonstigesText.trim()
            ? [...occasion.filter(o => o !== "sonstiges"), `sonstiges: ${sonstigesText.trim().replace(/,/g, ";")}`].join(", ")
            : occasion.join(", "),
          message: (isWalkIn ? "Walk-in Gast. " : "") + (isBillard ? "Billard – Abrechnung per Live-Timer (0,23 €/Min). " : "") + (note.trim() || ""),
          honeypot: "",
        },
      });
      if (res.error) throw res.error;
      const body = res.data;
      if (body?.error) {
        toast.error(body.error);
        setSaving(false);
        return;
      }

      // Auto-assign unit if selected
      if (unitToAssign && body?.reservation_id) {
        try {
          await supabase.functions.invoke("admin-actions", {
            body: { action: "assign_unit", reservation_id: body.reservation_id, unit_id: unitToAssign },
          });
        } catch { /* silent - unit assignment is best-effort */ }
      }

      setSuccess(true);
      toast.success(isWalkIn ? "Walk-in erstellt" : "Reservierung erstellt");
      setTimeout(() => onSuccess(), 1200);
    } catch (err: any) {
      toast.error(err?.message || "Fehler beim Erstellen");
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 0", textAlign: "center" }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%", background: "#2a7a2a",
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12,
        }}>
          <Check size={24} color="#fff" />
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>{isWalkIn ? "Walk-in erstellt" : "Reservierung erstellt"}</span>
        <span style={{ fontSize: 12, color: "#999", marginTop: 4 }}>{guest} · {pax} Pers. · {startTime}</span>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px", fontSize: 12, border: "1px solid #ddd",
    borderRadius: 6, outline: "none", fontFamily: "'DM Sans', sans-serif",
    background: "#fff", color: "#111",
  };
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: "#555", marginBottom: 4, display: "block" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 2 }}>
        {isWalkIn ? "Walk-in Gast" : "Neue Reservierung"} {tableLabel ? `· ${tableLabel}` : ""}
      </div>

      {/* Walk-in toggle */}
      <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
        <button type="button" onClick={() => setIsWalkIn(false)} style={{
          padding: "5px 14px", fontSize: 11, borderRadius: 20, cursor: "pointer",
          border: !isWalkIn ? "1.5px solid #c9a84c" : "1px solid #ddd",
          background: !isWalkIn ? "#c9a84c22" : "#fff",
          color: !isWalkIn ? "#111" : "#666", fontWeight: !isWalkIn ? 700 : 400,
          fontFamily: "'DM Sans', sans-serif",
        }}>Reservierung</button>
        <button type="button" onClick={() => setIsWalkIn(true)} style={{
          padding: "5px 14px", fontSize: 11, borderRadius: 20, cursor: "pointer",
          border: isWalkIn ? "1.5px solid #4ade80" : "1px solid #ddd",
          background: isWalkIn ? "#4ade8022" : "#fff",
          color: isWalkIn ? "#111" : "#666", fontWeight: isWalkIn ? 700 : 400,
          fontFamily: "'DM Sans', sans-serif",
        }}>Walk-in</button>
      </div>

      <div>
        <label style={labelStyle}>Gastname *</label>
        <input value={guest} onChange={e => setGuest(e.target.value)} placeholder="Vor- und Nachname" style={inputStyle} />
      </div>
      {!isWalkIn && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <label style={labelStyle}>E-Mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Optional" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Telefon</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Optional" style={inputStyle} />
          </div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <div>
          <label style={labelStyle}>Personen</label>
          <select value={pax} onChange={e => setPax(Number(e.target.value))} style={inputStyle}>
            {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Datum</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Uhrzeit</label>
          <select value={startTime} onChange={e => setStartTime(e.target.value)} style={inputStyle}>
            {getTimesForDate(date).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Zone selector */}
      <div>
        <label style={labelStyle}>Bereich *</label>
        <select
          value={selectedUnitId ? zone : selectedZone}
          onChange={e => {
            setSelectedZone(e.target.value);
            setSelectedUnitId(""); // reset table when zone changes
          }}
          style={inputStyle}
        >
          {ZONE_OPTIONS.map(z => (
            <option key={z.value} value={z.value}>{z.label}</option>
          ))}
        </select>
      </div>

      {/* Table (Unit) selector */}
      <div>
        <label style={labelStyle}>Tisch zuweisen</label>
        <select
          value={selectedUnitId}
          onChange={e => setSelectedUnitId(e.target.value)}
          style={inputStyle}
        >
          <option value="">— Automatisch passenden Tisch wählen —</option>
          {Object.entries(groupedUnits).map(([area, areaUnits]) => (
            <optgroup key={area} label={area.charAt(0).toUpperCase() + area.slice(1)}>
              {areaUnits.map(u => {
                const resStatus = unitStatusMap.get(u.id);
                const statusIcon = resStatus === "occupied" ? "🔴" : resStatus === "reserved" ? "🟡" : u.status === "blocked" ? "⛔" : "🟢";
                const cap = u.capacity ?? 4;
                return (
                  <option key={u.id} value={u.id}>{statusIcon} {u.name} ({cap}P.)</option>
                );
              })}
            </optgroup>
          ))}
        </select>
        {!selectedUnitId && (
          <div style={{ fontSize: 10, color: "#e07820", marginTop: 3 }}>
            Es wird automatisch der kleinste freie Tisch ≥ {pax} Personen im Bereich "{zone}" gewählt.
          </div>
        )}
      </div>

      <div>
        <label style={labelStyle}>Anlass (Mehrfachauswahl)</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {OCCASIONS.map(o => {
            const selected = occasion.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => setOccasion(prev =>
                  selected ? prev.filter(x => x !== o.value) : [...prev, o.value]
                )}
                style={{
                  padding: "4px 10px", fontSize: 11, borderRadius: 4,
                  border: selected ? "1.5px solid #c9a84c" : "1px solid #ddd",
                  background: selected ? "#c9a84c22" : "#fff",
                  color: selected ? "#111" : "#666",
                  cursor: "pointer", fontWeight: selected ? 700 : 400,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >{o.label}</button>
            );
          })}
        </div>
      </div>
      {occasion.includes("sonstiges") && (
        <div>
          <label style={labelStyle}>Sonstiges – bitte beschreiben</label>
          <input value={sonstigesText} onChange={e => setSonstigesText(e.target.value)} placeholder="z.B. Firmenevent..." style={inputStyle} />
        </div>
      )}
      {isBillard && (
        <div style={{ background: "#f8f8f8", border: "1px solid #eaeaea", borderRadius: 8, padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <Timer size={16} color="#c9a84c" />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>Live-Timer Abrechnung</div>
            <div style={{ fontSize: 10, color: "#999" }}>Kosten werden ab Check-in bis Check-out berechnet (0,23 €/Min)</div>
          </div>
        </div>
      )}
      <div>
        <label style={labelStyle}>Nachricht / Notiz</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Optional..." style={{ ...inputStyle, height: 50, resize: "none" }} />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: "10px", fontSize: 12, fontWeight: 600, borderRadius: 6,
          background: "#f2f2f2", color: "#666", border: "1px solid #ddd", cursor: "pointer",
        }}>Abbrechen</button>
        <button onClick={handleSubmit} disabled={saving || (!isWalkIn && !guest.trim())} style={{
          flex: 1, padding: "10px", fontSize: 12, fontWeight: 700, borderRadius: 6,
          background: (!isWalkIn && !guest.trim()) ? "#ccc" : isWalkIn ? "#4ade80" : "#c9a84c", color: "#111", border: "none", cursor: "pointer",
          opacity: saving ? 0.6 : 1,
        }}>{saving ? "Speichern..." : isWalkIn ? "Walk-in anlegen" : "Reservierung anlegen"}</button>
      </div>
    </div>
  );
};

export default BookingForm;
