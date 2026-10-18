import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { addDays, format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, CalendarCheck, Minus, UserCheck, Users, X, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import {
  areaUtilization, dailySeries, hourlyDistribution, summarizeDay, trendPct,
  type StatReservation, type StatUnit,
} from "./stats";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Selected day, yyyy-MM-dd */
  date: string;
  units: StatUnit[];
}

const hourlyConfig = { guests: { label: "Gäste", color: "hsl(var(--adm-info))" } } satisfies ChartConfig;
const dailyConfig = {
  guests: { label: "Gäste", color: "hsl(var(--adm-gold))" },
  reservations: { label: "Reservierungen", color: "hsl(var(--adm-info))" },
} satisfies ChartConfig;

const Trend = ({ value, label }: { value: number | null; label: string }) => {
  if (value === null) return <span className="text-[11px] text-adm-muted">{label}: –</span>;
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-medium",
      value > 0 ? "text-adm-success" : value < 0 ? "text-adm-danger" : "text-adm-muted")}>
      <Icon size={12} />{value > 0 ? "+" : ""}{value}% <span className="font-normal text-adm-muted">{label}</span>
    </span>
  );
};

const Kpi = ({ icon, label, value, color, trends }: {
  icon: React.ReactNode; label: string; value: React.ReactNode; color: string;
  trends?: React.ReactNode;
}) => (
  <div className="rounded-xl border border-adm-border bg-adm-surface p-3.5">
    <div className="flex items-center gap-2 text-xs text-adm-muted">
      <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg bg-adm-surface-2", color)}>{icon}</span>
      {label}
    </div>
    <div className="mt-2 text-2xl font-bold tabular-nums text-adm-text">{value}</div>
    {trends && <div className="mt-1 flex flex-col gap-0.5">{trends}</div>}
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-xl border border-adm-border bg-adm-surface p-4">
    <h3 className="mb-3 text-[13px] font-semibold text-adm-text">{title}</h3>
    {children}
  </section>
);

const Empty = ({ children }: { children: React.ReactNode }) => (
  <div className="py-6 text-center text-xs text-adm-muted">{children}</div>
);

