import { useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { useOpeningHours } from "@/hooks/useOpeningHours";

interface Props {
  tableLabel?: string;
  initialZone?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// TIMES are now dynamic from settings via useOpeningHours hook

const ZONES = [
  { value: "hauptbereich", label: "Hauptbereich" },
  { value: "billard", label: "Billard" },
  { value: "fenster", label: "Fensterbereich" },
  { value: "vip", label: "VIP Raum" },
  { value: "podest", label: "Podest" },
];

const OCCASIONS = [
  { value: "essen", label: "Essen" },
  { value: "sport", label: "Sport schauen" },
  { value: "feier", label: "Feier" },
  { value: "billard", label: "Billard spielen" },
  { value: "sonstiges", label: "Sonstiges" },
];

const BookingForm = ({ tableLabel, initialZone, onSuccess, onCancel }: Props) => {
  const { getTimesForDate } = useOpeningHours();
  const [guest, setGuest] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pax, setPax] = useState(2);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("19:00");
  const [zone, setZone] = useState(initialZone || "hauptbereich");
  const [occasion, setOccasion] = useState<string[]>(["essen"]);
  const [sonstigesText, setSonstigesText] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const isBillard = zone === "billard";

  const handleSubmit = async () => {
    if (!guest.trim() || !email.trim() || !phone.trim()) {
      toast.error("Bitte Name, E-Mail und Telefon ausfüllen");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Bitte eine gültige E-Mail-Adresse eingeben");
      return;
    }
    if (phone.trim().length < 5) {
      toast.error("Bitte eine gültige Telefonnummer eingeben");
      return;
    }

    setSaving(true);
    try {
      const res = await supabase.functions.invoke("create-reservation", {
        body: {
          name: guest.trim(),
          email: email.trim(),
          phone: phone.trim(),
          guests: pax,
          date,
          time: startTime,
          zone,
          anlass: occasion.includes("sonstiges") && sonstigesText.trim()
            ? [...occasion.filter(o => o !== "sonstiges"), `sonstiges: ${sonstigesText.trim()}`].join(", ")
            : occasion.join(", "),
          message: (isBillard ? "Billard – Abrechnung per Live-Timer (0,23 €/Min). " : "") + (note.trim() || ""),
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
      setSuccess(true);
      toast.success("Reservierung erstellt");
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
        <span style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>Reservierung erstellt</span>
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
        Neue Reservierung {tableLabel ? `· ${tableLabel}` : ""}
      </div>

      <div>
        <label style={labelStyle}>Gastname *</label>
        <input value={guest} onChange={e => setGuest(e.target.value)} placeholder="Vor- und Nachname" style={inputStyle} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <label style={labelStyle}>E-Mail *</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@beispiel.de" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Telefon *</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+49 ..." style={inputStyle} />
        </div>
      </div>
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <label style={labelStyle}>Bereich</label>
          <select value={zone} onChange={e => setZone(e.target.value)} style={inputStyle}>
            {ZONES.map(z => <option key={z.value} value={z.value}>{z.label}</option>)}
          </select>
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
      </div>
      {occasion.includes("sonstiges") && (
        <div>
          <label style={labelStyle}>Sonstiges – bitte beschreiben *</label>
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
        <button onClick={handleSubmit} disabled={saving || !guest.trim()} style={{
          flex: 1, padding: "10px", fontSize: 12, fontWeight: 700, borderRadius: 6,
          background: !guest.trim() ? "#ccc" : "#c9a84c", color: "#111", border: "none", cursor: "pointer",
          opacity: saving ? 0.6 : 1,
        }}>{saving ? "Speichern..." : "Reservierung anlegen"}</button>
      </div>
    </div>
  );
};

export default BookingForm;
