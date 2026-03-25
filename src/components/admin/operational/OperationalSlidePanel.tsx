import { useEffect, useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { X, CalendarDays, LogIn, Lock, Mail, Ban, Check, UserPlus, MapPin, LogOut, Timer, Users, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BookingForm from "./BookingForm";

const BILLARD_PRICE_PER_MIN = 0.23;

/** Live counter that ticks every second showing elapsed minutes & running cost */
const BillardLiveTimer = ({ startTime }: { startTime?: string }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  if (!startTime) return null;
  const [h, m] = startTime.split(":").map(Number);
  const start = new Date();
  start.setHours(h, m, 0, 0);
  const elapsedSec = Math.max(0, Math.floor((now - start.getTime()) / 1000));
  const elapsedMin = Math.floor(elapsedSec / 60);
  const secs = elapsedSec % 60;
  const cost = (elapsedMin * BILLARD_PRICE_PER_MIN).toFixed(2);

  return (
    <div style={{
      background: "#1e1e1e", borderRadius: 8, padding: 12, marginBottom: 12,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Timer size={16} color="#c9a84c" />
        <div>
          <div style={{ fontSize: 9, color: "#999", fontWeight: 600, textTransform: "uppercase" }}>Spielzeit</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "monospace" }}>
            {String(elapsedMin).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </div>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 9, color: "#999", fontWeight: 600, textTransform: "uppercase" }}>Kosten</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#c9a84c" }}>{cost} €</div>
        <div style={{ fontSize: 9, color: "#666" }}>à 0,23 €/Min</div>
      </div>
    </div>
  );
};

interface UnitDayReservation {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  reservation_time: string;
  guest_count: number;
  status: string;
}

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
  unitDayReservations?: UnitDayReservation[];
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
  customer_name?: string;
  reservation_time?: string;
  guest_count?: number;
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

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  checked_in: { text: "Anwesend", color: "#2a7a2a" },
  confirmed: { text: "Bestätigt", color: "#3a7bd5" },
  pending: { text: "Ausstehend", color: "#e07820" },
  cancelled: { text: "Storniert", color: "#cc2222" },
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
  const [showBillardCheckout, setShowBillardCheckout] = useState(false);
  const dateLabel = format(new Date(), "EEEE, d. MMMM yyyy", { locale: de });

  const isBillardUnit = !!(data?.zone === "billard" || data?.tableLabel?.toLowerCase().includes("billard"));

  useEffect(() => {
    if (open) {
      setNotes(data?.unitNotes || "");
      setCheckedIn(data?.status === "present");
      setMode("view");
      setAssignedUnitId(data?.unitId || "");
    }
  }, [open, data]);

  useEffect(() => {
    if (!open) return;
    supabase.from("units").select("id, name, area, status").order("position_index").then(({ data: u }) => {
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

  const handleCheckOut = async () => {
    if (!data?.reservationId) return;
    if (isBillardUnit && checkedIn) {
      setShowBillardCheckout(true);
      return;
    }
    await performCheckOut();
  };

  const performCheckOut = async () => {
    if (!data?.reservationId) return;
    setShowBillardCheckout(false);
    setSaving(true);
    try {
      await adminAction({ action: "check_out", reservation_id: data.reservationId });
      toast.success("Gast ausgecheckt – Tisch ist wieder frei");
      onRefresh();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Fehler beim Auschecken");
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
      onClose();
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
    const previousUnitId = assignedUnitId;
    setAssignedUnitId(unitId);
    setSaving(true);
    try {
      await adminAction({ action: "assign_unit", reservation_id: data.reservationId, unit_id: unitId || null });
      toast.success(unitId ? "Tisch zugewiesen" : "Tischzuweisung entfernt");
      onRefresh();
    } catch (e: any) {
      setAssignedUnitId(previousUnitId);
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

  const unitStatusMap = new Map<string, "occupied" | "reserved">();
  reservations.forEach(r => {
    if (!r.unit_id) return;
    if (r.status === "checked_in") unitStatusMap.set(r.unit_id, "occupied");
    else if (r.status === "confirmed" || r.status === "pending") {
      if (!unitStatusMap.has(r.unit_id)) unitStatusMap.set(r.unit_id, "reserved");
    }
  });

  const groupedUnits = units.reduce<Record<string, UnitOption[]>>((acc, u) => {
    (acc[u.area] = acc[u.area] || []).push(u);
    return acc;
  }, {});

  const billardCheckoutData = (() => {
    if (!isBillardUnit || !data?.startTime) return null;
    const [h, m] = data.startTime.split(":").map(Number);
    const start = new Date();
    start.setHours(h, m, 0, 0);
    const elapsedMin = Math.max(1, Math.floor((Date.now() - start.getTime()) / 60000));
    const cost = (elapsedMin * BILLARD_PRICE_PER_MIN).toFixed(2);
    return { elapsedMin, cost };
  })();

  const dayReservations = data?.unitDayReservations || [];

  return (
    <>
      {/* Billard Checkout Dialog */}
      {showBillardCheckout && billardCheckoutData && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: "32px 28px", maxWidth: 380, width: "100%",
            fontFamily: "'DM Sans', sans-serif", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fff8e7", border: "2px solid #f0d88a", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <Timer size={28} color="#c9a84c" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 4px" }}>Billard Abrechnung</h3>
              <p style={{ fontSize: 13, color: "#888", margin: 0 }}>{data?.guest}</p>
            </div>

            <div style={{ background: "#fafafa", border: "1px solid #eee", borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid #eee" }}>
                <span style={{ fontSize: 13, color: "#666" }}>Spielzeit</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#111", fontFamily: "monospace" }}>{billardCheckoutData.elapsedMin} Min</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid #eee" }}>
                <span style={{ fontSize: 13, color: "#666" }}>Preis/Min</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#666" }}>0,23 €</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>Gesamt</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: "#c9a84c" }}>{billardCheckoutData.cost} €</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowBillardCheckout(false)} style={{
                flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #ddd", background: "#fff",
                fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#666",
              }}>Abbrechen</button>
              <button onClick={performCheckOut} disabled={saving} style={{
                flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: "#222",
                fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#fff",
              }}>Auschecken</button>
            </div>
          </div>
        </div>
      )}
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
              initialUnitId={data?.unitId}
              onSuccess={() => { setMode("view"); onRefresh(); }}
              onCancel={() => setMode("view")}
            />
          ) : data?.guest ? (
            <div>
              {/* Day reservations for this table */}
              {dayReservations.length > 1 && (
                <div style={{ background: "#f8f8f8", border: "1px solid #eaeaea", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#333", marginBottom: 8 }}>
                    Alle Reservierungen heute ({dayReservations.length})
                  </div>
                  {dayReservations.map(r => {
                    const sl = STATUS_LABEL[r.status] || { text: r.status, color: "#666" };
                    const isActive = r.id === data.reservationId;
                    return (
                      <div key={r.id} style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                        background: isActive ? "#e8f5e8" : "#fff",
                        border: `1px solid ${isActive ? "#b8d8b8" : "#eaeaea"}`,
                        borderRadius: 6, marginBottom: 4,
                      }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: sl.color, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>
                            {r.reservation_time.slice(0, 5)} · {r.customer_name}
                          </div>
                          <div style={{ fontSize: 10, color: "#999", display: "flex", gap: 8 }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 2 }}><Users size={9} /> {r.guest_count}</span>
                            <span style={{ display: "flex", alignItems: "center", gap: 2 }}><Phone size={9} /> {r.customer_phone}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: 9, fontWeight: 700, color: sl.color, padding: "1px 6px", borderRadius: 3, background: `${sl.color}15` }}>{sl.text}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Reservation card */}
              <div style={{ background: "#f8f8f8", border: "1px solid #eaeaea", borderRadius: 8, padding: 14, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>{data.startTime}{data.endTime ? ` – ${data.endTime}` : ""}</span>
                  <span style={{ fontSize: 11, color: "#999" }}>{data.pax} Pers.</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#111", marginBottom: 2 }}>{data.guest}</div>
                {data.customerEmail && (
                  <div style={{ fontSize: 11, color: "#999", marginBottom: 1 }}>✉ {data.customerEmail}</div>
                )}
                {data.customerPhone && (
                  <div style={{ fontSize: 11, color: "#999", marginBottom: 6 }}>☎ {data.customerPhone}</div>
                )}
                <div style={{ fontSize: 10, color: "#bbb", marginBottom: 12 }}>
                  RND-{data.reservationId?.slice(0, 8).toUpperCase() || "XXXXXXXX"}
                </div>

                {/* Live billard timer for checked-in billard guests */}
                {checkedIn && isBillardUnit && data?.unitId && (
                  <BillardLiveTimer startTime={data.startTime} />
                )}

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
                          const resStatus = unitStatusMap.get(u.id);
                          const statusIcon = resStatus === "occupied" ? "🔴" : resStatus === "reserved" ? "🟡" : u.status === "blocked" ? "⛔" : "🟢";
                          return (
                            <option key={u.id} value={u.id}>{statusIcon} {u.name}</option>
                          );
                        })}
                      </optgroup>
                    ))}
                   </select>
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
                {!checkedIn ? (
                  <button onClick={handleCheckIn} disabled={saving} style={{
                    ...btnBase, color: "#777",
                  }}>
                    <LogIn size={11} /> Einchecken
                  </button>
                ) : (
                  <button onClick={handleCheckOut} disabled={saving} style={{
                    ...btnBase,
                    border: "1px solid #cc2222",
                    background: "#fde8e8",
                    color: "#cc2222",
                  }}>
                    <LogOut size={11} /> Gast geht
                  </button>
                )}
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
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 0", textAlign: "center" }}>
              {/* Day reservations for free table */}
              {dayReservations.length > 0 && (
                <div style={{ width: "100%", textAlign: "left", marginBottom: 16 }}>
                  <div style={{ background: "#f8f8f8", border: "1px solid #eaeaea", borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#333", marginBottom: 8 }}>
                      Reservierungen heute ({dayReservations.length})
                    </div>
                    {dayReservations.map(r => {
                      const sl = STATUS_LABEL[r.status] || { text: r.status, color: "#666" };
                      return (
                        <div key={r.id} style={{
                          display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                          background: "#fff", border: "1px solid #eaeaea",
                          borderRadius: 6, marginBottom: 4,
                        }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: sl.color, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>
                              {r.reservation_time.slice(0, 5)} · {r.customer_name}
                            </div>
                            <div style={{ fontSize: 10, color: "#999", display: "flex", gap: 8 }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 2 }}><Users size={9} /> {r.guest_count}</span>
                              <span style={{ display: "flex", alignItems: "center", gap: 2 }}><Phone size={9} /> {r.customer_phone}</span>
                              <span>✉ {r.customer_email}</span>
                            </div>
                          </div>
                          <span style={{ fontSize: 9, fontWeight: 700, color: sl.color, padding: "1px 6px", borderRadius: 3, background: `${sl.color}15` }}>{sl.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <CalendarDays size={40} color="#ddd" style={{ marginBottom: 12 }} />
              <span style={{ fontSize: 14, color: "#999" }}>
                {data?.status === "blocked" ? "Tisch ist gesperrt" : "Aktuell keine Reservierung"}
              </span>
              <span style={{ fontSize: 12, color: "#ccc", marginTop: 4 }}>
                {data?.status === "blocked" ? "Dieser Tisch ist aktuell nicht verfügbar" : "Dieser Tisch ist frei verfügbar"}
              </span>
              {data?.unitId && (
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <button onClick={handleBlock} disabled={saving} style={{
                    padding: "8px 16px", fontSize: 12, fontWeight: 700, borderRadius: 6,
                    background: data.status === "blocked" ? "#e8f5e8" : "#fde8e8",
                    color: data.status === "blocked" ? "#2a7a2a" : "#cc2222",
                    border: `1px solid ${data.status === "blocked" ? "#b8d8b8" : "#d8a0a0"}`,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <Lock size={12} /> {data.status === "blocked" ? "Tisch freigeben" : "Tisch sperren"}
                  </button>
                </div>
              )}
              {data?.status !== "blocked" && (
                <button onClick={() => setMode("book")} style={{
                  marginTop: data?.unitId ? 8 : 16, padding: "8px 16px", fontSize: 12, fontWeight: 700, borderRadius: 6,
                  background: "#c9a84c", color: "#111", border: "none", cursor: "pointer",
                }}>+ Reservierung anlegen</button>
              )}
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
