import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const ZONE_LABELS: Record<string, string> = {
  hauptbereich: "Restaurant (140-Zoll Screen)",
  billard: "Billard",
  vip: "VIP-Raum",
};

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

type ViewState = "loading" | "confirm" | "success" | "error" | "already" | "handled";

const ReservierungStornieren = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const token = searchParams.get("token");

  const [view, setView] = useState<ViewState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [reservation, setReservation] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);

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
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-reservation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ action: "get", id, token }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        if (err?.status === "cancelled") {
          setView("already");
          return;
        }
        // 403 = token wurde vom Rondo Team invalidiert (Reservierung wurde bereits bearbeitet)
        if (res.status === 403) {
          setView("handled");
          return;
        }
        setErrorMsg(err?.error || "Reservierung nicht gefunden.");
        setView("error");
        return;
      }

      const data = await res.json();
      setReservation(data.reservation);
      setView("confirm");
    } catch {
      setErrorMsg("Verbindungsfehler.");
      setView("error");
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-reservation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ action: "cancel", id, token }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        if (err?.status === "cancelled") {
          setView("already");
          return;
        }
        if (res.status === 403) {
          setView("handled");
          return;
        }
        setErrorMsg(err?.error || "Stornierung fehlgeschlagen.");
        setView("error");
        return;
      }

      setView("success");
    } catch {
      setErrorMsg("Verbindungsfehler.");
      setView("error");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f5f5f5",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "-apple-system, 'Helvetica Neue', Arial, sans-serif",
    }}>
      <div style={{
        background: "#fff",
        border: "1px solid #e5e5e5",
        borderRadius: "16px",
        padding: "48px 40px",
        maxWidth: "440px",
        width: "100%",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#1a1a1a", letterSpacing: "1px", marginBottom: 28 }}>
          RONDO SPORTSBAR
        </div>

        {view === "loading" && (
          <p style={{ color: "#888", padding: "40px 0" }}>Lade Reservierung...</p>
        )}

        {view === "error" && (
          <>
            <div style={iconStyle("#fef2f2", "#fecaca", "#dc2626")}>✕</div>
            <h2 style={h2Style}>Fehler</h2>
            <p style={pStyle}>{errorMsg}</p>
          </>
        )}

        {view === "already" && (
          <>
            <div style={iconStyle("#fef2f2", "#fecaca", "#dc2626")}>✕</div>
            <h2 style={h2Style}>Bereits storniert</h2>
            <p style={pStyle}>Diese Reservierung wurde bereits storniert.</p>
          </>
        )}

        {view === "handled" && (
          <>
            <div style={iconStyle("#eff6ff", "#bfdbfe", "#2563eb")}>i</div>
            <h2 style={h2Style}>Bereits vom Team bearbeitet</h2>
            <p style={pStyle}>
              Diese Reservierung wurde bereits vom Rondo Team bearbeitet und kann hier nicht mehr geändert oder storniert werden.
              <br /><br />
              Bitte kontaktiere uns telefonisch, falls du Änderungen vornehmen möchtest.
            </p>
          </>
        )}

        {view === "success" && reservation && (
          <>
            <div style={iconStyle("#f0fdf4", "#bbf7d0", "#22c55e")}>✓</div>
            <h2 style={h2Style}>Reservierung storniert</h2>
            <p style={pStyle}>
              Deine Reservierung am {formatDate(reservation.reservation_date)} um {reservation.reservation_time} Uhr wurde erfolgreich storniert. Eine Bestätigung wurde per E-Mail gesendet.
            </p>
          </>
        )}

        {view === "confirm" && reservation && (
          <>
            <div style={iconStyle("#fef9c3", "#fde68a", "#ca8a04")}>⚠</div>
            <h2 style={h2Style}>Reservierung stornieren?</h2>
            <p style={pStyle}>Möchtest du diese Reservierung wirklich stornieren?</p>

            <div style={{ marginTop: 16, background: "#fafafa", border: "1px solid #eee", borderRadius: 8, padding: "12px 16px", textAlign: "left" }}>
              <p style={{ color: "#1a1a1a", fontSize: 14, fontWeight: 600 }}>
                {formatDate(reservation.reservation_date)} · {reservation.reservation_time} Uhr
              </p>
              <p style={{ color: "#888", fontSize: 13, marginTop: 4 }}>
                {reservation.guest_count} Personen · {ZONE_LABELS[reservation.zone] || reservation.zone}
              </p>
            </div>

            <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
              <button
                onClick={() => window.history.back()}
                style={{
                  flex: 1, padding: "12px", borderRadius: 8, fontSize: 14, fontWeight: 700,
                  cursor: "pointer", border: "1px solid #e5e5e5", background: "#fff", color: "#1a1a1a",
                }}
              >
                Abbrechen
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                style={{
                  flex: 1, padding: "12px", borderRadius: 8, fontSize: 14, fontWeight: 700,
                  cursor: cancelling ? "wait" : "pointer", border: "none",
                  background: "#dc2626", color: "#fff", opacity: cancelling ? 0.6 : 1,
                }}
              >
                {cancelling ? "Wird storniert..." : "Ja, stornieren"}
              </button>
            </div>
          </>
        )}

        <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid #f0f0f0" }}>
          <p style={{ fontSize: 11, color: "#bbb" }}>Rondo Sportsbar{id ? ` · ID: ${id.slice(0, 8).toUpperCase()}` : ""}</p>
        </div>
      </div>
    </div>
  );
};

const iconStyle = (bg: string, border: string, color: string): React.CSSProperties => ({
  width: 56, height: 56, borderRadius: "50%", background: bg,
  border: `2px solid ${border}`, display: "inline-flex", alignItems: "center",
  justifyContent: "center", fontSize: 28, color, marginBottom: 16,
});

const h2Style: React.CSSProperties = { fontSize: 22, color: "#1a1a1a", marginBottom: 12, fontWeight: 700 };
const pStyle: React.CSSProperties = { color: "#666", fontSize: 14, lineHeight: 1.6 };

export default ReservierungStornieren;
