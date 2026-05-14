import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";

interface WaitlistEntry {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  desired_date: string;
  desired_time: string;
  area: string;
}

interface AvailableUnit {
  id: string;
  name: string;
  area: string;
  capacity: number | null;
}

interface Props {
  entry: WaitlistEntry | null;
  open: boolean;
  onClose: () => void;
  onConverted: () => void;
}

const areaLabel = (area: string) => {
  const map: Record<string, string> = {
    billard: "Billard", restaurant: "Restaurant", vip: "VIP",
    hauptbereich: "Hauptbereich", podest: "Podest", fenster: "Fenster",
  };
  return map[area] || area;
};

export const WaitlistConvertDialog = ({ entry, open, onClose, onConverted }: Props) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [available, setAvailable] = useState<AvailableUnit[]>([]);
  const [unitId, setUnitId] = useState<string>("");
  const [guestCount, setGuestCount] = useState(2);
  const [allowOverbook, setAllowOverbook] = useState(false);

  useEffect(() => {
    if (!open || !entry) return;
    setGuestCount(2);
    setAllowOverbook(false);
    setUnitId("");
    setAvailable([]);
    setLoading(true);
    (async () => {
      try {
        const res = await supabase.functions.invoke("admin-actions", {
          body: {
            action: "get_available_units",
            area: entry.area,
            date: entry.desired_date,
            time: entry.desired_time?.slice(0, 5),
            guest_count: 2,
          },
        });
        if (res.error) throw res.error;
        const units: AvailableUnit[] = res.data?.units || [];
        setAvailable(units);
        if (units.length > 0) setUnitId(units[0].id);
      } catch (e: any) {
        toast.error(e?.message || "Fehler beim Laden freier Tische");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, entry]);

  const handleConvert = async () => {
    if (!entry) return;
    if (!unitId && !allowOverbook) {
      toast.error("Bitte einen Tisch wählen oder Überbuchung aktivieren");
      return;
    }
    setSubmitting(true);
    try {
      const res = await supabase.functions.invoke("admin-actions", {
        body: {
          action: "convert_waitlist",
          waitlist_id: entry.id,
          unit_id: unitId || null,
          guest_count: guestCount,
          allow_overbook: allowOverbook,
        },
      });
      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);
      toast.success(`Reservierung erstellt für ${entry.guest_name}`);
      onConverted();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Fehler bei der Konvertierung");
    }
    setSubmitting(false);
  };

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>In Reservierung umwandeln</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="rounded-md border p-3 bg-muted/40 space-y-1">
            <div><strong>{entry.guest_name}</strong></div>
            <div className="text-muted-foreground text-xs">{entry.guest_phone} · {entry.guest_email}</div>
            <div className="text-xs mt-1">
              {entry.desired_date} · {entry.desired_time?.slice(0, 5)} · {areaLabel(entry.area)}
            </div>
          </div>

          <div>
            <Label htmlFor="gc">Personenanzahl</Label>
            <Input id="gc" type="number" min={1} max={50} value={guestCount}
              onChange={(e) => setGuestCount(Math.max(1, Number(e.target.value) || 1))} />
          </div>

          <div>
            <Label>Tisch ({areaLabel(entry.area)})</Label>
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-xs py-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Lade freie Tische...
              </div>
            ) : available.length === 0 ? (
              <div className="rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900 flex gap-2 items-start">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  Keine freien Tische im Wunschbereich/-zeitraum.
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <Checkbox checked={allowOverbook} onCheckedChange={(v) => setAllowOverbook(!!v)} />
                    <span>Trotzdem buchen (Überbuchung)</span>
                  </label>
                </div>
              </div>
            ) : (
              <Select value={unitId} onValueChange={setUnitId}>
                <SelectTrigger><SelectValue placeholder="Tisch wählen" /></SelectTrigger>
                <SelectContent>
                  {available.map(u => {
                    const fits = (u.capacity || 0) >= guestCount;
                    return (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} · {u.capacity || "?"} Pers. {fits ? "" : "⚠"}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Abbrechen</Button>
          <Button onClick={handleConvert} disabled={submitting || loading}
            style={{ background: "#c9a84c", color: "#111" }}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Bestätigen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};