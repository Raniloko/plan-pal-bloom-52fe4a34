import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarCheck, XCircle, Settings, UserPlus, Activity } from "lucide-react";

const iconMap: Record<string, any> = {
  reservation_created: CalendarCheck,
  reservation_cancelled: XCircle,
  settings_updated: Settings,
  waitlist_added: UserPlus,
};

const labelMap: Record<string, string> = {
  reservation_created: "Reservierung erstellt",
  reservation_cancelled: "Reservierung storniert",
  settings_updated: "Einstellung geändert",
  waitlist_added: "Warteliste aktualisiert",
};

const colorMap: Record<string, string> = {
  reservation_created: "bg-success/15 text-success",
  reservation_cancelled: "bg-destructive/15 text-destructive",
  settings_updated: "bg-primary/15 text-primary",
  waitlist_added: "bg-warning/15 text-warning",
};

const ActivityLogPage = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (supabase as any).from("activity_log").select("*").order("created_at", { ascending: false }).limit(100)
      .then(({ data }: any) => { setLogs(data || []); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-3xl tracking-wider">📋 Aktivitäts-Log</h2>

      <div className="glass-card rounded-xl p-5">
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Laden...</p>
        ) : logs.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 italic">Noch keine Aktivitäten aufgezeichnet.</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const Icon = iconMap[log.action] || Activity;
              const color = colorMap[log.action] || "bg-muted/15 text-muted-foreground";
              return (
                <div key={log.id} className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
                  <div className={`p-2 rounded-lg ${color} flex-shrink-0`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{labelMap[log.action] || log.action}</p>
                    {log.details && <p className="text-xs text-muted-foreground mt-0.5">{log.details}</p>}
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: de })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogPage;
