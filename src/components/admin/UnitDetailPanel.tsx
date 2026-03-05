import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { format } from "date-fns";

interface UnitDetailPanelProps {
  unit: { id: string; area: string; name: string; status: string; occupied_until?: string | null; capacity: number } | null;
  open: boolean;
  onClose: () => void;
  onStatusChange?: () => void;
}

const UnitDetailPanel = ({ unit, open, onClose, onStatusChange }: UnitDetailPanelProps) => {
  const [reservations, setReservations] = useState<any[]>([]);
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    if (!unit || !open) return;
    supabase.from("reservations").select("*").eq("unit_id", unit.id).eq("reservation_date", today).neq("status", "cancelled").order("reservation_time")
      .then(({ data }) => setReservations(data || []));
  }, [unit, open, today]);

  const handleBlock = async () => {
    if (!unit) return;
    await supabase.from("units").update({ status: unit.status === "blocked" ? "free" : "blocked" } as any).eq("id", unit.id);
    onStatusChange?.();
  };

  if (!unit) return null;
  const statusLabels: Record<string, string> = { free: "Frei", occupied: "Belegt", blocked: "Gesperrt" };
  const statusColors: Record<string, string> = { free: "text-success", occupied: "text-primary", blocked: "text-muted-foreground" };

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="admin-theme bg-card border-border w-[400px]">
        <SheetHeader><SheetTitle className="font-display text-2xl tracking-wider">{unit.name}</SheetTitle></SheetHeader>
        <div className="mt-6 space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Status:</span>
            <span className={`text-sm font-semibold ${statusColors[unit.status]}`}>{statusLabels[unit.status]}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={handleBlock} className="flex-1 px-3 py-2 text-xs border border-border rounded-lg hover:bg-muted/50 transition-all">
              {unit.status === "blocked" ? "Freigeben" : "Sperren"}
            </button>
          </div>
          <div>
            <h3 className="font-display text-lg tracking-wider mb-3">Heutige Buchungen</h3>
            {reservations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keine Buchungen für heute.</p>
            ) : (
              <div className="space-y-2">
                {reservations.map((r) => (
                  <div key={r.id} className="bg-muted/30 border border-border rounded-lg p-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{r.customer_name}</span>
                      <span className="text-xs text-muted-foreground">{r.reservation_time} Uhr</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{r.guest_count} Personen · ID: {r.id.slice(0, 8)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-display text-lg tracking-wider mb-3">Zeitplan</h3>
            <div className="grid grid-cols-6 gap-1">
              {Array.from({ length: 12 }, (_, i) => {
                const hour = i + 14;
                const time = `${hour}:00`;
                const isBooked = reservations.some((r) => r.reservation_time === time);
                return (
                  <div key={hour} className={`text-center py-2 rounded text-[10px] ${isBooked ? "bg-primary/20 text-primary" : "bg-muted/30 text-muted-foreground"}`}>
                    {hour}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default UnitDetailPanel;
