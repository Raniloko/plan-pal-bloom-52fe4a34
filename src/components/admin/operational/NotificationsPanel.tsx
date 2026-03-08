import { useEffect, useState } from "react";
import { X, Bell, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string | null;
  read: boolean | null;
  created_at: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export const NotificationsPanel = ({ open, onClose }: Props) => {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        const res = await supabase.functions.invoke("admin-actions", {
          body: { action: "fetch_notifications" },
        });
        setItems(res.data?.notifications || []);
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [open]);

  const markRead = async (id: string) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await supabase.functions.invoke("admin-actions", {
        body: { action: "mark_notification_read", notification_id: id },
      });
    } catch { /* ignore */ }
  };

  if (!open) return null;

  const unread = items.filter(n => !n.read).length;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9998 }} />
      <div style={{
        position: "fixed", top: 52, right: 0, width: 380, height: "calc(100vh - 52px)",
        background: "#141414", borderLeft: "1px solid #2a2a2a", zIndex: 9999,
        display: "flex", flexDirection: "column", fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #2a2a2a" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Bell size={16} style={{ color: "#fff" }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Benachrichtigungen</span>
            {unread > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: "#111", background: "#4ade80", borderRadius: 10, padding: "1px 7px" }}>{unread}</span>
            )}
          </div>
          <button onClick={onClose} style={{ color: "#666", background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#555", fontSize: 13 }}>Laden...</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#555", fontSize: 13 }}>Keine Benachrichtigungen</div>
          ) : (
            items.map(n => (
              <div key={n.id} style={{
                padding: "14px 20px", borderBottom: "1px solid #1e1e1e",
                background: n.read ? "transparent" : "#1a1a1a",
                display: "flex", gap: 12, alignItems: "flex-start",
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: n.read ? "#888" : "#fff", marginBottom: 3 }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: "#666", lineHeight: 1.4 }}>{n.message}</div>
                  {n.created_at && (
                    <div style={{ fontSize: 11, color: "#444", marginTop: 4 }}>
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: de })}
                    </div>
                  )}
                </div>
                {!n.read && (
                  <button onClick={() => markRead(n.id)} style={{
                    width: 28, height: 28, borderRadius: 6, background: "#1e1e1e", border: "1px solid #333",
                    color: "#4ade80", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                    flexShrink: 0,
                  }}>
                    <Check size={14} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
