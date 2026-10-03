import { useEffect, useState, useMemo } from "react";
import { format, addDays, subDays } from "date-fns";
import { de } from "date-fns/locale";
import { X, CalendarDays, LogIn, Lock, Mail, Ban, Check, UserPlus, MapPin, LogOut, Timer, Users, Phone, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BookingForm from "./BookingForm";

const BILLARD_PRICE_PER_MIN = 0.23;

/** Live counter that ticks every second showing elapsed minutes & running cost.
 *  Counts from the actual check-in moment (checkedInAt) when available,
 *  otherwise falls back to the booked start time. */
const BillardLiveTimer = ({ startTime, checkedInAt }: { startTime?: string; checkedInAt?: string | null }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  let start: Date | null = null;
  if (checkedInAt) {
    start = new Date(checkedInAt);
  } else if (startTime) {
    const [h, m] = startTime.split(":").map(Number);
    start = new Date();
    start.setHours(h, m, 0, 0);
  }
  if (!start) return null;
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
  customerMessage?: string;
  zone?: string;
  checkedInAt?: string | null;
  unitDayReservations?: UnitDayReservation[];
  allReservationsForUnit?: UnitDayReservation[];
  initialWalkIn?: boolean;
  directBook?: boolean;
  initialGuest?: string;
  initialEmail?: string;
  initialPhone?: string;
  initialDate?: string;
  initialTime?: string;
  initialPax?: number;
  waitlistId?: string;
  blockStart?: string | null;
  blockEnd?: string | null;
}

interface UnitOption {
  id: string;
  name: string;
  area: string;
  status: string | null;
  capacity?: number | null;
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
  isMobile?: boolean;
  currentDate?: string;
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

export const OperationalSlidePanel = ({ open, data, onClose, onBookNew, onRefresh, reservations = [], isMobile = false, currentDate }: Props) => {
  const [notes, setNotes] = useState("");
  const [checkedIn, setCheckedIn] = useState(false);
  const [mode, setMode] = useState<"view" | "book">("view");
  const [saving, setSaving] = useState(false);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [assignedUnitId, setAssignedUnitId] = useState<string>("");
  const [showBillardCheckout, setShowBillardCheckout] = useState(false);
  const [browseDate, setBrowseDate] = useState(new Date());
  const [browseDateReservations, setBrowseDateReservations] = useState<UnitDayReservation[]>([]);
  const [loadingBrowse, setLoadingBrowse] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editPax, setEditPax] = useState(2);
  const panelDateStr = currentDate || format(new Date(), "yyyy-MM-dd");
  const dateLabel = format(new Date(panelDateStr + "T00:00:00"), "EEEE, d. MMMM yyyy", { locale: de });
  const browseDateLabel = format(browseDate, "EEE, d. MMM yyyy", { locale: de });
  const isToday = format(browseDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  const isBillardUnit = !!(data?.zone === "billard" || data?.tableLabel?.toLowerCase().includes("billard"));

  useEffect(() => {
    if (open) {
      setNotes(data?.unitNotes || "");
      setCheckedIn(data?.status === "present");
      setMode((data?.initialWalkIn || data?.directBook) ? "book" : "view");
      setAssignedUnitId(data?.unitId || "");
      setBrowseDate(new Date(panelDateStr + "T00:00:00"));
      setBrowseDateReservations(data?.unitDayReservations || []);
      setEditing(false);
      setEditName(data?.guest || "");
      setEditEmail(data?.customerEmail || "");
      setEditPhone(data?.customerPhone || "");
      setEditTime(data?.startTime || "");
      setEditPax(data?.pax || 2);
    }
  }, [open, data, panelDateStr]);

  const handleSaveEdit = async () => {
    if (!data?.reservationId) return;
    if (!editName.trim()) { toast.error("Name darf nicht leer sein"); return; }
    setSaving(true);
    try {
      await adminAction({
        action: "edit_reservation",
        reservation_id: data.reservationId,
        customer_name: editName,
        customer_email: editEmail,
        customer_phone: editPhone,
        reservation_time: editTime,
        guest_count: editPax,
      });
      toast.success("Reservierung aktualisiert");
      setEditing(false);
      onRefresh();
    } catch (e: any) {
      toast.error(e?.message || "Fehler beim Speichern");
    }
    setSaving(false);
  };

  // Fetch reservations for a different date when browsing
  useEffect(() => {
    if (!open || !data?.unitId) return;
    const dateStr = format(browseDate, "yyyy-MM-dd");
    if (dateStr === panelDateStr) {
      setBrowseDateReservations(data?.unitDayReservations || []);
      return;
    }
    setLoadingBrowse(true);
    supabase.functions.invoke("admin-actions", {
      body: { action: "fetch_dashboard", date: dateStr },
    }).then(res => {
      if (res.data?.reservations) {
        const filtered = (res.data.reservations as any[]).filter(
          (r: any) => r.unit_id === data.unitId && r.status !== "checked_out"
        ).map((r: any) => ({
          id: r.id,
          customer_name: r.customer_name,
          customer_phone: r.customer_phone,
          customer_email: r.customer_email,
          reservation_time: r.reservation_time,
          guest_count: r.guest_count,
          status: r.status,
        }));
        setBrowseDateReservations(filtered);
      }
      setLoadingBrowse(false);
    }).catch(() => setLoadingBrowse(false));
  }, [browseDate, open, data?.unitId, data?.unitDayReservations, panelDateStr]);

  useEffect(() => {
    if (!open) return;
    supabase.from("units").select("id, name, area, status, capacity").order("position_index").then(({ data: u }) => {
      const filtered = ((u as UnitOption[]) || []).map(unit => ({
        ...unit,
        status: unit.status === "blocked" ? "free" : unit.status,
      })).filter(unit => {
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
    // If currently blocked → unblock immediately for the viewed date.
    if (data.status === "blocked") {
      setSaving(true);
      try {
        await adminAction({ action: "block_unit", unit_id: data.unitId, blocked: true, start_date: currentDate });
        toast.success("Tisch freigegeben");
        onRefresh();
        onClose();
      } catch (e: any) {
        toast.error(e?.message || "Fehler beim Freigeben");
      }
      setSaving(false);
      return;
    }
    // Otherwise open dialog to pick range.
    const today = currentDate || format(new Date(), "yyyy-MM-dd");
    setBlockStart(today);
    setBlockEnd(today);
    setShowBlockDialog(true);
  };

  const confirmBlock = async () => {
    if (!data?.unitId) return;
    if (!blockStart) { toast.error("Bitte Datum angeben"); return; }
    setSaving(true);
    try {
      await adminAction({
        action: "block_unit",
        unit_id: data.unitId,
        blocked: false,
        start_date: blockStart,
        end_date: blockStart,
      });
      const pretty = format(new Date(blockStart + "T00:00:00"), "EEEE, d. MMMM yyyy", { locale: de });
      toast.success(`Tisch gesperrt für ${pretty}`);
      setShowBlockDialog(false);
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
    if (!isBillardUnit) return null;
    let start: Date | null = null;
    if (data?.checkedInAt) {
      start = new Date(data.checkedInAt);
    } else if (data?.startTime) {
      const [h, m] = data.startTime.split(":").map(Number);
      start = new Date();
      start.setHours(h, m, 0, 0);
    }
    if (!start) return null;
    const elapsedMin = Math.max(1, Math.floor((Date.now() - start.getTime()) / 60000));
    const cost = (elapsedMin * BILLARD_PRICE_PER_MIN).toFixed(2);
    return { elapsedMin, cost };
  })();

  const dayReservations = data?.unitDayReservations || [];
  const currentTime = format(new Date(), "HH:mm");

  // Browsable date reservation block
  const renderDateReservationBlock = () => {
    if (!data?.unitId) return null;
    return (
      <div style={{ background: "#f8f8f8", border: "1px solid #eaeaea", borderRadius: 8, padding: 12, marginBottom: 12 }}>
        {/* Date navigation */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <button onClick={() => setBrowseDate(d => subDays(d, 1))} style={{
            width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
            background: "#fff", border: "1px solid #ddd", borderRadius: 4, cursor: "pointer", color: "#555",
          }}><ChevronLeft size={14} /></button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#333" }}>
              {isToday ? "Heute" : browseDateLabel}
            </div>
            {!isToday && (
              <button onClick={() => setBrowseDate(new Date())} style={{
                fontSize: 9, color: "#3a7bd5", background: "none", border: "none", cursor: "pointer", fontWeight: 600,
              }}>↩ Zurück zu heute</button>
            )}
          </div>
          <button onClick={() => setBrowseDate(d => addDays(d, 1))} style={{
            width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
            background: "#fff", border: "1px solid #ddd", borderRadius: 4, cursor: "pointer", color: "#555",
          }}><ChevronRight size={14} /></button>
        </div>

        {/* Reservation list only - timeline bar removed */}

        {/* Reservation count */}
        <div style={{ fontSize: 11, fontWeight: 700, color: "#333", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <CalendarDays size={12} />
          Reservierungen ({browseDateReservations.length})
        </div>

        {loadingBrowse ? (
          <div style={{ textAlign: "center", padding: "16px 0", fontSize: 12, color: "#999" }}>Laden...</div>
        ) : browseDateReservations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "16px 0", fontSize: 12, color: "#999" }}>
            Keine Reservierungen{isToday ? " heute" : ""}
          </div>
        ) : (() => {
          // Sort chronologically and tag the currently-relevant entry.
          const sorted = [...browseDateReservations].sort((a, b) =>
            a.reservation_time.localeCompare(b.reservation_time)
          );
          const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
          const checkedInIdx = sorted.findIndex(r => r.status === "checked_in");
          let currentIdx = checkedInIdx;
          if (currentIdx < 0 && isToday) {
            currentIdx = sorted.findIndex(r => {
              const [h, m] = r.reservation_time.split(":").map(Number);
              return h * 60 + m + 120 > nowMin; // assume up to 2h slot
            });
          }
          return sorted.map((r, idx) => {
            const sl = STATUS_LABEL[r.status] || { text: r.status, color: "#666" };
            const isActive = r.id === data.reservationId;
            const isCurrent = isToday && idx === currentIdx;
            const isNext = isToday && currentIdx >= 0 && idx === currentIdx + 1;
            const tag = isCurrent ? "Jetzt dran" : isNext ? "Als Nächstes" : null;
            const tagColor = isCurrent ? "#2a7a2a" : "#3a7bd5";
            return (
              <div key={r.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                background: isCurrent ? "#e8f5e8" : isActive ? "#f0f7ff" : "#fff",
                border: `1px solid ${isCurrent ? "#b8d8b8" : isActive ? "#b8d0e8" : "#eaeaea"}`,
                borderRadius: 6, marginBottom: 4,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: sl.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#111", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span>{r.reservation_time.slice(0, 5)} · {r.customer_name}</span>
                    {tag && (
                      <span style={{
                        fontSize: 8, fontWeight: 800, color: "#fff",
                        background: tagColor, padding: "1px 5px", borderRadius: 3,
                        textTransform: "uppercase", letterSpacing: 0.4,
                      }}>{tag}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: "#666", display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 2 }}><Users size={9} /> {r.guest_count}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 2 }}><Phone size={9} /> {r.customer_phone}</span>
                  </div>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, color: sl.color, padding: "1px 6px", borderRadius: 3, background: `${sl.color}15` }}>{sl.text}</span>
              </div>
            );
          });
        })()}
      </div>
    );
  };

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
        position: "fixed", top: 0, right: open ? 0 : (isMobile ? "-100%" : -460), height: "100%",
        width: isMobile ? "100%" : 420,
        background: "#fff", borderLeft: isMobile ? "none" : "1px solid #ddd", zIndex: 200,
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
              initialWalkIn={data?.initialWalkIn}
              initialGuest={data?.initialGuest}
              initialEmail={data?.initialEmail}
              initialPhone={data?.initialPhone}
              initialDate={data?.initialDate || currentDate}
              initialTime={data?.initialTime}
              initialPax={data?.initialPax}
              allUnits={units}
              reservations={reservations}
              onSuccess={() => { setMode("view"); onRefresh(); }}
              onCancel={() => setMode("view")}
            />
          ) : data?.guest ? (
            <div>
              {/* Date-browsable reservations for this table */}
              {renderDateReservationBlock()}

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
                {data.customerMessage && data.customerMessage.trim() && (
                  <div style={{
                    background: "#fffbe8", border: "1px solid #f0e0a0", borderRadius: 6,
                    padding: "8px 10px", marginTop: 4, marginBottom: 8,
                  }}>
                    <div style={{ fontSize: 9, color: "#8a7a20", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>
                      Notiz vom Gast
                    </div>
                    <div style={{ fontSize: 12, color: "#5a4a10", whiteSpace: "pre-wrap", lineHeight: 1.4 }}>
                      {data.customerMessage}
                    </div>
                  </div>
                )}
                <div style={{ fontSize: 10, color: "#bbb", marginBottom: 12 }}>
                  RND-{data.reservationId?.slice(0, 8).toUpperCase() || "XXXXXXXX"}
                </div>

                {/* Live billard timer for checked-in billard guests */}
                {checkedIn && isBillardUnit && data?.unitId && (
                  <BillardLiveTimer startTime={data.startTime} checkedInAt={data.checkedInAt} />
                )}

                <div style={{ display: "flex", gap: 6 }}>
                  {!checkedIn ? (
                    <button onClick={handleCheckIn} disabled={saving} style={{ ...btnBase, color: "#2a7a2a", borderColor: "#bfe0bf" }}>
                      <LogIn size={10} /> Gast kommt
                    </button>
                  ) : (
                    <button onClick={handleCheckOut} disabled={saving} style={{ ...btnBase, color: "#cc2222", borderColor: "#e8c0c0", background: "#fde8e8" }}>
                      <LogOut size={10} /> Gast geht
                    </button>
                  )}
                  <button onClick={() => setEditing(e => !e)} disabled={saving} style={{ ...btnBase, color: "#3a7bd5", borderColor: "#b8d0e8" }}>
                    <Pencil size={10} /> Bearbeiten
                  </button>
                  <button onClick={handleCancel} disabled={saving} style={{ ...btnBase, color: "#cc2222", borderColor: "#e8c0c0" }}>
                    <Ban size={10} /> Stornieren
                  </button>
                </div>

                {editing && (
                  <div style={{ marginTop: 10, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#333", marginBottom: 8 }}>Reservierung bearbeiten</div>
                    {([
                      { label: "Name", value: editName, set: setEditName, type: "text" },
                      { label: "E-Mail", value: editEmail, set: setEditEmail, type: "email" },
                      { label: "Telefon", value: editPhone, set: setEditPhone, type: "tel" },
                    ] as const).map(f => (
                      <div key={f.label} style={{ marginBottom: 6 }}>
                        <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: "#999", textTransform: "uppercase", marginBottom: 2 }}>{f.label}</label>
                        <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} style={{
                          width: "100%", padding: "7px 10px", fontSize: 12, borderRadius: 6,
                          border: "1px solid #ddd", outline: "none", boxSizing: "border-box",
                          fontFamily: "'DM Sans', sans-serif", background: "#fff", color: "#111111",
                        }} />
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: "#999", textTransform: "uppercase", marginBottom: 2 }}>Uhrzeit</label>
                        <input type="time" step={900} value={editTime} onChange={e => setEditTime(e.target.value)} style={{
                          width: "100%", padding: "7px 10px", fontSize: 12, borderRadius: 6,
                          border: "1px solid #ddd", outline: "none", boxSizing: "border-box",
                          fontFamily: "'DM Sans', sans-serif", background: "#fff", color: "#111111",
                        }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: "#999", textTransform: "uppercase", marginBottom: 2 }}>Personen</label>
                        <input type="number" min={1} max={50} value={editPax} onChange={e => setEditPax(Number(e.target.value))} style={{
                          width: "100%", padding: "7px 10px", fontSize: 12, borderRadius: 6,
                          border: "1px solid #ddd", outline: "none", boxSizing: "border-box",
                          fontFamily: "'DM Sans', sans-serif", background: "#fff", color: "#111111",
                        }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setEditing(false)} disabled={saving} style={{ ...btnBase, color: "#666" }}>
                        Abbrechen
                      </button>
                      <button onClick={handleSaveEdit} disabled={saving} style={{ ...btnBase, background: "#222", color: "#fff", borderColor: "#222" }}>
                        <Check size={10} /> Speichern
                      </button>
                    </div>
                  </div>
                )}
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
                <button onClick={handleMail} disabled={saving} style={{ ...btnBase, color: "#777" }}>
                  <Mail size={11} /> E-Mail senden
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
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 0", textAlign: "center" }}>
              {/* Date-browsable reservations for free table */}
              <div style={{ width: "100%", textAlign: "left", marginBottom: 16 }}>
                {renderDateReservationBlock()}
              </div>
              <CalendarDays size={40} color="#ddd" style={{ marginBottom: 12 }} />
              <span style={{ fontSize: 14, color: "#999" }}>
                {data?.status === "blocked" ? "Tisch ist gesperrt" : "Aktuell keine Reservierung"}
              </span>
              <span style={{ fontSize: 12, color: "#ccc", marginTop: 4 }}>
                {data?.status === "blocked"
                  ? (data?.blockStart && data?.blockEnd
                      ? (data.blockStart === data.blockEnd
                          ? `Gesperrt am ${data.blockStart}`
                          : `Gesperrt vom ${data.blockStart} bis ${data.blockEnd}`)
                      : "Dieser Tisch ist aktuell nicht verfügbar")
                  : "Dieser Tisch ist frei verfügbar"}
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
      {showBlockDialog && (
        <div
          onClick={() => !saving && setShowBlockDialog(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 10, padding: 20, width: 320, maxWidth: "92vw",
            boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 4 }}>Tisch sperren</div>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 14 }}>
              Für welchen Tag soll <strong>{data?.tableLabel}</strong> gesperrt sein?
            </div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Datum auswählen</label>
            {blockStart && (
              <div style={{ fontSize: 12, fontWeight: 700, color: "#111", marginBottom: 6 }}>
                Ausgewählt: {format(new Date(blockStart + "T00:00:00"), "EEEE, d. MMMM yyyy", { locale: de })}
              </div>
            )}
            <input type="date" value={blockStart} onChange={(e) => setBlockStart(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, marginBottom: 10, fontFamily: "'DM Sans', sans-serif", color: "#111", background: "#fff", WebkitTextFillColor: "#111", colorScheme: "light" }} />
            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
              {[0, 1, 2, 7].map((offset) => {
                const d = addDays(new Date(), offset);
                const iso = format(d, "yyyy-MM-dd");
                const label = offset === 0 ? "Heute" : offset === 1 ? "Morgen" : format(d, "EEE d.M.", { locale: de });
                const active = blockStart === iso;
                return (
                  <button key={offset} onClick={() => setBlockStart(iso)} style={{
                    padding: "5px 10px", fontSize: 11, fontWeight: 600, borderRadius: 5, cursor: "pointer",
                    border: `1px solid ${active ? "#cc2222" : "#ddd"}`,
                    background: active ? "#fde8e8" : "#fff",
                    color: active ? "#cc2222" : "#555",
                  }}>{label}</button>
                );
              })}
            </div>
            <div style={{
              background: "#fff7e6", border: "1px solid #f0d8a0", borderRadius: 6,
              padding: "10px 12px", marginBottom: 16, fontSize: 12, color: "#7a5a10",
            }}>
              {blockStart
                ? <>Sperre wird gesetzt für <strong>{format(new Date(blockStart + "T00:00:00"), "EEEE, d. MMMM yyyy", { locale: de })}</strong>. Der Tisch ist nur an diesem Tag nicht buchbar.</>
                : "Bitte ein Datum auswählen."}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowBlockDialog(false)} disabled={saving} style={{
                padding: "8px 14px", fontSize: 12, color: "#666", background: "#f3f3f3",
                border: "1px solid #ddd", borderRadius: 6, cursor: "pointer",
              }}>Abbrechen</button>
              <button onClick={confirmBlock} disabled={saving || !blockStart} style={{
                padding: "8px 14px", fontSize: 12, color: "#fff", fontWeight: 700, background: "#cc2222",
                border: "none", borderRadius: 6, cursor: (saving || !blockStart) ? "not-allowed" : "pointer",
                opacity: (saving || !blockStart) ? 0.6 : 1,
              }}>Für diesen Tag sperren</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
