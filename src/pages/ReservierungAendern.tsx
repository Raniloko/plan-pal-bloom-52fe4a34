import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const ZONE_LABELS: Record<string, string> = {
  hauptbereich: "Restaurant (140-Zoll Screen)",
  fenster: "Restaurant (75-Zoll Screen)",
  billard: "Billard",
  vip: "VIP-Raum",
  podest: "Podest",
};

const VALID_ZONES = ["hauptbereich", "billard", "vip", "podest", "fenster"];
const VALID_OCCASIONS = ["sport", "feier", "essen", "billard", "sonstiges"];
const OCCASION_LABELS: Record<string, string> = {
  sport: "Live-Sport schauen",
  feier: "Private Feier",
  essen: "Essen & Trinken",
  billard: "Billard spielen",
  sonstiges: "Sonstiges",
};

const VALID_TIMES = [
  "14:00","14:15","14:30","14:45","15:00","15:15","15:30","15:45",
  "16:00","16:15","16:30","16:45","17:00","17:15","17:30","17:45",
  "18:00","18:15","18:30","18:45","19:00","19:15","19:30","19:45",
  "20:00","20:15","20:30","20:45","21:00","21:15","21:30","21:45",
  "22:00","22:15","22:30","22:45","23:00",
];

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

type ViewState = "loading" | "form" | "success" | "error" | "handled";

