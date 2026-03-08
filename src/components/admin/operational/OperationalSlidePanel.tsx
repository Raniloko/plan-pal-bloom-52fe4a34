import { useEffect, useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { X, CalendarDays, LogIn, Lock, Mail, Ban, Check, UserPlus, MapPin, LogOut } from "lucide-react";
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
  customerEmail?: string;
  customerPhone?: string;
  zone?: string;
}

interface UnitOption {
  id: string;
  name: string;
  area: string;
  status: string | null;
}

interface ReservationRef {
  id: string;
  unit_id: string | null;
  status: string;
}

interface Props {
  open: boolean;
  data: PanelData | null;
  onClose: () => void;
  onBookNew: () => void;
  onRefresh: () => void;
  reservations?: ReservationRef[];
}

const STATUS_PILL: Record<string, React.CSSProperties> = {
  Frei: { background: "#e8f5e8", color: "#2a7a2a", border: "1px solid #b8d8b8" },
  Reserviert: { background: "#fff3e0", color: "#e07820", border: "1px solid #f0c88a" },
  Anwesend: { background: "#e8f5e8", color: "#2a7a2a", border: "1px solid #b8d8b8" },
  Gesperrt: { background: "#fde8e8", color: "#cc2222", border: "1px solid #d8a0a0" },
};

const adminAction = async (body: Record<string, unknown>) => {
  const res = await supabase.functions.invoke("admin-actions", { body });
  if (res.error) throw res.error;
  if (res.data?.error) throw new Error(res.data.error);
  return res.data;
};

