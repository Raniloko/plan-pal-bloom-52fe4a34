import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateLong, parseIsoDate, zoneLabel, type GuestReservation } from "@/lib/guestReservation";
import { Users, MapPin } from "lucide-react";

/** Page frame for the change / cancel pages, matching the booking page. */
export const ManageShell = ({ children, reference }: { children: ReactNode; reference?: string | null }) => (
  <main className="pt-20 md:pt-24">
    <section className="px-4 py-8 md:py-16">
      <div className="mx-auto w-full max-w-lg">
        <div className="rounded-xl border border-border bg-card p-5 sm:p-8">{children}</div>
        {reference && (
          <p className="mt-4 text-center text-xs tracking-wider text-muted-foreground">
            Buchungsnummer {reference.slice(0, 8).toUpperCase()}
          </p>
        )}
      </div>
    </section>
  </main>
);

const TONES = {
  success: { icon: CheckCircle2, cls: "bg-emerald-500/15 text-emerald-400" },
  danger: { icon: XCircle, cls: "bg-red-500/15 text-red-400" },
  warn: { icon: AlertTriangle, cls: "bg-primary/15 text-primary" },
  info: { icon: Info, cls: "bg-sky-500/15 text-sky-400" },
} as const;

export const StatusHeader = ({ tone, title, children }: { tone: keyof typeof TONES; title: string; children?: ReactNode }) => {
  const { icon: Icon, cls } = TONES[tone];
  return (
    <div className="text-center">
      <div className={cn("mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full", cls)}>
        <Icon size={28} />
      </div>
      <h1 className="font-display text-3xl sm:text-4xl">{title}</h1>
      {children && <div className="mt-3 text-sm leading-relaxed text-muted-foreground">{children}</div>}
    </div>
  );
};

export const LoadingState = () => (
  <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
    <Loader2 className="animate-spin text-primary" size={28} />
    <span className="text-sm">Reservierung wird geladen…</span>
  </div>
);

/** Ticket-style summary like in the confirmation email. */
export const ReservationTicket = ({ r, label, struck }: {
  r: Pick<GuestReservation, "reservation_date" | "reservation_time" | "guest_count" | "zone">;
  label?: string;
  struck?: boolean;
}) => {
  const d = parseIsoDate(r.reservation_date);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-muted/40">
      {label && <div className="border-b border-border px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>}
      <div className={cn("flex items-stretch", struck && "opacity-50 line-through")}>
        <div className="flex w-20 shrink-0 flex-col items-center justify-center bg-background py-3">
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
            {d.toLocaleDateString("de-DE", { weekday: "short" }).replace(".", "")}
          </span>
          <span className="text-3xl font-extrabold leading-none">{d.getDate()}</span>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {d.toLocaleDateString("de-DE", { month: "short" }).replace(".", "")}
          </span>
        </div>
        <div className="min-w-0 flex-1 px-4 py-3">
          <div className="text-xs text-muted-foreground">{formatDateLong(r.reservation_date)}</div>
          <div className="text-2xl font-extrabold">{r.reservation_time.slice(0, 5)} Uhr</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Users size={14} />{r.guest_count} {r.guest_count === 1 ? "Person" : "Personen"}</span>
            <span className="inline-flex items-center gap-1"><MapPin size={14} />{zoneLabel(r.zone)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