const ReservierungAendern = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get("id");
  const token = searchParams.get("token");

  const [view, setView] = useState<ViewState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [reservation, setReservation] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState(2);
  const [zone, setZone] = useState("");
  const [occasion, setOccasion] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!id || !token) {
      setErrorMsg("Ungültiger Link.");
      setView("error");
      return;
    }
    loadReservation();
  }, [id, token]);

  const loadReservation = async () => {
    try {
      const jsonRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/modify-reservation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ action: "get", id, token }),
        }
      );

      if (!jsonRes.ok) {
        const err = await jsonRes.json().catch(() => null);
        // 403 = token vom Rondo Team invalidiert; 410 = bereits storniert
        if (jsonRes.status === 403 || jsonRes.status === 410 || err?.status === "cancelled") {
          setView("handled");
          return;
        }
        setErrorMsg(err?.error || "Reservierung nicht gefunden.");
        setView("error");
        return;
      }

      const data = await jsonRes.json();
      setReservation(data.reservation);
      setDate(data.reservation.reservation_date);
      setTime(data.reservation.reservation_time);
      setGuests(data.reservation.guest_count);
      setZone(data.reservation.zone);
      setOccasion(data.reservation.occasion);
      setMessage(data.reservation.message || "");
      setView("form");
    } catch {
      setErrorMsg("Verbindungsfehler. Bitte versuche es erneut.");
      setView("error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/modify-reservation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            action: "update",
            id,
            token,
            date,
            time,
            guests,
            zone,
            occasion,
            message,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        if (res.status === 403 || res.status === 410 || err?.status === "cancelled") {
          setView("handled");
          return;
        }
        setErrorMsg(err?.error || "Änderung fehlgeschlagen.");
        setView("error");
        return;
      }

      setView("success");
    } catch {
      setErrorMsg("Verbindungsfehler.");
      setView("error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f5f5f5",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
      fontFamily: "-apple-system, 'Helvetica Neue', Arial, sans-serif",
      boxSizing: "border-box" as const,
    }}>
      <div style={{
        background: "#fff",
        border: "1px solid #e5e5e5",
        borderRadius: "16px",
        padding: "24px 20px",
        maxWidth: "420px",
        width: "100%",
        boxSizing: "border-box" as const,
      }}>
        <div style={{ textAlign: "center", fontSize: 13, fontWeight: 800, color: "#1a1a1a", letterSpacing: "1px", marginBottom: 20 }}>
          RONDO SPORTSBAR
        </div>

        {view === "loading" && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <p style={{ color: "#888", fontSize: 14 }}>Lade Reservierung...</p>
          </div>
        )}

        {view === "error" && (
          <div style={{ textAlign: "center" }}>
            <div style={iconCircle("#fef2f2", "#fecaca", "#dc2626")}>✕</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Fehler</h2>
            <p style={{ color: "#666", fontSize: 13, lineHeight: 1.5 }}>{errorMsg}</p>
            <button onClick={handleCancel} style={secondaryBtnStyle}>Zurück zur Startseite</button>
          </div>
        )}

        {view === "handled" && (
          <div style={{ textAlign: "center" }}>
            <div style={iconCircle("#eff6ff", "#bfdbfe", "#2563eb")}>i</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Bereits vom Team bearbeitet</h2>
            <p style={{ color: "#666", fontSize: 13, lineHeight: 1.5 }}>
              Diese Reservierung wurde bereits vom Rondo Team bearbeitet und kann hier nicht mehr geändert oder storniert werden.
              <br /><br />
              Bitte kontaktiere uns telefonisch, falls du noch Änderungen vornehmen möchtest.
            </p>
            <button onClick={handleCancel} style={secondaryBtnStyle}>Zurück zur Startseite</button>
          </div>
        )}

        {view === "success" && (
          <div style={{ textAlign: "center" }}>
            <div style={iconCircle("#f0fdf4", "#bbf7d0", "#22c55e")}>✓</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Reservierung geändert</h2>
            <p style={{ color: "#666", fontSize: 13, lineHeight: 1.5 }}>Deine Reservierung wurde aktualisiert. Eine Bestätigung wurde per E-Mail gesendet.</p>
            <div style={{ marginTop: 12, background: "#fafafa", border: "1px solid #eee", borderRadius: 8, padding: "10px 14px" }}>
              <p style={{ color: "#1a1a1a", fontSize: 13, fontWeight: 600 }}>
                {formatDate(date)} · {time} Uhr · {guests} Pers.
              </p>
              <p style={{ color: "#888", fontSize: 12, marginTop: 2 }}>{ZONE_LABELS[zone] || zone}</p>
            </div>
            <button onClick={handleCancel} style={{ ...secondaryBtnStyle, marginTop: 16 }}>Zurück zur Startseite</button>
          </div>
        )}

        {view === "form" && reservation && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 700, textAlign: "center", marginBottom: 14 }}>Reservierung ändern</h2>
            <div style={{ background: "#fafafa", border: "1px solid #eee", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
              <span style={{ color: "#888", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>Aktuelle Reservierung</span>
              <p style={{ color: "#1a1a1a", fontSize: 13, fontWeight: 600, marginTop: 2 }}>
                {formatDate(reservation.reservation_date)} · {reservation.reservation_time} Uhr · {reservation.guest_count} Pers.
              </p>
              <p style={{ color: "#888", fontSize: 12, marginTop: 1 }}>{ZONE_LABELS[reservation.zone] || reservation.zone}</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Datum</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Uhrzeit</label>
                  <select value={time} onChange={(e) => setTime(e.target.value)} required style={inputStyle}>
                    {VALID_TIMES.map(t => <option key={t} value={t}>{t} Uhr</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Personen</label>
                  <input type="number" value={guests} onChange={(e) => setGuests(Number(e.target.value))} min={1} max={50} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Bereich</label>
                  <select value={zone} onChange={(e) => setZone(e.target.value)} required style={inputStyle}>
                    {VALID_ZONES.map(z => <option key={z} value={z}>{ZONE_LABELS[z]}</option>)}
                  </select>
                </div>
              </div>

              <label style={labelStyle}>Anlass</label>
              <select value={occasion} onChange={(e) => setOccasion(e.target.value)} required style={inputStyle}>
                {VALID_OCCASIONS.map(o => <option key={o} value={o}>{OCCASION_LABELS[o]}</option>)}
              </select>

              <label style={labelStyle}>Nachricht (optional)</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} style={{ ...inputStyle, minHeight: 48, resize: "vertical" as const }} />

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button type="button" onClick={handleCancel} style={cancelBtnStyle}>
                  Abbrechen
                </button>
                <button type="submit" disabled={saving} style={{
                  flex: 2, padding: "11px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                  cursor: saving ? "wait" : "pointer", border: "none",
                  background: "#1a1a1a", color: "#fff", opacity: saving ? 0.6 : 1,
                }}>
                  {saving ? "Wird gespeichert..." : "Änderungen speichern"}
                </button>
              </div>
            </form>
          </>
        )}

        <div style={{ textAlign: "center", marginTop: 16, paddingTop: 12, borderTop: "1px solid #f0f0f0" }}>
          <p style={{ color: "#bbb", fontSize: 10 }}>Rondo Sportsbar{id ? ` · ${id.slice(0, 8).toUpperCase()}` : ""}</p>
        </div>
      </div>
    </div>
  );
};

const iconCircle = (bg: string, border: string, color: string): React.CSSProperties => ({
  width: 48, height: 48, borderRadius: "50%", background: bg,
  border: `2px solid ${border}`, display: "inline-flex", alignItems: "center",
  justifyContent: "center", fontSize: 24, color, marginBottom: 12,
});

const labelStyle: React.CSSProperties = {
  display: "block", color: "#888", fontSize: 11, fontWeight: 600,
  marginBottom: 3, marginTop: 10, textTransform: "uppercase", letterSpacing: "0.5px",
};

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#fafafa", border: "1px solid #e5e5e5",
  color: "#1a1a1a", borderRadius: 8, padding: "9px 12px", fontSize: 13,
  outline: "none", fontFamily: "inherit", boxSizing: "border-box" as const,
};

const cancelBtnStyle: React.CSSProperties = {
  flex: 1, padding: "11px", borderRadius: 8, fontSize: 13, fontWeight: 700,
  cursor: "pointer", border: "1px solid #e5e5e5", background: "#fff", color: "#1a1a1a",
};

const secondaryBtnStyle: React.CSSProperties = {
  marginTop: 12, padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
  cursor: "pointer", border: "1px solid #e5e5e5", background: "#fff", color: "#1a1a1a",
};

export default ReservierungAendern;
