import { useEffect, useState } from "react";
import { format, addDays, subDays, isToday } from "date-fns";
import { de } from "date-fns/locale";
import {
  CalendarDays, ChevronLeft, ChevronRight,
  Users, LogOut, Repeat, MonitorSmartphone, BarChart3, Search, MoreVertical, Lock,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import type { LiveStatus } from "@/hooks/useAdminLiveSync";

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
  onOpenPalette?: () => void;
  liveStatus?: LiveStatus;
  lastLoadedAt?: Date | null;
  /** Mobile only: opens the day/area block form */
  onOpenBlocks?: () => void;
  isMobile?: boolean;
}

const LIVE_LABEL: Record<LiveStatus, string> = {
  live: "Live",
  connecting: "Verbinde…",
  polling: "Auto-Update",
  offline: "Offline",
};

const LiveBadge = ({ status, lastLoadedAt, compact }: { status: LiveStatus; lastLoadedAt?: Date | null; compact: boolean }) => (
  <div
    className="flex h-full items-center gap-1.5 border-l border-adm-border px-3 text-xs text-adm-muted"
    title={lastLoadedAt ? `Zuletzt aktualisiert ${format(lastLoadedAt, "HH:mm:ss")}` : undefined}
  >
    <span className="relative flex h-2 w-2">
      {status === "live" && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-adm-success opacity-60" />}
      <span className={cn("relative inline-flex h-2 w-2 rounded-full",
        status === "live" ? "bg-adm-success" : status === "offline" ? "bg-adm-danger" : status === "polling" ? "bg-adm-info" : "bg-adm-warn")} />
    </span>
    {!compact && LIVE_LABEL[status]}
  </div>
);

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
  onOpenRecurring, onOpenDevices, onOpenStats, statsActive,
  onOpenPalette, liveStatus, lastLoadedAt, onOpenBlocks, isMobile = false,
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
  const logout = async () => { await signOut(); navigate("/backstage/login", { replace: true }); };

  if (isMobile) {
    const mobileNav = "flex h-10 w-10 items-center justify-center rounded-full text-adm-muted active:bg-adm-surface-2";
    return (
      <div className="flex h-14 min-h-14 items-center gap-1 border-b border-adm-border bg-adm-surface px-2 font-['DM_Sans',sans-serif] text-adm-text">
        <img src="/images/rondo-logo.png" alt="Rondo" className="h-6 shrink-0" />

        <div className="flex flex-1 items-center justify-center">
          <button aria-label="Vorheriger Tag" onClick={() => onDateChange(subDays(selectedDate, 1))} className={mobileNav}><ChevronLeft size={18} /></button>
          <Popover open={dateCalOpen} onOpenChange={setDateCalOpen}>
            <PopoverTrigger asChild>
              <button className="flex min-w-[96px] flex-col items-center leading-tight" title="Datum wählen">
                <span className={cn("text-[10px] font-semibold uppercase tracking-wide", today ? "text-adm-success" : "text-adm-muted")}>
                  {today ? "Heute" : format(selectedDate, "EEEE", { locale: de })}
                </span>
                <span className="text-[15px] font-bold">{format(selectedDate, "d. MMM", { locale: de })}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center" style={{ zIndex: 9999 }}>
              {!today && (
                <button onClick={() => { onDateChange(new Date()); setDateCalOpen(false); }}
                  className="w-full border-b px-3 py-2 text-left text-sm font-semibold text-adm-success">
                  Zu heute springen
                </button>
              )}
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => { if (d) { onDateChange(d); setDateCalOpen(false); } }}
                locale={de}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <button aria-label="Nächster Tag" onClick={() => onDateChange(addDays(selectedDate, 1))} className={mobileNav}><ChevronRight size={18} /></button>
        </div>

        {liveStatus && (
          <span title={LIVE_LABEL[liveStatus]} className={cn("mx-1 h-2 w-2 shrink-0 rounded-full",
            liveStatus === "live" ? "bg-adm-success" : liveStatus === "offline" ? "bg-adm-danger" : liveStatus === "polling" ? "bg-adm-info" : "bg-adm-warn")} />
        )}
        {onOpenPalette && <button aria-label="Suchen" onClick={onOpenPalette} className={mobileNav}><Search size={19} /></button>}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button aria-label="Menü" className={mobileNav}><MoreVertical size={19} /></button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" style={{ zIndex: 9999 }}>
            {onOpenStats && <DropdownMenuItem onSelect={onOpenStats}><BarChart3 className="mr-2 h-4 w-4" />Statistiken</DropdownMenuItem>}
            <DropdownMenuItem onSelect={onOpenRecurring}><Repeat className="mr-2 h-4 w-4" />Serienreservierung</DropdownMenuItem>
            {onOpenBlocks && <DropdownMenuItem onSelect={onOpenBlocks}><Lock className="mr-2 h-4 w-4" />Tag / Bereich sperren</DropdownMenuItem>}
            {onOpenDevices && <DropdownMenuItem onSelect={onOpenDevices}><MonitorSmartphone className="mr-2 h-4 w-4" />Geräte</DropdownMenuItem>}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={logout} className="text-adm-danger"><LogOut className="mr-2 h-4 w-4" />Abmelden</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

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

      {onOpenPalette && !isMobile && (
        <button
          onClick={onOpenPalette}
          className="ml-3 flex h-8 w-56 items-center gap-2 rounded-md border border-adm-border bg-adm-surface px-2.5 text-xs text-adm-muted transition-colors hover:text-adm-text"
        >
          <Search size={13} />
          Suchen oder Befehl…
          <kbd className="ml-auto rounded border border-adm-border bg-adm-surface-2 px-1.5 font-mono text-[10px]">
            {/Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘K" : "Strg K"}
          </kbd>
        </button>
      )}

      <div className="ml-auto flex h-full items-center">
        {liveStatus && <LiveBadge status={liveStatus} lastLoadedAt={lastLoadedAt} compact={isMobile} />}
        {onOpenPalette && isMobile && <IcoBtn label="Suchen" onClick={onOpenPalette}><Search size={16} /></IcoBtn>}
        {onOpenStats && <IcoBtn label="Statistiken" onClick={onOpenStats} active={statsActive}><BarChart3 size={16} /></IcoBtn>}
        <IcoBtn label="Serienreservierung" onClick={onOpenRecurring}><Repeat size={16} /></IcoBtn>
        {onOpenDevices && <IcoBtn label="Geräte" onClick={onOpenDevices}><MonitorSmartphone size={16} /></IcoBtn>}
        {!isMobile && (
          <div className="flex h-full items-center gap-1.5 border-l border-adm-border px-3 text-[13px] text-adm-muted">
            <Users size={14} />
            <span><b className="text-adm-text">{totalReservations}</b>/{totalGuests}</span>
          </div>
        )}
        <IcoBtn label="Abmelden" onClick={logout}><LogOut size={16} /></IcoBtn>
      </div>
    </div>
  );
};
