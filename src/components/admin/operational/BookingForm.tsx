import { useState } from "react";
import { format } from "date-fns";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  tableLabel?: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const BookingForm = ({ tableLabel, onSuccess, onClose }: Props) => {
  const [guest, setGuest] = useState("");
  const [pax, setPax] = useState(2);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("21:00");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!guest.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("reservations").insert({
        customer_name: guest.trim(),
        guest_count: pax,
        reservation_date: date,
        reservation_time: startTime,
        customer_email: "walk-in@rondo.de",
        customer_phone: "-",
        zone: "restaurant",
        occasion: "essen",
        status: "confirmed",
        message: note || null,
      });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => onSuccess(), 1500);
    } catch (e) {
      console.error("Booking error:", e);
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-[#e8f5e8] flex items-center justify-center mb-3">
          <Check size={24} className="text-[#2a7a2a]" />
        </div>
        <div className="text-sm font-bold text-[#111] mb-1">Reservierung erstellt</div>
        <div className="text-xs text-[#999]">{guest} · {pax} Pers. · {startTime}</div>
        <button onClick={onClose} className="mt-4 px-4 py-1.5 text-xs font-semibold border border-[#ddd] rounded-md hover:bg-[#f0f0f0]">
          Schließen
        </button>
      </div>
    );
  }

  return (
    <div className="px-[18px] py-3 flex flex-col gap-3">
      <div className="text-sm font-bold text-[#111] mb-1">Neue Reservierung{tableLabel ? ` – ${tableLabel}` : ""}</div>

      <div>
        <label className="text-[10px] font-bold uppercase text-[#888] mb-1 block">Gastname *</label>
        <input
          value={guest}
          onChange={(e) => setGuest(e.target.value)}
          className="w-full h-9 px-2.5 text-xs border border-[#ddd] rounded-md focus:border-[#aaa] focus:outline-none"
          placeholder="Name eingeben..."
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-bold uppercase text-[#888] mb-1 block">Personen</label>
          <select value={pax} onChange={(e) => setPax(Number(e.target.value))} className="w-full h-9 px-2 text-xs border border-[#ddd] rounded-md focus:outline-none">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase text-[#888] mb-1 block">Datum</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full h-9 px-2 text-xs border border-[#ddd] rounded-md focus:outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-bold uppercase text-[#888] mb-1 block">Von</label>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full h-9 px-2 text-xs border border-[#ddd] rounded-md focus:outline-none" />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase text-[#888] mb-1 block">Bis</label>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full h-9 px-2 text-xs border border-[#ddd] rounded-md focus:outline-none" />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase text-[#888] mb-1 block">Interne Notiz</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full h-16 px-2.5 py-2 text-[11px] border border-[#ddd] rounded-md resize-none focus:border-[#aaa] focus:outline-none"
          placeholder="Optionale Notiz..."
        />
      </div>

      <button
        onClick={handleSave}
        disabled={!guest.trim() || saving}
        className="w-full py-2.5 text-[13px] font-bold rounded-[7px] transition-colors disabled:opacity-40"
        style={{ background: "#1a1a1a", color: "#fff" }}
      >
        {saving ? "Speichern..." : "Reservierung speichern"}
      </button>
    </div>
  );
};
