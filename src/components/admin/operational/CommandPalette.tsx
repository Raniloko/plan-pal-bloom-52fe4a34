import type { ReactNode } from "react";
import { Clock, Users } from "lucide-react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut,
} from "@/components/ui/command";
import type { ResRow } from "./ReservationPanel";

export interface PaletteAction {
  id: string;
  label: string;
  group: string;
  icon?: ReactNode;
  shortcut?: string;
  /** Extra search terms */
  keywords?: string[];
  run: () => void;
}

export interface PaletteWaitlistEntry {
  id: string;
  guest_name: string;
  guest_phone: string;
  desired_date: string;
  desired_time: string;
}

interface Props<W extends PaletteWaitlistEntry> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: ResRow[];
  waitlist: W[];
  actions: PaletteAction[];
  onSelectRow: (row: ResRow) => void;
  onSelectWaitlist: (entry: W) => void;
}

const STATUS_LABEL: Record<ResRow["status"], string> = {
  confirmed: "Bestätigt",
  pending: "Ausstehend",
  checked_in: "Platziert",
  checked_out: "Ausgecheckt",
  cancelled: "Storniert",
};

// Calmer selection than the global gold accent, with a gold marker on the left.
const itemClass = "gap-2 border-l-2 border-transparent data-[selected=true]:border-adm-gold data-[selected=true]:bg-adm-surface-2 data-[selected=true]:text-adm-text";

export const CommandPalette = <W extends PaletteWaitlistEntry>({
  open, onOpenChange, rows, waitlist, actions, onSelectRow, onSelectWaitlist,
}: Props<W>) => {
  const run = (fn: () => void) => { onOpenChange(false); fn(); };
  const groups = [...new Set(actions.map(a => a.group))];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Gast, Tisch, Uhrzeit oder Aktion suchen…" />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>Nichts gefunden.</CommandEmpty>

        {rows.length > 0 && (
          <CommandGroup heading="Reservierungen">
            {rows.map(r => (
              <CommandItem
                className={itemClass}
                key={r.id}
                value={`res-${r.id} ${r.name} ${r.time} ${r.tableRef} ${STATUS_LABEL[r.status]}`}
                onSelect={() => run(() => onSelectRow(r))}
              >
                <span className="w-12 font-mono text-xs tabular-nums text-muted-foreground">{r.time}</span>
                <span className={r.status === "cancelled" ? "line-through opacity-60" : ""}>{r.name}</span>
                <span className="ml-2 truncate text-xs text-muted-foreground">{r.tableRef}</span>
                <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="!h-3 !w-3" />{r.guests} · {STATUS_LABEL[r.status]}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {waitlist.length > 0 && (
          <CommandGroup heading="Warteliste">
            {waitlist.map(w => (
              <CommandItem
                className={itemClass}
                key={w.id}
                value={`wait-${w.id} ${w.guest_name} ${w.guest_phone} ${w.desired_time}`}
                onSelect={() => run(() => onSelectWaitlist(w))}
              >
                <Clock />
                <span>{w.guest_name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{w.desired_date} · {w.desired_time?.slice(0, 5)}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {groups.map(g => (
          <div key={g}>
            <CommandSeparator />
            <CommandGroup heading={g}>
              {actions.filter(a => a.group === g).map(a => (
                <CommandItem key={a.id} className={itemClass} value={`${a.label} ${(a.keywords || []).join(" ")}`} onSelect={() => run(a.run)}>
                  {a.icon}
                  <span>{a.label}</span>
                  {a.shortcut && <CommandShortcut>{a.shortcut}</CommandShortcut>}
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
};