export const StatsPanel = ({ open, onClose, date, units }: Props) => {
  const from = format(addDays(parseISO(date), -7), "yyyy-MM-dd");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-stats", from, date],
    enabled: open,
    staleTime: 30_000,
    refetchInterval: open ? 60_000 : false,
    queryFn: async () => {
      const res = await supabase.functions.invoke("admin-actions", {
        body: { action: "fetch_stats_range", from, to: date },
      });
      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(String(res.data.error));
      return res.data as { reservations: StatReservation[]; units: StatUnit[] };
    },
  });

  const stats = useMemo(() => {
    if (!data) return null;
    const byDate = (d: string) => data.reservations.filter(r => r.reservation_date === d);
    const today = byDate(date);
    const yesterday = byDate(format(addDays(parseISO(date), -1), "yyyy-MM-dd"));
    const lastWeek = byDate(from);
    const sum = summarizeDay(today);
    const prev = summarizeDay(yesterday);
    const week = summarizeDay(lastWeek);
    return {
      sum,
      guestTrend: { day: trendPct(sum.guests, prev.guests), week: trendPct(sum.guests, week.guests) },
      resTrend: { day: trendPct(sum.reservations, prev.reservations), week: trendPct(sum.reservations, week.reservations) },
      hourly: hourlyDistribution(today),
      areas: areaUtilization(today, units.length ? units : data.units),
      series: dailySeries(data.reservations, date, 7),
    };
  }, [data, date, from, units]);

  if (!open) return null;

  const dateLabel = format(parseISO(date), "EEEE, d. MMMM", { locale: de });

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[9998] bg-black/50" />
      <aside className="fixed right-0 top-[52px] z-[9999] flex h-[calc(100vh-52px)] w-full max-w-[460px] animate-slide-in-right flex-col border-l border-adm-border bg-adm-bg font-['DM_Sans',sans-serif] text-adm-text">
        <header className="flex items-center justify-between border-b border-adm-border px-5 py-4">
          <div>
            <div className="text-[15px] font-bold">Statistiken</div>
            <div className="text-xs capitalize text-adm-muted">{dateLabel}</div>
          </div>
          <button onClick={onClose} aria-label="Schließen" className="rounded-md p-1.5 text-adm-muted hover:bg-adm-surface-2 hover:text-adm-text">
            <X size={18} />
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-3 overflow-auto p-4">
          {isLoading && <Empty>Statistiken werden geladen…</Empty>}
          {isError && <Empty>Statistiken konnten nicht geladen werden.</Empty>}
          {stats && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Kpi icon={<CalendarCheck size={15} />} color="text-adm-info" label="Reservierungen" value={stats.sum.reservations}
                  trends={<><Trend value={stats.resTrend.day} label="Vortag" /><Trend value={stats.resTrend.week} label="Vorwoche" /></>} />
                <Kpi icon={<Users size={15} />} color="text-adm-gold" label="Gäste erwartet" value={stats.sum.guests}
                  trends={<><Trend value={stats.guestTrend.day} label="Vortag" /><Trend value={stats.guestTrend.week} label="Vorwoche" /></>} />
                <Kpi icon={<UserCheck size={15} />} color="text-adm-success" label="Eingecheckt"
                  value={<>{stats.sum.checkedIn}<span className="text-sm font-normal text-adm-muted"> / {stats.sum.reservations}</span></>} />
                <Kpi icon={<XCircle size={15} />} color="text-adm-danger" label="Stornoquote"
                  value={`${Math.round(stats.sum.cancelRate * 100)}%`}
                  trends={<span className="text-[11px] text-adm-muted">{stats.sum.cancelled} storniert</span>} />
              </div>

              <Section title="Status heute">
                {stats.sum.reservations + stats.sum.cancelled === 0 ? <Empty>Keine Reservierungen.</Empty> : (
                  <>
                    <div className="flex h-2.5 overflow-hidden rounded-full bg-adm-surface-2">
                      {[
                        [stats.sum.checkedIn, "bg-adm-violet"],
                        [stats.sum.confirmed, "bg-adm-info"],
                        [stats.sum.pending, "bg-adm-warn"],
                        [stats.sum.cancelled, "bg-adm-danger"],
                      ].map(([n, cls], i) => (
                        <div key={i} className={cls as string} style={{ width: `${(Number(n) / (stats.sum.reservations + stats.sum.cancelled)) * 100}%` }} />
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-adm-muted">
                      <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-adm-violet" />Eingecheckt {stats.sum.checkedIn}</span>
                      <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-adm-info" />Bestätigt {stats.sum.confirmed}</span>
                      <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-adm-warn" />Ausstehend {stats.sum.pending}</span>
                      <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-adm-danger" />Storniert {stats.sum.cancelled}</span>
                    </div>
                  </>
                )}
              </Section>

              <Section title="Gäste pro Stunde">
                {stats.hourly.length === 0 ? <Empty>Keine Reservierungen.</Empty> : (
                  <ChartContainer config={hourlyConfig} className="aspect-auto h-40 w-full">
                    <AreaChart data={stats.hourly} margin={{ left: -24, right: 4, top: 4 }}>
                      <CartesianGrid vertical={false} stroke="hsl(var(--adm-border))" />
                      <XAxis dataKey="hour" tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--adm-muted))" />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--adm-muted))" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area dataKey="guests" type="monotone" stroke="var(--color-guests)" fill="var(--color-guests)" fillOpacity={0.2} strokeWidth={2} />
                    </AreaChart>
                  </ChartContainer>
                )}
              </Section>

              <Section title="Auslastung nach Bereich">
                {stats.areas.length === 0 ? <Empty>Keine Tische vorhanden.</Empty> : (
                  <ul className="flex flex-col gap-3">
                    {stats.areas.map(a => (
                      <li key={a.area}>
                        <div className="mb-1 flex items-baseline justify-between text-xs">
                          <span className="font-medium text-adm-text">{a.label}</span>
                          <span className="tabular-nums text-adm-muted">{a.booked}/{a.total} Tische · {a.guests} Gäste · <b className="text-adm-text">{a.pct}%</b></span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-adm-surface-2">
                          <div className={cn("h-full rounded-full transition-all", a.pct >= 90 ? "bg-adm-danger" : a.pct >= 60 ? "bg-adm-warn" : "bg-adm-success")}
                            style={{ width: `${a.pct}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section title="Letzte 7 Tage">
                <ChartContainer config={dailyConfig} className="aspect-auto h-40 w-full">
                  <BarChart data={stats.series} margin={{ left: -24, right: 4, top: 4 }}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--adm-border))" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--adm-muted))" />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} stroke="hsl(var(--adm-muted))" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="guests" fill="var(--color-guests)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </Section>
            </>
          )}
        </div>
      </aside>
    </>
  );
};
