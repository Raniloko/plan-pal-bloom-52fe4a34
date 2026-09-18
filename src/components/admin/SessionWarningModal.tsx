import { useAuthOptional } from "@/contexts/AuthContext";
import { AlertTriangle, RefreshCw } from "lucide-react";

export const SessionWarningModal = () => {
  const auth = useAuthOptional();

  if (!auth?.sessionWarning) return null;
  const { dismissWarning, signOut } = auth;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 99999 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 420, background: "#141414", border: "1px solid #2a2a2a", borderRadius: 12,
        padding: "32px", zIndex: 100000, fontFamily: "'DM Sans', sans-serif", textAlign: "center",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, background: "#fbbf2420",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
        }}>
          <AlertTriangle size={28} style={{ color: "#fbbf24" }} />
        </div>

        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>
          Sitzung läuft ab
        </h3>
        <p style={{ fontSize: 14, color: "#888", lineHeight: 1.5, margin: "0 0 24px" }}>
          Ihre Sitzung wird in wenigen Minuten wegen Inaktivität beendet. Klicken Sie auf "Aktiv bleiben", um angemeldet zu bleiben.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={() => signOut()} style={{
            padding: "10px 20px", fontSize: 13, color: "#888", background: "transparent",
            border: "1px solid #333", borderRadius: 8, cursor: "pointer",
          }}>
            Abmelden
          </button>
          <button onClick={dismissWarning} style={{
            padding: "10px 24px", fontSize: 13, fontWeight: 600, color: "#111",
            background: "#4ade80", border: "none", borderRadius: 8, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <RefreshCw size={14} /> Aktiv bleiben
          </button>
        </div>
      </div>
    </>
  );
};
