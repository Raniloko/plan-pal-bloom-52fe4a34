import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock, X, Plus } from "lucide-react";
import { adm } from "@/components/admin/theme";
import { ADMIN_SYNC_WINDOW_EVENT, announceChange } from "@/lib/adminSync";

const AREAS: { value: string; label: string }[] = [
  { value: "", label: "Ganzer Tag (alle Bereiche)" },
  { value: "hauptbereich", label: "Hauptbereich" },
  { value: "fenster", label: "Fenster" },
  { value: "podest", label: "Podest" },
  { value: "vip", label: "VIP-Raum" },
  { value: "salitos", label: "Salitos Lounge" },
  { value: "billard", label: "Billard" },
];
const areaLabel = (a: string | null) => (a ? AREAS.find(x => x.value === a)?.label || a : "Ganzer Tag");

interface Block { id: string; block_date: string; area: string | null; reason: string | null }

interface Props {
  date: string;
  dateLabel: string;
  /** Mobile: hide the bar when there are no blocks; the form is opened from outside. */
  compact?: boolean;
  formOpen?: boolean;
  onFormOpenChange?: (open: boolean) => void;
}

export const DayBlocksBar = ({ date, dateLabel, compact = false, formOpen, onFormOpenChange }: Props) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [localOpen, setLocalOpen] = useState(false);
  const open = formOpen ?? localOpen;
  const setOpen = (v: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof v === "function" ? v(open) : v;
    if (onFormOpenChange) onFormOpenChange(next); else setLocalOpen(next);
  };
  const [area, setArea] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("blocked_days").select("*").eq("block_date", date);
    setBlocks((data as Block[]) || []);
  }, [date]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const onRemote = () => { void load(); };
    window.addEventListener(ADMIN_SYNC_WINDOW_EVENT, onRemote);
    return () => window.removeEventListener(ADMIN_SYNC_WINDOW_EVENT, onRemote);
  }, [load]);

  const add = async () => {
    setSaving(true);
    const { error } = await supabase.from("blocked_days").insert({ block_date: date, area: area || null, reason });
    setSaving(false);
    if (error) { toast.error("Sperre konnte nicht gespeichert werden"); return; }
    toast.success(`${areaLabel(area || null)} am ${dateLabel} gesperrt`);
    setOpen(false); setReason(""); setArea("");
    void announceChange();
    load();
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("blocked_days").delete().eq("id", id);
    if (error) { toast.error("Sperre konnte nicht entfernt werden"); return; }
    toast.success("Sperre aufgehoben");
    void announceChange();
    load();
  };

  const hasBlocks = blocks.length > 0;
  if (compact && !hasBlocks && !open) return null;
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "6px 12px",
      background: hasBlocks ? "rgba(220,60,60,0.15)" : adm.surface,
      borderBottom: `1px solid ${hasBlocks ? "rgba(220,60,60,0.5)" : adm.border}`,
      color: adm.text, fontSize: 12,
    }}>
      {hasBlocks && <Lock size={14} color="#ff6b6b" />}
      {hasBlocks ? blocks.map(b => (
        <span key={b.id} style={{
          display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 8px", borderRadius: 999,
          background: "rgba(220,60,60,0.3)", fontWeight: 700,
        }}>
          Gesperrt: {areaLabel(b.area)}{b.reason ? ` – ${b.reason}` : ""}
          <button onClick={() => remove(b.id)} title="Sperre aufheben" style={{ background: "none", border: "none", color: adm.text, cursor: "pointer", padding: 0, display: "flex" }}>
            <X size={13} />
          </button>
        </span>
      )) : !compact && <span style={{ color: adm.muted }}>Keine Sperren am {dateLabel}</span>}
      {compact ? open && (
        <button onClick={() => setOpen(false)} aria-label="Schließen" style={{ marginLeft: "auto", background: "none", border: "none", color: adm.muted, cursor: "pointer", display: "flex" }}>
          <X size={16} />
        </button>
      ) : <button onClick={() => setOpen(v => !v)} style={{
        marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px",
        borderRadius: 6, border: "1px solid #c9a84c", background: "transparent", color: "#c9a84c",
        cursor: "pointer", fontWeight: 700, fontSize: 12,
      }}>
        <Plus size={13} /> Tag / Bereich sperren
      </button>}
      {open && (
        <div style={{ width: "100%", display: "flex", flexWrap: "wrap", gap: 8, paddingTop: 6 }}>
          <span style={{ alignSelf: "center", color: "#c9a84c", fontWeight: 700 }}>{dateLabel}:</span>
          <select value={area} onChange={e => setArea(e.target.value)} style={{ background: adm.bg, color: adm.text, border: `1px solid ${adm.border}`, borderRadius: 6, padding: "4px 8px" }}>
            {AREAS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
          <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Grund (optional, für Gäste sichtbar)"
            style={{ flex: 1, minWidth: 160, background: adm.bg, color: adm.text, border: `1px solid ${adm.border}`, borderRadius: 6, padding: "4px 8px" }} />
          <button onClick={add} disabled={saving} style={{ padding: "4px 12px", borderRadius: 6, border: "none", background: "#c9a84c", color: "#111", fontWeight: 800, cursor: "pointer" }}>
            Sperren
          </button>
        </div>
      )}
    </div>
  );
};
