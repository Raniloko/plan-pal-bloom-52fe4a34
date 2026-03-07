import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/SettingsContext";

interface Props { open: boolean; onClose: () => void; prefill?: { date?: string; time?: string; zone?: string; unit_id?: string } }

const NewReservationModal = ({ open, onClose, prefill }: Props) => {
  const { toast } = useToast();
  const { settings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState<any[]>([]);
  const [form, setForm] = useState({
    customer_name: "", customer_email: "", customer_phone: "",
    reservation_date: "", reservation_time: "", zone: "", unit_id: "",
    guest_count: 2, occasion: "sonstiges", message: "",
  });

  useEffect(() => {
    if (prefill && open) {
      setForm(prev => ({
        ...prev,
        reservation_date: prefill.date || prev.reservation_date,
        reservation_time: prefill.time || prev.reservation_time,
        zone: prefill.zone || prev.zone,
        unit_id: prefill.unit_id || prev.unit_id,
      }));
    }
  }, [prefill, open]);

  useEffect(() => {
    if (form.zone) {
      supabase.from("units").select("*").eq("area", form.zone).eq("status", "free").order("position_index")
        .then(({ data }) => setUnits(data || []));
    } else { setUnits([]); }
  }, [form.zone]);

  // Filter areas based on settings
  const enabledAreas = [
    { value: "billard", label: "Billard" }, { value: "kicker", label: "Tischkicker" },
    { value: "dart", label: "Dart" }, { value: "restaurant", label: "Restaurant" }, { value: "vip", label: "VIP" },
  ].filter(a => settings.areas_enabled[a.value] !== false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from("reservations").insert({
        customer_name: form.customer_name, customer_email: form.customer_email,
        customer_phone: form.customer_phone, reservation_date: form.reservation_date,
        reservation_time: form.reservation_time, zone: form.zone,
        unit_id: form.unit_id || null, guest_count: form.guest_count,
        occasion: form.occasion, message: form.message, status: "confirmed", honeypot: "",
      } as any);
      if (error) throw error;

      // Log activity
      await (supabase as any).from("activity_log").insert({
        action: "reservation_created",
        details: `${form.customer_name} – ${form.zone} – ${form.reservation_date} ${form.reservation_time}`,
        entity_type: "reservation",
      });

      toast({ title: "✅ Reservierung erstellt" });
      onClose();
      setForm({ customer_name: "", customer_email: "", customer_phone: "", reservation_date: "", reservation_time: "", zone: "", unit_id: "", guest_count: 2, occasion: "sonstiges", message: "" });
    } catch (err: any) {
      toast({ title: "Fehler", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const ic = "w-full bg-muted/30 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="admin-theme glass-card border-border max-w-lg max-h-[90vh] overflow-y-auto" style={{ cursor: 'auto' }}>
        <DialogHeader><DialogTitle className="font-display text-2xl tracking-wider">Neue Reservierung</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground mb-1 block">Name *</label>
              <input required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className={ic} /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Telefon *</label>
              <input required value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} className={ic} /></div>
          </div>
          <div><label className="text-xs text-muted-foreground mb-1 block">E-Mail *</label>
            <input required type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} className={ic} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground mb-1 block">Datum *</label>
              <input required type="date" value={form.reservation_date} onChange={(e) => setForm({ ...form, reservation_date: e.target.value })} className={ic} /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Uhrzeit *</label>
              <input required type="time" value={form.reservation_time} onChange={(e) => setForm({ ...form, reservation_time: e.target.value })} className={ic} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground mb-1 block">Bereich *</label>
              <select required value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value, unit_id: "" })} className={ic}>
                <option value="">Auswählen...</option>
                {enabledAreas.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Einheit</label>
              <select value={form.unit_id} onChange={(e) => setForm({ ...form, unit_id: e.target.value })} className={ic}>
                <option value="">Keine spez.</option>
                {units.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground mb-1 block">Personen</label>
              <input type="number" min={1} max={50} value={form.guest_count} onChange={(e) => setForm({ ...form, guest_count: parseInt(e.target.value) || 2 })} className={ic} /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Anlass</label>
              <select value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })} className={ic}>
                <option value="sonstiges">Sonstiges</option><option value="sport">Sport</option>
                <option value="feier">Feier</option><option value="essen">Essen</option><option value="billard">Billard</option>
                <option value="kicker">Kicker</option><option value="dart">Dart</option><option value="vip">VIP</option>
              </select></div>
          </div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Notizen</label>
            <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={`${ic} h-20 resize-none`} /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm border border-border rounded-lg hover:bg-muted/30">Abbrechen</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/20">
              {loading ? "Speichern..." : "Reservierung erstellen"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewReservationModal;
