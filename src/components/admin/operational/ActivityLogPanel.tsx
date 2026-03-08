import { useEffect, useState } from "react";
import { X, Activity, Clock, User, MapPin, Settings, Ban, LogIn, LogOut, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface LogEntry {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: string | null;
  created_at: string | null;
}

const ACTION_META: Record<string, { label: string; color: string; icon: typeof Activity }> = {
  check_in: { label: "Check-in", color: "#2a7a2a", icon: LogIn },
  check_out: { label: "Check-out", color: "#3a7bd5", icon: LogOut },
  cancel: { label: "Stornierung", color: "#cc2222", icon: Ban },
  auto_cancel: { label: "Auto-Stornierung", color: "#cc2222", icon: Ban },
  assign_unit: { label: "Tischzuweisung", color: "#c9a84c", icon: MapPin },
  block_unit: { label: "Tisch gesperrt", color: "#cc2222", icon: Ban },
  unblock_unit: { label: "Tisch freigegeben", color: "#2a7a2a", icon: MapPin },
  update_reservation: { label: "Änderung", color: "#e07820", icon: FileText },
  save_settings: { label: "Einstellungen", color: "#666", icon: Settings },
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export const ActivityLogPanel = ({ open, onClose }: Props) => {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase.functions.invoke("admin-actions", {
      body: { action: "fetch_activity_log" },
    }).then(({ data }) => {
      setEntries((data?.entries as LogEntry[]) || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [open]);

  return (
    <>
      {open && <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 299 }} />}
      <div style={{
        position: "fixed", top: 0, right: open ? 0 : -480, height: "100%", width: 440,
        background: "#fff", borderLeft: "1px solid #ddd", zIndex: 300,
        transition: "right 0.3s cubic-bezier(0.25,0.46,0.45,0.94)",
        display: "flex", flexDirection: "column", fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#f8f8f8", borderBottom: "1px solid #eee", padding: "16px 18px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Activity size={16} color="#c9a84c" />
            <span style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>Aktivitäts-Log</span>
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
            background: "#eee", border: "1px solid #ddd", borderRadius: 4, color: "#666", cursor: "pointer",
          }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 18px" }}>
          {loading ? (
            <div style={{ textAlign: "center", color: "#999", fontSize: 13, padding: 40 }}>Laden...</div>
          ) : entries.length === 0 ? (
            <div style={{ textAlign: "center", color: "#999", fontSize: 13, padding: 40 }}>Keine Einträge vorhanden</div>
          ) : (
            entries.map((e, i) => {
              const meta = ACTION_META[e.action] || { label: e.action, color: "#666", icon: Activity };
              const Icon = meta.icon;
              const time = e.created_at ? format(new Date(e.created_at), "dd. MMM, HH:mm", { locale: de }) : "";
              const isNewDay = i === 0 || (e.created_at && entries[i - 1]?.created_at &&
                format(new Date(e.created_at), "yyyy-MM-dd") !== format(new Date(entries[i - 1].created_at!), "yyyy-MM-dd"));

              return (
                <div key={e.id}>
                  {isNewDay && e.created_at && (
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: "#999", textTransform: "uppercase",
                      padding: "12px 0 6px", borderBottom: "1px solid #f0f0f0", marginBottom: 6,
                    }}>
                      {format(new Date(e.created_at), "EEEE, d. MMMM yyyy", { locale: de })}
                    </div>
                  )}
                  <div style={{
                    display: "flex", gap: 10, padding: "10px 0",
                    borderBottom: "1px solid #f5f5f5",
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                      background: `${meta.color}15`, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={13} color={meta.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: meta.color,
                          padding: "1px 6px", borderRadius: 3, background: `${meta.color}12`,
                        }}>{meta.label}</span>
                        <span style={{ fontSize: 10, color: "#bbb", marginLeft: "auto" }}>{time}</span>
                      </div>
                      {e.details && (
                        <div style={{ fontSize: 12, color: "#555", lineHeight: 1.4 }}>{e.details}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};
