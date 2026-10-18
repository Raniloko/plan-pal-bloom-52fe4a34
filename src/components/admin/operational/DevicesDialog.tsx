import { useCallback, useEffect, useState } from "react";
import { X, Smartphone, Monitor, LogOut, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { adm } from "@/components/admin/theme";

interface Props { open: boolean; onClose: () => void; }

interface SessionRow {
  id: string; created_at: string; updated_at: string; refreshed_at: string | null;
  user_agent: string | null; ip: string | null;
}

export const describeDevice = (ua: string | null): { label: string; mobile: boolean } => {
  if (!ua) return { label: "Unbekanntes Gerät", mobile: false };
  const mobile = /Android|iPhone|iPad|Mobile/i.test(ua);
  const os = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android"
    : /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "Gerät";
  const app = /median/i.test(ua) ? "Rondo App" : /SamsungBrowser/.test(ua) ? "Samsung Internet"
    : /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome"
    : /Safari\//.test(ua) ? "Safari" : "Browser";
  return { label: `${app} auf ${os}`, mobile };
};

const fmt = (s: string | null) => s ? new Date(s.endsWith("Z") || s.includes("+") ? s : s + "Z")
  .toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "–";

export const DevicesDialog = ({ open, onClose }: Props) => {
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [current, setCurrent] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-actions", { body: { action: "list_sessions" } });
    if (error || data?.error) toast.error("Geräte konnten nicht geladen werden");
    else { setRows(data.sessions || []); setCurrent(data.current_session_id || ""); }
    setLoading(false);
  }, []);

  useEffect(() => { if (open) load(); }, [open, load]);

  const revoke = async (id: string) => {
    setBusy(id);
    const { data, error } = await supabase.functions.invoke("admin-actions", { body: { action: "revoke_session", session_id: id } });
    if (error || data?.error) toast.error(data?.error || "Abmelden fehlgeschlagen");
    else { toast.success("Gerät abgemeldet"); await load(); }
    setBusy(null);
  };

  const revokeOthers = async () => {
    if (!confirm("Alle anderen Geräte abmelden?")) return;
    setBusy("all");
    const { data, error } = await supabase.functions.invoke("admin-actions", { body: { action: "revoke_other_sessions" } });
    if (error || data?.error) toast.error("Abmelden fehlgeschlagen");
    else { toast.success(`${data.revoked} Gerät(e) abgemeldet`); await load(); }
    setBusy(null);
  };

  if (!open) return null;
  const others = rows.filter(r => r.id !== current).length;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: adm.overlay, zIndex: 9998 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: "min(560px, 94vw)", maxHeight: "85vh", background: adm.bg, border: `1px solid ${adm.border}`,
        borderRadius: 12, zIndex: 9999, display: "flex", flexDirection: "column", fontFamily: "'DM Sans', sans-serif", overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${adm.border}` }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: adm.text }}>Geräte & Sitzungen</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={load} title="Aktualisieren" style={{ color: adm.muted, background: "none", border: "none", cursor: "pointer" }}><RefreshCw size={16} /></button>
            <button onClick={onClose} style={{ color: adm.muted, background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {loading && rows.length === 0 && <div style={{ color: adm.muted, fontSize: 13 }}>Lädt…</div>}
          {!loading && rows.length === 0 && <div style={{ color: adm.muted, fontSize: 13 }}>Keine aktiven Anmeldungen.</div>}
          {rows.map(r => {
            const d = describeDevice(r.user_agent);
            const isCurrent = r.id === current;
            return (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: adm.surface, border: `1px solid ${isCurrent ? adm.gold : adm.border}`, borderRadius: 10 }}>
                <div style={{ color: "#c9a84c" }}>{d.mobile ? <Smartphone size={22} /> : <Monitor size={22} />}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: adm.text, fontSize: 14, fontWeight: 600 }}>
                    {d.label}
                    {isCurrent && <span style={{ fontSize: 10, fontWeight: 700, color: "#111", background: "#4ade80", borderRadius: 999, padding: "2px 8px" }}>Dieses Gerät</span>}
                  </div>
                  <div style={{ color: adm.muted, fontSize: 12, marginTop: 2 }}>
                    Zuletzt aktiv: {fmt(r.refreshed_at || r.updated_at)} · Angemeldet seit: {fmt(r.created_at)}
                  </div>
                  {r.ip && <div style={{ color: adm.muted, fontSize: 11 }}>IP: {r.ip}</div>}
                </div>
                {!isCurrent && (
                  <button onClick={() => revoke(r.id)} disabled={busy !== null} style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", fontSize: 12, fontWeight: 600,
                    color: adm.danger, background: "transparent", border: "1px solid #7f1d1d", borderRadius: 6, cursor: "pointer",
                  }}>
                    <LogOut size={13} /> {busy === r.id ? "…" : "Abmelden"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {others > 0 && (
          <div style={{ padding: 16, borderTop: `1px solid ${adm.border}` }}>
            <button onClick={revokeOthers} disabled={busy !== null} style={{
              width: "100%", padding: "10px 0", fontSize: 13, fontWeight: 700, color: "#111", background: "#c9a84c",
              border: "none", borderRadius: 8, cursor: "pointer",
            }}>{busy === "all" ? "…" : `Alle anderen Geräte abmelden (${others})`}</button>
          </div>
        )}
      </div>
    </>
  );
};
