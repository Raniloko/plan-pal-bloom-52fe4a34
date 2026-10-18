import { useEffect, useState } from "react";
import { format, addDays, subDays, isToday } from "date-fns";
import { de } from "date-fns/locale";
import {
  CalendarDays, ChevronLeft, ChevronRight,
  Users, LogOut, Repeat, MonitorSmartphone, BarChart3, Sun, Moon,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import type { AdminTheme } from "@/hooks/useAdminTheme";

interface Props {
  totalReservations: number;
  totalGuests: number;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onOpenRecurring: () => void;
  onOpenDevices?: () => void;
  onOpenStats?: () => void;
  statsActive?: boolean;
  theme?: AdminTheme;
  onToggleTheme?: () => void;
  isMobile?: boolean;
}

const IcoBtn = ({ children, onClick, active, label }: { children: React.ReactNode; onClick?: () => void; active?: boolean; label: string }) => (
  <button
    onClick={onClick}
    aria-label={label}
    title={label}
    className={cn(
      "flex h-full w-[38px] items-center justify-center border-l border-adm-border transition-colors hover:bg-adm-surface-2 hover:text-adm-text",
      active ? "bg-adm-surface-2 text-adm-text" : "text-adm-muted",
    )}
  >
    {children}
  </button>
);

export const OperationalTopbar = ({
  totalReservations, totalGuests, selectedDate, onDateChange,
  onOpenRecurring, onOpenDevices, onOpenStats, statsActive, theme, onToggleTheme, isMobile = false,
}: Props) => {
  const [time, setTime] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dateCalOpen, setDateCalOpen] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const shortDate = format(selectedDate, "EEE., d MMM", { locale: de });
  const today = isToday(selectedDate);

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setTime(`${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const navBtn = "flex h-full w-7 items-center justify-center text-adm-muted hover:text-adm-text";

  return (
    <div className={cn(
      "flex items-center border-b border-adm-border bg-adm-bg font-['DM_Sans',sans-serif] text-adm-text",
      isMobile ? "h-11 min-h-11" : "h-[52px] min-h-[52px]",
    )}>
      <div className={cn("flex h-full items-center border-r border-adm-border", isMobile ? "px-2" : "px-3")}>
        <img src="/images/rondo-logo.png" alt="Rondo" className={isMobile ? "h-[22px]" : "h-7"} />
      </div>

      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <button
            onClick={(e) => {
              if (!today) { e.preventDefault(); onDateChange(new Date()); }
            }}
            className={cn(
              "flex h-full items-center gap-1.5 border-r border-adm-border font-semibold",
              isMobile ? "px-1.5 text-[11px]" : "px-3 text-[13px]",
              today ? "text-adm-success" : "text-adm-text",
            )}
          >
            <CalendarDays size={isMobile ? 12 : 14} /> {isMobile ? "" : "Jetzt"}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" style={{ zIndex: 9999 }}>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(d) => { if (d) { onDateChange(d); setCalendarOpen(false); } }}
            locale={de}
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      <div className="flex h-full items-center border-r border-adm-border">
        <button aria-label="Vorheriger Tag" onClick={() => onDateChange(subDays(selectedDate, 1))} className={navBtn}><ChevronLeft size={14} /></button>
        <Popover open={dateCalOpen} onOpenChange={setDateCalOpen}>
          <PopoverTrigger asChild>
            <button title="Datum wählen" className={cn("h-full whitespace-nowrap px-1.5 font-semibold", isMobile ? "text-[11px]" : "text-sm")}>
              {isMobile ? format(selectedDate, "d.MM", { locale: de }) : shortDate}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center" style={{ zIndex: 9999 }}>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => { if (d) { onDateChange(d); setDateCalOpen(false); } }}
              locale={de}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        <button aria-label="Nächster Tag" onClick={() => onDateChange(addDays(selectedDate, 1))} className={navBtn}><ChevronRight size={14} /></button>
      </div>

      {!isMobile && (
        <div className="flex h-full items-center border-r border-adm-border px-3 font-mono text-sm font-bold tabular-nums">{time}</div>
      )}

      <div className="ml-auto flex h-full items-center">
        {onOpenStats && <IcoBtn label="Statistiken" onClick={onOpenStats} active={statsActive}><BarChart3 size={16} /></IcoBtn>}
        <IcoBtn label="Serienreservierung" onClick={onOpenRecurring}><Repeat size={16} /></IcoBtn>
        {onOpenDevices && <IcoBtn label="Geräte" onClick={onOpenDevices}><MonitorSmartphone size={16} /></IcoBtn>}
        {onToggleTheme && (
          <IcoBtn label={theme === "light" ? "Dunkles Design" : "Helles Design"} onClick={onToggleTheme}>
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </IcoBtn>
        )}
        {!isMobile && (
          <div className="flex h-full items-center gap-1.5 border-l border-adm-border px-3 text-[13px] text-adm-muted">
            <Users size={14} />
            <span><b className="text-adm-text">{totalReservations}</b>/{totalGuests}</span>
          </div>
        )}
        <IcoBtn label="Abmelden" onClick={async () => { await signOut(); navigate("/backstage/login", { replace: true }); }}><LogOut size={16} /></IcoBtn>
      </div>
    </div>
  );
};
