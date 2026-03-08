import { useEffect, useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  CalendarDays, ChevronLeft, ChevronRight, Cloud, BarChart2,
  Users, User, Timer, Clock, ClipboardList, Menu,
} from "lucide-react";

interface Props {
  totalReservations: number;
  totalGuests: number;
}

const IconBtn = ({ children, borderL }: { children: React.ReactNode; borderL?: boolean }) => (
  <button
    className="flex items-center justify-center text-[#888] hover:text-white hover:bg-white/[0.06] transition-colors"
    style={{ width: 36, height: "100%", borderLeft: borderL ? "1px solid #2a2a2a" : undefined }}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px self-stretch bg-[#2a2a2a]" />;

export const OperationalTopbar = ({ totalReservations, totalGuests }: Props) => {
  const [time, setTime] = useState("");
  const shortDate = format(new Date(), "EEE., d MMM", { locale: de });

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setTime(
        `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center h-[52px] min-h-[52px] bg-[#111111]" style={{ borderBottom: "1px solid #2a2a2a", fontFamily: "'DM Sans', sans-serif" }}>
      {/* A – Logo */}
      <button className="flex items-center justify-center h-full px-3 text-[#aaa] hover:text-white">
        <Menu size={18} />
      </button>
      <Divider />
      <div className="flex items-center px-2 h-full" style={{ borderRight: "1px solid #2a2a2a" }}>
        <img src="/images/rondo-logo.png" alt="Rondo" className="h-7 opacity-85" style={{ filter: "brightness(0) invert(1)" }} />
      </div>
      <Divider />

      {/* B – Jetzt */}
      <button className="flex items-center gap-1.5 px-3 h-full text-[13px] font-semibold text-white hover:bg-white/[0.04]" style={{ borderRight: "1px solid #2a2a2a" }}>
        <CalendarDays size={14} />
        Jetzt
        <ChevronLeft size={12} className="text-[#666]" />
      </button>

      {/* C – Date nav */}
      <div className="flex items-center h-full" style={{ borderRight: "1px solid #2a2a2a" }}>
        <button className="w-7 h-full flex items-center justify-center text-[#666] hover:text-white"><ChevronLeft size={14} /></button>
        <span className="text-sm font-semibold text-white px-1 whitespace-nowrap">{shortDate}</span>
        <button className="w-7 h-full flex items-center justify-center text-[#666] hover:text-white"><ChevronRight size={14} /></button>
      </div>

      {/* D – Meal period */}
      <div className="flex items-center h-full" style={{ borderRight: "1px solid #2a2a2a" }}>
        <button className="w-[22px] h-full flex items-center justify-center text-[#666] hover:text-white"><ChevronLeft size={12} /></button>
        <span className="text-[13px] font-medium text-white px-1">Abendessen</span>
        <button className="w-[22px] h-full flex items-center justify-center text-[#666] hover:text-white"><ChevronRight size={12} /></button>
      </div>

      {/* E – Time */}
      <div className="flex items-center h-full" style={{ borderRight: "1px solid #2a2a2a" }}>
        <button className="w-[22px] h-full flex items-center justify-center text-[#666] hover:text-white"><ChevronLeft size={12} /></button>
        <span className="text-sm font-bold text-white px-2 tabular-nums font-mono">{time}</span>
        <button className="w-[22px] h-full flex items-center justify-center text-[#666] hover:text-white"><ChevronRight size={12} /></button>
      </div>

      {/* F – Right icons */}
      <div className="ml-auto flex items-center h-full">
        <IconBtn borderL><Cloud size={16} /></IconBtn>
        <IconBtn borderL><BarChart2 size={16} /></IconBtn>
        <div className="flex items-center px-3 h-full" style={{ borderLeft: "1px solid #2a2a2a" }}>
          <Users size={14} className="text-[#888] mr-1.5" />
          <span className="text-[13px] text-[#888]">
            <span className="font-bold text-white">{totalReservations}</span>/{totalGuests}
          </span>
        </div>
        <IconBtn borderL><User size={16} /></IconBtn>
        <IconBtn borderL><Timer size={16} /></IconBtn>
        <IconBtn borderL><Clock size={16} /></IconBtn>
        <IconBtn borderL><ClipboardList size={16} /></IconBtn>
      </div>
    </div>
  );
};
