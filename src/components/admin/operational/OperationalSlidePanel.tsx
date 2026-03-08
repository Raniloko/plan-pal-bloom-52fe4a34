import { useEffect, useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { X, CalendarDays, LogIn, Lock, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { PanelData, PanelMode } from "./types";
import { BookingForm } from "./BookingForm";

interface Props {
  open: boolean;
  data: PanelData | null;
  showBookingForm: boolean;
  onClose: () => void;
}

const STATUS_PILL: Record<string, string> = {
  Frei: "bg-[#e8f5e8] text-[#2a7a2a] border-[#b8d8b8]",
  Reserviert: "bg-[#fff3e0] text-[#e07820] border-[#f0c88a]",
  Anwesend: "bg-[#e8f5e8] text-[#166a2a] border-[#a0d8a0]",
  Gesperrt: "bg-[#f5e8e8] text-[#cc2222] border-[#d8a0a0]",
};

export const OperationalSlidePanel = ({ open, data, showBookingForm, onClose }: Props) => {
  const [mode, setMode] = useState<PanelMode>("view");
  const [notes, setNotes] = useState("");
  const [checkedIn, setCheckedIn] = useState(false);

  const dateLabel = format(new Date(), "EEEE, d. MMMM yyyy", { locale: de });

  useEffect(() => {
    if (open) {
      setMode(showBookingForm ? "book" : "view");
      setNotes(data?.unitNotes || "");
      setCheckedIn(data?.status === "present");
    }
  }, [open, data, showBookingForm]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const statusLabel = () => {
    if (!data) return "Frei";
    if (data.status === "present") return "Anwesend";
    if (data.status === "reserved") return "Reserviert";
    if (data.status === "blocked") return "Gesperrt";
    return "Frei";
  };

  const saveNotes = async () => {
    if (!data?.unitId) return;
    await supabase.from("units").update({ notes }).eq("id", data.unitId);
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-[199]" style={{ background: "rgba(0,0,0,0.35)" }} onClick={onClose} />
      )}

      {/* Panel */}
      <div
        className="fixed top-0 h-full w-[430px] bg-white flex flex-col z-[200]"
        style={{
          right: open ? 0 : -460,
          transition: "right 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          borderLeft: "1px solid #ddd",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-[#f8f8f8] px-[18px] py-4" style={{ borderBottom: "1px solid #eee" }}>
          <div>
            <div className="text-[15px] font-bold text-[#111]">{data?.tableLabel || "Tisch"}</div>
            <div className="text-[11px] text-[#999]">
              {data?.guest || "Kein Gast zugewiesen"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center bg-[#eee] border border-[#ddd] rounded text-[#666] hover:bg-[#cc2222] hover:text-white hover:border-[#cc2222] transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Date + Status */}
        <div className="flex items-center justify-between px-[18px] py-2.5" style={{ borderBottom: "1px solid #eee" }}>
          <span className="text-xs font-semibold text-[#333] flex items-center gap-2">
            <CalendarDays size={13} /> {dateLabel}
          </span>
          <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${STATUS_PILL[statusLabel()] || STATUS_PILL.Frei}`}>
            {statusLabel()}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {mode === "book" ? (
            <BookingForm
              tableLabel={data?.tableLabel}
              onSuccess={onClose}
              onClose={onClose}
            />
          ) : data?.guest ? (
            <div className="px-[18px] py-3.5">
              {/* Reservation card */}
              <div className="bg-[#f8f8f8] border border-[#eaeaea] rounded-lg p-3.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[15px] font-bold text-[#111]">{data.startTime}</span>
                  <span className="text-[11px] text-[#999]">{data.pax} Pers.</span>
                </div>
                <div className="text-sm font-semibold text-[#111] mb-1">{data.guest}</div>
                <div className="text-[10px] text-[#bbb] mb-3">
                  RND-{data.reservationId?.slice(0, 8).toUpperCase()}
                </div>
                <div className="flex gap-1.5">
                  {[
                    { label: "Bearbeiten", action: () => setMode("edit") },
                    { label: "Mail", action: () => {} },
                    { label: "Stornieren", action: () => {}, red: true },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      onClick={btn.action}
                      className="flex-1 py-1.5 rounded-[5px] border text-[10px] font-bold transition-colors"
                      style={{
                        borderColor: "#e0e0e0",
                        background: "#fff",
                        color: btn.red ? "#cc2222" : "#777",
                      }}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CalendarDays size={40} className="text-[#ddd] mb-3" />
              <span className="text-sm text-[#999]">Dieser Tisch ist frei</span>
              <span className="text-xs text-[#ccc] mt-1">Keine Reservierungen heute</span>
              <button
                onClick={() => setMode("book")}
                className="mt-4 px-4 py-2 text-xs font-bold rounded-md"
                style={{ background: "#c9a84c", color: "#111" }}
              >
                + Reservierung anlegen
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#f8f8f8] px-[18px] py-3 flex flex-col gap-1.5" style={{ borderTop: "1px solid #eee" }}>
          <button
            onClick={() => setMode("book")}
            className="w-full py-2.5 text-[13px] font-bold rounded-[7px] hover:bg-black transition-colors"
            style={{ background: "#1a1a1a", color: "#fff" }}
          >
            + Neue Reservierung
          </button>
          <div className="flex gap-1.5">
            <button
              onClick={() => setCheckedIn(!checkedIn)}
              className="flex-1 py-2 border text-[10px] font-bold rounded-md flex items-center justify-center gap-1 transition-colors"
              style={{
                borderColor: checkedIn ? "#2a7a2a" : "#e0e0e0",
                background: checkedIn ? "#e8f5e8" : "#fff",
                color: checkedIn ? "#2a7a2a" : "#777",
              }}
            >
              <LogIn size={11} /> Einchecken
            </button>
            <button className="flex-1 py-2 bg-white border border-[#e0e0e0] text-[10px] font-bold text-[#777] rounded-md flex items-center justify-center gap-1 hover:border-[#333] hover:text-[#333] transition-colors">
              <Lock size={11} /> Sperren
            </button>
            <button className="flex-1 py-2 bg-white border border-[#e0e0e0] text-[10px] font-bold text-[#777] rounded-md flex items-center justify-center gap-1 hover:border-[#333] hover:text-[#333] transition-colors">
              <Mail size={11} /> Mail
            </button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
            placeholder="Interne Notiz (nicht für Gäste sichtbar)..."
            className="w-full h-[60px] bg-white border border-[#e0e0e0] rounded-md px-2.5 py-2 text-[11px] resize-none focus:border-[#aaa] focus:outline-none"
          />
        </div>
      </div>
    </>
  );
};
