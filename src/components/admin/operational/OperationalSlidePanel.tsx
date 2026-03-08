import { useEffect, useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { X, CalendarDays, LogIn, Lock, Mail, Pencil, Ban, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BookingForm from "./BookingForm";

export interface PanelData {
  tableLabel: string;
  areaName?: string;
  guest?: string;
  startTime?: string;
  endTime?: string;
  pax?: number;
  reservationId?: string;
  status: "free" | "reserved" | "present" | "blocked";
  unitId?: string;
  unitNotes?: string;
}

interface Props {
  open: boolean;
  data: PanelData | null;
  onClose: () => void;
  onBookNew: () => void;
  onRefresh: () => void;
}

const STATUS_PILL: Record<string, React.CSSProperties> = {
  Frei: { background: "#e8f5e8", color: "#2a7a2a", border: "1px solid #b8d8b8" },
  Reserviert: { background: "#fff3e0", color: "#e07820", border: "1px solid #f0c88a" },
  Anwesend: { background: "#e8f5e8", color: "#2a7a2a", border: "1px solid #b8d8b8" },
  Gesperrt: { background: "#fde8e8", color: "#cc2222", border: "1px solid #d8a0a0" },
};

export const OperationalSlidePanel = ({ open, data, onClose, onBookNew, onRefresh }: Props) => {
  const [notes, setNotes] = useState("");
  const [checkedIn, setCheckedIn] = useState(false);
  const [mode, setMode] = useState<"view" | "book">("view");
  const [saving, setSaving] = useState(false);
  const dateLabel = format(new Date(), "EEEE, d. MMMM yyyy", { locale: de });

  useEffect(() => {
    if (open) {
      setNotes(data?.unitNotes || "");
      setCheckedIn(data?.status === "present");
      setMode("view");
    }
  }, [open, data]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const saveNotes = async () => {
    if (!data?.unitId) return;
    await supabase.from("units").update({ notes }).eq("id", data.unitId);
  };

  const handleCheckIn = async () => {
    if (!data?.reservationId) return;
    setSaving(true);
    const newStatus = checkedIn ? "confirmed" : "checked_in";
    const { error } = await supabase.from("reservations").update({ status: newStatus }).eq("id", data.reservationId);
    setSaving(false);
    if (error) { toast.error("Fehler beim Einchecken"); return; }
    setCheckedIn(!checkedIn);
    toast.success(checkedIn ? "Checkout erfolgreich" : "Gast eingecheckt");
    onRefresh();
  };

  const handleBlock = async () => {
    if (!data?.unitId) return;
    setSaving(true);
    const newStatus = data.status === "blocked" ? "free" : "blocked";
    const { error } = await supabase.from("units").update({ status: newStatus }).eq("id", data.unitId);
    setSaving(false);
    if (error) { toast.error("Fehler beim Sperren"); return; }
    toast.success(newStatus === "blocked" ? "Tisch gesperrt" : "Tisch freigegeben");
    onRefresh();
  };

  const handleCancel = async () => {
    if (!data?.reservationId) return;
    if (!window.confirm(`Reservierung von ${data.guest} wirklich stornieren?`)) return;
    setSaving(true);
    const { error } = await supabase.from("reservations").update({ status: "cancelled" }).eq("id", data.reservationId);
    setSaving(false);
    if (error) { toast.error("Fehler beim Stornieren"); return; }
    toast.success("Reservierung storniert");
    onRefresh();
    onClose();
  };

  const handleMail = async () => {
    if (!data?.reservationId) return;
    try {
      const res = await supabase.functions.invoke("send-reservation-email", {
        body: { reservation_id: data.reservationId },
      });
      if (res.error) throw res.error;
      toast.success("E-Mail gesendet");
    } catch {
      toast.error("E-Mail konnte nicht gesendet werden");
    }
  };

  const statusText = () => {
    if (!data) return "Frei";
    if (data.status === "present") return "Anwesend";
    if (data.status === "reserved") return "Reserviert";
    if (data.status === "blocked") return "Gesperrt";
    return "Frei";
  };

  const st = statusText();

  return (
    <>
      {open && <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 199 }} />}
      <div style={{
        position: "fixed", top: 0, right: open ? 0 : -460, height: "100%", width: 420,
        background: "#fff", borderLeft: "1px solid #ddd", zIndex: 200,
        transition: "right 0.3s cubic-bezier(0.25,0.46,0.45,0.94)",
        display: "flex", flexDirection: "column",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8f8f8", borderBottom: "1px solid #eee", padding: "16px 18px" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>{data?.tableLabel || "Tisch"}</div>
            <div style={{ fontSize: 11, color: "#999" }}>{data?.guest || "Kein Gast zugewiesen"}</div>
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
            background: "#eee", border: "1px solid #ddd", borderRadius: 4, color: "#666", cursor: "pointer",
          }}>
            <X size={14} />
          </button>
        </div>

        {/* Date + Status */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", borderBottom: "1px solid #eee" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#333", display: "flex", alignItems: "center", gap: 8 }}>
            <CalendarDays size={13} /> {dateLabel}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", padding: "2px 10px", borderRadius: 20, ...STATUS_PILL[st] }}>
            {st}
          </span>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>
          {mode === "book" ? (
            <BookingForm
              tableLabel={data?.tableLabel}
              onSuccess={() => { setMode("view"); onRefresh(); }}
              onCancel={() => setMode("view")}
            />
          ) : data?.guest ? (
            <div style={{ background: "#f8f8f8", border: "1px solid #eaeaea", borderRadius: 8, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>{data.startTime}{data.endTime ? ` – ${data.endTime}` : ""}</span>
                <span style={{ fontSize: 11, color: "#999" }}>{data.pax} Pers.</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111", marginBottom: 4 }}>{data.guest}</div>
              <div style={{ fontSize: 10, color: "#bbb", marginBottom: 12 }}>
                RND-{data.reservationId?.slice(0, 8).toUpperCase() || "XXXXXXXX"}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setMode("book")} disabled={saving} style={{
                  flex: 1, padding: "6px 0", borderRadius: 5, border: "1px solid #e0e0e0",
                  background: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer",
                  color: "#777", display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                }}><Pencil size={10} /> Bearbeiten</button>
                <button onClick={handleMail} disabled={saving} style={{
                  flex: 1, padding: "6px 0", borderRadius: 5, border: "1px solid #e0e0e0",
                  background: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer",
                  color: "#777", display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                }}><Mail size={10} /> Mail</button>
                <button onClick={handleCancel} disabled={saving} style={{
                  flex: 1, padding: "6px 0", borderRadius: 5, border: "1px solid #e0e0e0",
                  background: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer",
                  color: "#cc2222", display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                }}><Ban size={10} /> Stornieren</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 0", textAlign: "center" }}>
              <CalendarDays size={40} color="#ddd" style={{ marginBottom: 12 }} />
              <span style={{ fontSize: 14, color: "#999" }}>Keine Reservierungen heute</span>
              <span style={{ fontSize: 12, color: "#ccc", marginTop: 4 }}>Dieser Tisch ist frei verfügbar</span>
              <button onClick={() => setMode("book")} style={{
                marginTop: 16, padding: "8px 16px", fontSize: 12, fontWeight: 700, borderRadius: 6,
                background: "#c9a84c", color: "#111", border: "none", cursor: "pointer",
              }}>+ Reservierung anlegen</button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ background: "#f8f8f8", borderTop: "1px solid #eee", padding: "12px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
          <button onClick={() => setMode("book")} style={{
            width: "100%", padding: "10px 0", background: "#222", color: "#fff",
            fontSize: 13, fontWeight: 700, borderRadius: 7, border: "none", cursor: "pointer",
          }}>+ Neue Reservierung</button>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={handleCheckIn} disabled={saving || !data?.reservationId} style={{
              flex: 1, padding: "8px 0", border: `1px solid ${checkedIn ? "#2a7a2a" : "#e0e0e0"}`,
              background: checkedIn ? "#e8f5e8" : "#fff", fontSize: 10, fontWeight: 700,
              color: checkedIn ? "#2a7a2a" : "#777", borderRadius: 6, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              opacity: !data?.reservationId ? 0.4 : 1,
            }}>{checkedIn ? <Check size={11} /> : <LogIn size={11} />} {checkedIn ? "Ausgecheckt" : "Einchecken"}</button>
            <button onClick={handleBlock} disabled={saving || !data?.unitId} style={{
              flex: 1, padding: "8px 0", border: `1px solid ${data?.status === "blocked" ? "#cc2222" : "#e0e0e0"}`,
              background: data?.status === "blocked" ? "#fde8e8" : "#fff",
              fontSize: 10, fontWeight: 700, color: data?.status === "blocked" ? "#cc2222" : "#777",
              borderRadius: 6, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              opacity: !data?.unitId ? 0.4 : 1,
            }}><Lock size={11} /> {data?.status === "blocked" ? "Freigeben" : "Sperren"}</button>
            <button onClick={handleMail} disabled={saving || !data?.reservationId} style={{
              flex: 1, padding: "8px 0", border: "1px solid #e0e0e0", background: "#fff",
              fontSize: 10, fontWeight: 700, color: "#777", borderRadius: 6, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              opacity: !data?.reservationId ? 0.4 : 1,
            }}><Mail size={11} /> Mail</button>
          </div>
          <textarea
            value={notes} onChange={e => setNotes(e.target.value)} onBlur={saveNotes}
            placeholder="Interne Notiz (nicht für Gäste sichtbar)..."
            style={{
              width: "100%", height: 60, background: "#fff", border: "1px solid #e0e0e0",
              borderRadius: 6, padding: "8px 10px", fontSize: 11, resize: "none",
              fontFamily: "'DM Sans', sans-serif", outline: "none",
            }}
          />
        </div>
      </div>
    </>
  );
};
