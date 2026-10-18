import { useEffect, useState } from "react";
import { X, Bell, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { adm } from "@/components/admin/theme";
import { invokeAdmin } from "@/lib/adminApi";

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
        const res = await invokeAdmin({
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
      await invokeAdmin({
        body: { action: "mark_notification_read", notification_id: id },
      });
    } catch { /* ignore */ }
  };

  if (!open) return null;

  const unread = items.filter(n => !n.read).length;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: adm.overlay, zIndex: 9998 }} />
      <div style={{
        position: "fixed", top: "calc(52px + var(--sat))", right: 0, width: 380, maxWidth: "100%", height: "calc(100dvh - 52px - var(--sat))", paddingBottom: "var(--sab)",
        background: adm.bg, borderLeft: `1px solid ${adm.border}`, zIndex: 9999,
        display: "flex", flexDirection: "column", fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${adm.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Bell size={16} style={{ color: adm.text }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: adm.text }}>Benachrichtigungen</span>
            {unread > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: "#111", background: "#4ade80", borderRadius: 10, padding: "1px 7px" }}>{unread}</span>
            )}
          </div>
          <button onClick={onClose} style={{ color: adm.muted, background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: adm.muted, fontSize: 13 }}>Laden...</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: adm.muted, fontSize: 13 }}>Keine Benachrichtigungen</div>
          ) : (
            items.map(n => (
              <div key={n.id} style={{
                padding: "14px 20px", borderBottom: `1px solid ${adm.border}`,
                background: n.read ? "transparent" : adm.surface,
                display: "flex", gap: 12, alignItems: "flex-start",
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: n.read ? adm.muted : adm.text, marginBottom: 3 }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: adm.muted, lineHeight: 1.4 }}>{n.message}</div>
                  {n.created_at && (
                    <div style={{ fontSize: 11, color: adm.muted, marginTop: 4 }}>
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: de })}
                    </div>
                  )}
                </div>
                {!n.read && (
                  <button onClick={() => markRead(n.id)} style={{
                    width: 28, height: 28, borderRadius: 6, background: adm.surface2, border: `1px solid ${adm.border}`,
                    color: adm.success, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
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
