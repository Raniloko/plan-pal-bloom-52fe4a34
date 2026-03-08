import { useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check } from "lucide-react";

interface Props {
  tableLabel?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const TIMES = [
  "14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30",
  "18:00","18:30","19:00","19:30","20:00","20:30","21:00","21:30",
  "22:00","22:30","23:00",
];

const BookingForm = ({ tableLabel, onSuccess, onCancel }: Props) => {
  const [guest, setGuest] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pax, setPax] = useState(2);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("19:00");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!guest.trim() || !email.trim() || !phone.trim()) {
      toast.error("Bitte Name, E-Mail und Telefon ausfüllen");
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
          zone: "hauptbereich",
          anlass: "essen",
          message: note.trim() || "",
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
      setTimeout(() => onSuccess(), 1500);
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
    background: "#fff",
  };
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: "#555", marginBottom: 4, display: "block" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 4 }}>
        Neue Reservierung {tableLabel ? `· ${tableLabel}` : ""}
      </div>

      <div>
        <label style={labelStyle}>Gastname *</label>
        <input value={guest} onChange={e => setGuest(e.target.value)} placeholder="Name des Gastes" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>E-Mail *</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@beispiel.de" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Telefon *</label>
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+49 ..." style={inputStyle} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
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
      </div>
      <div>
        <label style={labelStyle}>Uhrzeit</label>
        <select value={startTime} onChange={e => setStartTime(e.target.value)} style={inputStyle}>
          {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Interne Notiz</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Optional..." style={{ ...inputStyle, height: 56, resize: "none" }} />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
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