export const OperationalSlidePanel = ({ open, data, onClose, onBookNew, onRefresh, reservations = [] }: Props) => {
  const [notes, setNotes] = useState("");
  const [checkedIn, setCheckedIn] = useState(false);
  const [mode, setMode] = useState<"view" | "book">("view");
  const [saving, setSaving] = useState(false);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [assignedUnitId, setAssignedUnitId] = useState<string>("");
  const dateLabel = format(new Date(), "EEEE, d. MMMM yyyy", { locale: de });

  useEffect(() => {
    if (open) {
      setNotes(data?.unitNotes || "");
      setCheckedIn(data?.status === "present");
      setMode("view");
      setAssignedUnitId(data?.unitId || "");
    }
  }, [open, data]);

  // Load available units for assignment dropdown
  useEffect(() => {
    if (!open) return;
    supabase.from("units").select("id, name, area, status").order("position_index").then(({ data: u }) => {
      // Filter out kicker and dart units
      const filtered = ((u as UnitOption[]) || []).filter(unit => {
        const lower = unit.name.toLowerCase();
        return !lower.startsWith("kicker") && !lower.startsWith("dart");
      });
      setUnits(filtered);
    });
  }, [open]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const saveNotes = async () => {
    if (!data?.unitId) return;
    try {
      await adminAction({ action: "update_notes", unit_id: data.unitId, notes });
    } catch { /* silent */ }
  };

  const handleCheckIn = async () => {
    if (!data?.reservationId) return;
    setSaving(true);
    try {
      await adminAction({ action: "check_in", reservation_id: data.reservationId, checked_in: checkedIn });
      setCheckedIn(!checkedIn);
      toast.success(checkedIn ? "Checkout erfolgreich" : "Gast eingecheckt");
      onRefresh();
    } catch (e: any) {
      toast.error(e?.message || "Fehler beim Einchecken");
    }
    setSaving(false);
  };

  const handleBlock = async () => {
    if (!data?.unitId) return;
    setSaving(true);
    try {
      const res = await adminAction({ action: "block_unit", unit_id: data.unitId, blocked: data.status === "blocked" });
      toast.success(res.status === "blocked" ? "Tisch gesperrt" : "Tisch freigegeben");
      onRefresh();
    } catch (e: any) {
      toast.error(e?.message || "Fehler beim Sperren");
    }
    setSaving(false);
  };

  const handleCancel = async () => {
    if (!data?.reservationId) return;
    if (!window.confirm(`Reservierung von ${data.guest} wirklich stornieren?`)) return;
    setSaving(true);
    try {
      await adminAction({ action: "cancel", reservation_id: data.reservationId });
      toast.success("Reservierung storniert");
      onRefresh();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Fehler beim Stornieren");
    }
    setSaving(false);
  };

  const handleMail = async () => {
    if (!data?.reservationId) return;
    setSaving(true);
    try {
      await adminAction({ action: "resend_email", reservation_id: data.reservationId });
      toast.success("E-Mail gesendet");
    } catch {
      toast.error("E-Mail konnte nicht gesendet werden");
    }
    setSaving(false);
  };

  const handleAssignUnit = async (unitId: string) => {
    if (!data?.reservationId) return;
    setAssignedUnitId(unitId);
    setSaving(true);
    try {
      await adminAction({ action: "assign_unit", reservation_id: data.reservationId, unit_id: unitId || null });
      toast.success(unitId ? "Tisch zugewiesen" : "Tischzuweisung entfernt");
      onRefresh();
    } catch (e: any) {
      toast.error(e?.message || "Fehler bei Tischzuweisung");
    }
    setSaving(false);
  };

  const statusText = () => {
    if (!data) return "Frei";
    if (data.status === "present") return "Anwesend";
    if (data.status === "reserved") return "Reserviert";
    if (data.status === "blocked") return "Gesperrt";
    return "Frei";
  };

  const st = statusText();
  const btnBase: React.CSSProperties = {
    flex: 1, padding: "7px 0", borderRadius: 5, border: "1px solid #e0e0e0",
    background: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
  };

  // Group units by area for dropdown
  const groupedUnits = units.reduce<Record<string, UnitOption[]>>((acc, u) => {
    (acc[u.area] = acc[u.area] || []).push(u);
    return acc;
  }, {});

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
              initialZone={data?.zone}
              onSuccess={() => { setMode("view"); onRefresh(); }}
              onCancel={() => setMode("view")}
            />
          ) : data?.guest ? (
            <div>
              {/* Reservation card */}
              <div style={{ background: "#f8f8f8", border: "1px solid #eaeaea", borderRadius: 8, padding: 14, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>{data.startTime}{data.endTime ? ` – ${data.endTime}` : ""}</span>
                  <span style={{ fontSize: 11, color: "#999" }}>{data.pax} Pers.</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#111", marginBottom: 2 }}>{data.guest}</div>
                {data.customerEmail && (
                  <div style={{ fontSize: 11, color: "#999", marginBottom: 1 }}>{data.customerEmail}</div>
                )}
                {data.customerPhone && (
                  <div style={{ fontSize: 11, color: "#999", marginBottom: 6 }}>{data.customerPhone}</div>
                )}
                <div style={{ fontSize: 10, color: "#bbb", marginBottom: 12 }}>
                  RND-{data.reservationId?.slice(0, 8).toUpperCase() || "XXXXXXXX"}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={handleMail} disabled={saving} style={{ ...btnBase, color: "#777" }}>
                    <Mail size={10} /> Mail
                  </button>
                  <button onClick={handleCancel} disabled={saving} style={{ ...btnBase, color: "#cc2222", borderColor: "#e8c0c0" }}>
                    <Ban size={10} /> Stornieren
                  </button>
                </div>
              </div>

              {/* Table assignment dropdown */}
              {data.reservationId && (
                <div style={{ background: "#f8f8f8", border: "1px solid #eaeaea", borderRadius: 8, padding: 14, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <MapPin size={13} color="#555" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#333" }}>Tischzuweisung</span>
                  </div>
                  <select
                    value={assignedUnitId}
                    onChange={(e) => handleAssignUnit(e.target.value)}
                    disabled={saving}
                    style={{
                      width: "100%", padding: "8px 10px", fontSize: 12, borderRadius: 6,
                      border: "1px solid #ddd", background: "#fff", cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif", outline: "none",
                      color: assignedUnitId ? "#111" : "#999",
                    }}
                  >
                    <option value="">— Kein Tisch zugewiesen —</option>
                    {Object.entries(groupedUnits).map(([area, areaUnits]) => (
                      <optgroup key={area} label={area.charAt(0).toUpperCase() + area.slice(1)}>
                        {areaUnits.map(u => {
                          const statusIcon = u.status === "occupied" ? "🔴" : u.status === "reserved" ? "🟡" : u.status === "blocked" ? "⛔" : "🟢";
                          return (
                            <option key={u.id} value={u.id}>{statusIcon} {u.name}</option>
                          );
                        })}
                      </optgroup>
                    ))}
                   </select>
                   {/* Status legend */}
                   <div style={{ display: "flex", gap: 10, marginTop: 8, fontSize: 10, color: "#777" }}>
                     <span>🟢 Frei</span>
                     <span>🟡 Reserviert</span>
                     <span>🔴 Besetzt</span>
                     <span>⛔ Gesperrt</span>
                   </div>
                   {assignedUnitId && (
                     <div style={{ fontSize: 10, color: "#999", marginTop: 4 }}>
                       Zugewiesen: {units.find(u => u.id === assignedUnitId)?.name}
                     </div>
                   )}
                </div>
              )}

              {/* Quick actions */}
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                <button onClick={handleCheckIn} disabled={saving} style={{
                  ...btnBase,
                  border: `1px solid ${checkedIn ? "#2a7a2a" : "#e0e0e0"}`,
                  background: checkedIn ? "#e8f5e8" : "#fff",
                  color: checkedIn ? "#2a7a2a" : "#777",
                }}>
                  {checkedIn ? <Check size={11} /> : <LogIn size={11} />}
                  {checkedIn ? "Auschecken" : "Einchecken"}
                </button>
                {data.unitId && (
                  <button onClick={handleBlock} disabled={saving} style={{
                    ...btnBase,
                    border: `1px solid ${data.status === "blocked" ? "#cc2222" : "#e0e0e0"}`,
                    background: data.status === "blocked" ? "#fde8e8" : "#fff",
                    color: data.status === "blocked" ? "#cc2222" : "#777",
                  }}>
                    <Lock size={11} /> {data.status === "blocked" ? "Freigeben" : "Sperren"}
                  </button>
                )}
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
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}><UserPlus size={14} /> Neue Reservierung</button>
          <textarea
            value={notes} onChange={e => setNotes(e.target.value)} onBlur={saveNotes}
            placeholder="Interne Notiz (nicht für Gäste sichtbar)..."
            style={{
              width: "100%", height: 56, background: "#fff", border: "1px solid #e0e0e0",
              borderRadius: 6, padding: "8px 10px", fontSize: 11, resize: "none",
              fontFamily: "'DM Sans', sans-serif", outline: "none",
            }}
          />
        </div>
      </div>
    </>
  );
};
