import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Lock, Loader2 } from "lucide-react";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      navigate("/admin", { replace: true });
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0a0a0a", fontFamily: "'DM Sans', sans-serif",
    }}>
      <form onSubmit={handleSubmit} style={{
        width: "100%", maxWidth: 400, background: "#111", border: "1px solid #2a2a2a",
        borderRadius: 12, padding: "40px 32px", display: "flex", flexDirection: "column", gap: 20,
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <img src="/images/rondo-logo.png" alt="Rondo" style={{ height: 48, margin: "0 auto 12px", display: "block", filter: "brightness(0) invert(1)", opacity: 0.9 }} />
          <div style={{ fontSize: 12, color: "#666", letterSpacing: 2, textTransform: "uppercase" }}>Admin Login</div>
        </div>

        <div style={{ height: 1, background: "#2a2a2a" }} />

        {/* Email */}
        <div>
          <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>E-Mail</label>
          <input
            type="email"
            autoComplete="username"
            placeholder="admin@rondo-sportsbar.de"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{
              width: "100%", padding: "10px 14px", fontSize: 14, color: "#fff",
              background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8,
              outline: "none", boxSizing: "border-box",
            }}
            onFocus={e => e.currentTarget.style.borderColor = "#c8b830"}
            onBlur={e => e.currentTarget.style.borderColor = "#2a2a2a"}
          />
        </div>

        {/* Password */}
        <div>
          <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>Passwort</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: "100%", padding: "10px 42px 10px 14px", fontSize: 14, color: "#fff",
                background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8,
                outline: "none", boxSizing: "border-box",
              }}
              onFocus={e => e.currentTarget.style.borderColor = "#c8b830"}
              onBlur={e => e.currentTarget.style.borderColor = "#2a2a2a"}
            />
            <button type="button" onClick={() => setShowPw(!showPw)} style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", color: "#555", cursor: "pointer",
            }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ fontSize: 13, color: "#f87171", background: "#f8717115", padding: "8px 12px", borderRadius: 8, textAlign: "center" }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button type="submit" disabled={loading} style={{
          width: "100%", padding: "12px", fontSize: 14, fontWeight: 700,
          color: "#111", background: "#c8b830", border: "none", borderRadius: 8,
          cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : null}
          Anmelden
        </button>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8 }}>
          <Lock size={12} style={{ color: "#555" }} />
          <span style={{ fontSize: 11, color: "#555" }}>Geschützte Verbindung</span>
        </div>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
};

export default AdminLogin;
