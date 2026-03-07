import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Lock, Unlock, Plus, Mail, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UnitDetailPanelProps {
  unit: { id: string; area: string; name: string; status: string; occupied_until?: string | null; capacity: number; notes?: string } | null;
  open: boolean;
  onClose: () => void;
  onStatusChange?: () => void;
}

const UnitDetailPanel = ({ unit, open, onClose, onStatusChange }: UnitDetailPanelProps) => {
  const { toast } = useToast();
  const [reservations, setReservations] = useState<any[]>([]);
  const [notes, setNotes] = useState("");
  const [countdown, setCountdown] = useState("");
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    if (!unit || !open) return;
    setNotes((unit as any).notes || "");
    supabase.from("reservations").select("*").eq("unit_id", unit.id).eq("reservation_date", today).neq("status", "cancelled").order("reservation_time")
      .then(({ data }) => setReservations(data || []));
  }, [unit, open, today]);

  // Countdown for occupied units
  useEffect(() => {
    if (!unit?.occupied_until) { setCountdown(""); return; }
    const tick = () => {
      const diff = new Date(unit.occupied_until!).getTime() - Date.now();
      if (diff <= 0) { setCountdown("Abgelaufen"); return; }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown(`${mins}:${String(secs).padStart(2, "0")} verbleibend`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [unit?.occupied_until]);

  const handleBlock = async () => {
    if (!unit) return;
    await supabase.from("units").update({ status: unit.status === "blocked" ? "free" : "blocked" } as any).eq("id", unit.id);
    toast({ title: unit.status === "blocked" ? "Freigegeben" : "Gesperrt" });
    onStatusChange?.();
  };

  const saveNotes = async () => {
    if (!unit) return;
    await supabase.from("units").update({ notes } as any).eq("id", unit.id);
    toast({ title: "Notizen gespeichert" });
  };

  const handleCancel = async (resId: string) => {
    await supabase.from("reservations").update({ status: "cancelled" }).eq("id", resId);
    toast({ title: "Reservierung storniert" });
    setReservations(prev => prev.filter(r => r.id !== resId));
    onStatusChange?.();
  };

  if (!unit) return null;
  const statusLabels: Record<string, string> = { free: "Frei", occupied: "Belegt", blocked: "Gesperrt" };
  const statusColors: Record<string, string> = { free: "text-success", occupied: "text-destructive", blocked: "text-muted-foreground" };

  const areaLabels: Record<string, string> = { billard: "Billard", kicker: "Kicker", dart: "Dart", restaurant: "Restaurant" };

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="admin-theme glass-card border-border w-[400px] overflow-y-auto" style={{ cursor: 'auto' }}>
        <SheetHeader>
          <SheetTitle className="font-display text-2xl tracking-wider flex items-center gap-3">
            {areaLabels[unit.area] || unit.area} – {unit.name}
            <span className={`text-sm font-sans ${statusColors[unit.status]}`}>● {statusLabels[unit.status]}</span>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          {/* Today's date */}
          <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, d. MMMM yyyy", { locale: de })}</p>

          {/* Active countdown */}
          {unit.status === "occupied" && countdown && (
            <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              <Clock size={14} className="text-destructive" />
              <span className="text-sm text-destructive font-medium">{countdown}</span>
            </div>
          )}

          {/* Today's reservations */}
          <div>
            <h3 className="font-display text-lg tracking-wider mb-3">Heutige Buchungen</h3>
            {reservations.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Keine Buchungen für heute.</p>
            ) : (
              <div className="space-y-2">
                {reservations.map((r) => (
                  <div key={r.id} className="glass-card rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-sm font-medium">{r.customer_name}</span>
                        <div className="text-xs text-muted-foreground mt-0.5">{r.reservation_time} Uhr · {r.guest_count} Personen</div>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        r.status === "confirmed" ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
                      }`}>{r.status === "confirmed" ? "Bestätigt" : "Ausstehend"}</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleCancel(r.id)} className="text-[10px] px-2 py-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20">Stornieren</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div>
            <h3 className="font-display text-lg tracking-wider mb-3">Zeitplan</h3>
            <div className="grid grid-cols-6 gap-1">
              {Array.from({ length: 12 }, (_, i) => {
                const hour = i + 14;
                const time = `${hour}:00`;
                const isBooked = reservations.some((r) => r.reservation_time === time);
                return (
                  <div key={hour} className={`text-center py-2 rounded text-[10px] transition-colors ${
                    isBooked ? "bg-primary/20 text-primary border border-primary/20" : "bg-muted/30 text-muted-foreground"
                  }`}>{hour}</div>
                );
              })}
            </div>
          </div>

          {/* Internal notes */}
          <div>
            <h3 className="font-display text-lg tracking-wider mb-2">Interne Notizen</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              placeholder="z.B. Stammgast, Geburtstag vorbereiten..."
              className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            <button className="w-full px-4 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2">
              <Plus size={14} /> Neue Reservierung
            </button>
            <button onClick={handleBlock} className="w-full px-4 py-2.5 text-sm border border-border rounded-lg hover:bg-muted/30 flex items-center justify-center gap-2">
              {unit.status === "blocked" ? <><Unlock size={14} /> Freigeben</> : <><Lock size={14} /> Sperren</>}
            </button>
            <button className="w-full px-4 py-2.5 text-sm border border-border rounded-lg hover:bg-muted/30 flex items-center justify-center gap-2 text-muted-foreground">
              <Mail size={14} /> Mail erneut senden
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default UnitDetailPanel;
