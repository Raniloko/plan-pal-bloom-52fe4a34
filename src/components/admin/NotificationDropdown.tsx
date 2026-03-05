import { Bell } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(20);
      setNotifications(data || []);
      setUnreadCount(data?.filter((n: any) => !n.read).length || 0);
    };
    load();
    const channel = supabase.channel("notif-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        setNotifications((prev) => [payload.new as any, ...prev]);
        setUnreadCount((c) => c + 1);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const markAllRead = async () => {
    await supabase.from("notifications").update({ read: true } as any).eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-muted/50 transition-all">
          <Bell size={18} className="text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="admin-theme w-80 bg-card border-border p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <span className="text-sm font-semibold">Benachrichtigungen</span>
          {unreadCount > 0 && <button onClick={markAllRead} className="text-[10px] text-primary hover:underline">Alle gelesen</button>}
        </div>
        <div className="max-h-72 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">Keine Benachrichtigungen</p>
          ) : notifications.map((n) => (
            <div key={n.id} className={`p-3 border-b border-border last:border-0 ${!n.read ? "bg-primary/5" : ""}`}>
              <p className="text-xs font-medium">{n.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{n.message}</p>
              <p className="text-[10px] text-muted-foreground/50 mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: de })}</p>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationDropdown;
