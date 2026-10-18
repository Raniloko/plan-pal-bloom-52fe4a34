import { CalendarClock, Clock, LayoutGrid, Plus, UserPlus, CalendarPlus } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type MobileTab = "list" | "map" | "wait";

interface Props {
  tab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  reservationCount: number;
  waitlistCount: number;
  onNew: () => void;
  onWalkIn: () => void;
  /** Hide the add button, e.g. while the detail panel is open */
  hideFab?: boolean;
}

const Badge = ({ n, tone }: { n: number; tone: "neutral" | "warn" }) =>
  n > 0 ? (
    <span className={cn(
      "absolute -right-2.5 -top-1.5 min-w-[18px] rounded-full px-1 text-center text-[10px] font-bold leading-[18px] text-white",
      tone === "warn" ? "bg-adm-warn" : "bg-adm-text-2",
    )}>{n}</span>
  ) : null;

/** Bottom navigation with a floating add button for phones. */
export const MobileBottomNav = ({ tab, onTabChange, reservationCount, waitlistCount, onNew, onWalkIn, hideFab }: Props) => {
  const items: { key: MobileTab; label: string; icon: React.ReactNode; badge?: React.ReactNode }[] = [
    { key: "list", label: "Reservierungen", icon: <CalendarClock size={21} />, badge: <Badge n={reservationCount} tone="neutral" /> },
    { key: "map", label: "Tische", icon: <LayoutGrid size={21} /> },
    { key: "wait", label: "Warteliste", icon: <Clock size={21} />, badge: <Badge n={waitlistCount} tone="warn" /> },
  ];

  return (
    <>
      {!hideFab && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Neu"
              className="fixed bottom-[calc(72px+env(safe-area-inset-bottom))] right-4 z-[150] flex h-14 w-14 items-center justify-center rounded-full bg-[#c9a84c] text-[#111] shadow-lg shadow-black/25 active:scale-95"
            >
              <Plus size={26} strokeWidth={2.5} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" sideOffset={10} className="w-56" style={{ zIndex: 9999 }}>
            <DropdownMenuItem onSelect={onNew} className="py-3"><CalendarPlus className="mr-2 h-4 w-4" />Neue Reservierung</DropdownMenuItem>
            <DropdownMenuItem onSelect={onWalkIn} className="py-3"><UserPlus className="mr-2 h-4 w-4" />Walk-in Gast</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <nav className="flex shrink-0 border-t border-adm-border bg-adm-surface pb-[env(safe-area-inset-bottom)] font-['DM_Sans',sans-serif]">
        {items.map(it => {
          const active = tab === it.key;
          return (
            <button
              key={it.key}
              onClick={() => onTabChange(it.key)}
              className={cn(
                "flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors",
                active ? "text-adm-text" : "text-adm-muted",
              )}
            >
              <span className={cn("relative rounded-full px-4 py-1", active && "bg-adm-gold/15 text-adm-gold")}>
                {it.icon}
                {it.badge}
              </span>
              {it.label}
            </button>
          );
        })}
      </nav>
    </>
  );
};
