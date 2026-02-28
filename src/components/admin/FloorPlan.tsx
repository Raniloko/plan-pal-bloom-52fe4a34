import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Reservation {
  id: string;
  reservation_date: string;
  reservation_time: string;
  guest_count: number;
  zone: string;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  message: string;
  occasion: string;
}

interface FloorPlanProps {
  reservations: Reservation[];
  selectedDate: string;
  onSelectReservation?: (reservation: Reservation) => void;
}

const OCCASION_LABELS: Record<string, string> = {
  sport: "Live-Sport",
  feier: "Private Feier",
  essen: "Essen & Trinken",
  billard: "Billard / Kicker / Dart",
  sonstiges: "Sonstiges",
};

const FloorPlan = ({ reservations, selectedDate, onSelectReservation }: FloorPlanProps) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const active = useMemo(
    () => reservations.filter((r) => r.reservation_date === selectedDate && r.status !== "cancelled"),
    [reservations, selectedDate]
  );

  const byZone = (zone: string) => active.filter((r) => r.zone === zone);

  const billardRes = byZone("billard");
  const hauptRes = byZone("hauptbereich");
  const fensterRes = byZone("fenster");
  const vipRes = byZone("vip");
  const podestRes = byZone("podest");

  const tableColor = (occupied: boolean, isHovered: boolean) => ({
    fill: occupied
      ? isHovered ? "hsl(51 100% 50% / 0.35)" : "hsl(51 100% 50% / 0.2)"
      : "hsl(140 40% 25% / 0.3)",
    stroke: occupied
      ? isHovered ? "hsl(51 100% 60%)" : "hsl(51 100% 50%)"
      : "hsl(120 50% 40% / 0.6)",
  });

  const handleClick = (res: Reservation | null) => {
    if (res && onSelectReservation) onSelectReservation(res);
  };

  const zoneSummary = (zoneRes: Reservation[]) => (
    <div className="mt-4 space-y-2">
      {zoneRes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Keine Reservierungen für dieses Datum.</p>
      ) : (
        zoneRes.map((r) => (
          <div
            key={r.id}
            onClick={() => handleClick(r)}
            className="flex items-center justify-between bg-muted/50 border border-border rounded-md px-3 py-2 cursor-pointer hover:border-primary/50 transition-colors"
          >
            <div>
              <p className="text-sm font-medium">{r.customer_name}</p>
              <p className="text-xs text-muted-foreground">{r.reservation_time} · {r.guest_count} Gäste · {OCCASION_LABELS[r.occasion] || r.occasion}</p>
            </div>
            <span className="text-xs text-primary font-medium">{r.reservation_time}</span>
          </div>
        ))
      )}
    </div>
  );

  const legend = (
    <div className="flex gap-4 text-xs mb-3">
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-green-500/20 border border-green-500/50" /> Frei
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-primary/30 border border-primary" /> Reserviert
      </span>
      <span className="text-muted-foreground ml-auto">Klick auf reservierten Bereich zum Bearbeiten</span>
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h2 className="font-display text-2xl mb-4">
        Raumplan <span className="text-primary">{selectedDate}</span>
      </h2>

      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Billard", count: billardRes.length, total: 8 },
          { label: "140-Zoll", count: hauptRes.length, total: null },
          { label: "75-Zoll", count: fensterRes.length, total: null },
          { label: "VIP", count: vipRes.length > 0 ? vipRes.reduce((s, r) => s + r.guest_count, 0) : 0, total: null, suffix: vipRes.length > 0 ? "Gäste" : "" },
          { label: "Podest", count: podestRes.length > 0 ? podestRes.reduce((s, r) => s + r.guest_count, 0) : 0, total: 33, suffix: "Gäste" },
        ].map((z) => (
          <div key={z.label} className="bg-muted/50 border border-border rounded-md px-3 py-2 text-center">
            <p className="text-lg font-bold text-primary">
              {z.count}{z.total ? `/${z.total}` : ""} {z.suffix || ""}
            </p>
            <p className="text-xs text-muted-foreground">{z.label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="billard" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1">
          <TabsTrigger value="billard" className="flex-1 min-w-[120px]">🎱 Billard ({billardRes.length}/8)</TabsTrigger>
          <TabsTrigger value="hauptbereich" className="flex-1 min-w-[120px]">🖥 140-Zoll ({hauptRes.length})</TabsTrigger>
          <TabsTrigger value="fenster" className="flex-1 min-w-[120px]">📺 75-Zoll ({fensterRes.length})</TabsTrigger>
          <TabsTrigger value="vip" className="flex-1 min-w-[80px]">⭐ VIP ({vipRes.length})</TabsTrigger>
          <TabsTrigger value="podest" className="flex-1 min-w-[80px]">🔺 Podest ({podestRes.length})</TabsTrigger>
        </TabsList>

        {/* BILLARD TAB */}
        <TabsContent value="billard">
          {legend}
          <div className="overflow-x-auto">
            <svg viewBox="0 0 520 320" className="w-full max-w-[600px] h-auto mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
              <rect x="0" y="0" width="520" height="320" rx="8" fill="hsl(0 0% 5%)" />
              <text x="260" y="25" textAnchor="middle" fill="hsl(0 0% 55%)" fontSize="13" fontWeight="600" letterSpacing="2">BILLARD AREA</text>
              <text x="260" y="40" textAnchor="middle" fill="hsl(0 0% 40%)" fontSize="10">8 Olio-Billardtische · 0,23€/Min</text>

              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                const col = i % 4;
                const row = Math.floor(i / 4);
                const tx = 30 + col * 120;
                const ty = 55 + row * 135;
                const occupied = i < billardRes.length;
                const res = occupied ? billardRes[i] : null;
                const isHovered = res?.id === hoveredId;
                const tc = tableColor(occupied, isHovered);

                return (
                  <g
                    key={`b${i}`}
                    className={occupied ? "cursor-pointer" : ""}
                    onClick={() => handleClick(res)}
                    onMouseEnter={() => res && setHoveredId(res.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <rect x={tx} y={ty} width="100" height="120" rx="4" fill={tc.fill} stroke={tc.stroke} strokeWidth="1.5" />
                    <rect x={tx + 7} y={ty + 7} width="86" height="106" rx="2" fill={occupied ? "hsl(51 100% 50% / 0.06)" : "hsl(140 40% 22% / 0.5)"} />
                    {/* Pockets */}
                    {[
                      [tx + 7, ty + 7], [tx + 50, ty + 4], [tx + 93, ty + 7],
                      [tx + 7, ty + 113], [tx + 50, ty + 116], [tx + 93, ty + 113],
                    ].map(([cx, cy], pi) => (
                      <circle key={pi} cx={cx} cy={cy} r="4" fill="hsl(0 0% 8%)" stroke="hsl(0 0% 25%)" strokeWidth="0.5" />
                    ))}
                    <line x1={tx + 12} y1={ty + 60} x2={tx + 88} y2={ty + 60} stroke="hsl(0 0% 40% / 0.3)" strokeWidth="0.5" strokeDasharray="3 2" />
                    <text x={tx + 50} y={ty + 50} textAnchor="middle" fill="hsl(0 0% 70%)" fontSize="12" fontWeight="500">
                      Tisch {i + 1}
                    </text>
                    {res && (
                      <>
                        <text x={tx + 50} y={ty + 75} textAnchor="middle" fill="hsl(51 100% 50%)" fontSize="10" fontWeight="600">
                          {res.customer_name.split(" ")[0]}
                        </text>
                        <text x={tx + 50} y={ty + 90} textAnchor="middle" fill="hsl(51 100% 50% / 0.7)" fontSize="9">
                          {res.reservation_time}
                        </text>
                      </>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
          {zoneSummary(billardRes)}
        </TabsContent>

        {/* HAUPTBEREICH TAB */}
        <TabsContent value="hauptbereich">
          {legend}
          <div className="overflow-x-auto">
            <svg viewBox="0 0 520 300" className="w-full max-w-[600px] h-auto mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
              <rect x="0" y="0" width="520" height="300" rx="8" fill="hsl(0 0% 5%)" />
              <text x="260" y="25" textAnchor="middle" fill="hsl(0 0% 55%)" fontSize="13" fontWeight="600" letterSpacing="2">HAUPTBEREICH</text>

              {/* 140-Zoll Screen */}
              <rect x="60" y="45" width="400" height="16" rx="3" fill="hsl(210 80% 30% / 0.4)" stroke="hsl(210 60% 50% / 0.6)" strokeWidth="1" />
              <text x="260" y="57" textAnchor="middle" fill="hsl(210 60% 60%)" fontSize="9">🖥 140-ZOLL LED SCREEN</text>

              {/* Row 1: 4 round tables */}
              {[0, 1, 2, 3].map((i) => {
                const cx = 100 + i * 100;
                const cy = 115;
                const occupied = i < hauptRes.length;
                const res = occupied ? hauptRes[i] : null;
                const isHovered = res?.id === hoveredId;
                const tc = tableColor(occupied, isHovered);
                return (
                  <g
                    key={`h${i}`}
                    className={occupied ? "cursor-pointer" : ""}
                    onClick={() => handleClick(res)}
                    onMouseEnter={() => res && setHoveredId(res.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <circle cx={cx} cy={cy} r="30" fill={tc.fill} stroke={tc.stroke} strokeWidth="1.5" />
                    {[0, 60, 120, 180, 240, 300].map((angle, ci) => {
                      const rad = (angle * Math.PI) / 180;
                      return <circle key={ci} cx={cx + Math.cos(rad) * 40} cy={cy + Math.sin(rad) * 40} r="5" fill="hsl(0 0% 15%)" stroke="hsl(0 0% 28%)" strokeWidth="0.5" />;
                    })}
                    <text x={cx} y={cy - 5} textAnchor="middle" fill="hsl(0 0% 70%)" fontSize="11">{String.fromCharCode(65 + i)}</text>
                    <text x={cx} y={cy + 8} textAnchor="middle" fill="hsl(0 0% 45%)" fontSize="9">6 Pl.</text>
                    {res && (
                      <text x={cx} y={cy + 22} textAnchor="middle" fill="hsl(51 100% 50%)" fontSize="9" fontWeight="600">
                        {res.customer_name.split(" ")[0]}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Row 2: 3 smaller tables */}
              {[0, 1, 2].map((i) => {
                const cx = 140 + i * 120;
                const cy = 220;
                const idx = 4 + i;
                const occupied = idx < hauptRes.length;
                const res = occupied ? hauptRes[idx] : null;
                const isHovered = res?.id === hoveredId;
                const tc = tableColor(occupied, isHovered);
                return (
                  <g
                    key={`h2${i}`}
                    className={occupied ? "cursor-pointer" : ""}
                    onClick={() => handleClick(res)}
                    onMouseEnter={() => res && setHoveredId(res.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <circle cx={cx} cy={cy} r="25" fill={tc.fill} stroke={tc.stroke} strokeWidth="1.5" />
                    {[0, 90, 180, 270].map((angle, ci) => {
                      const rad = (angle * Math.PI) / 180;
                      return <circle key={ci} cx={cx + Math.cos(rad) * 33} cy={cy + Math.sin(rad) * 33} r="4.5" fill="hsl(0 0% 15%)" stroke="hsl(0 0% 28%)" strokeWidth="0.5" />;
                    })}
                    <text x={cx} y={cy + 4} textAnchor="middle" fill="hsl(0 0% 70%)" fontSize="10">{String.fromCharCode(69 + i)}</text>
                    {res && (
                      <text x={cx} y={cy + 18} textAnchor="middle" fill="hsl(51 100% 50%)" fontSize="9" fontWeight="600">
                        {res.customer_name.split(" ")[0]}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
          {zoneSummary(hauptRes)}
        </TabsContent>

        {/* FENSTER TAB */}
        <TabsContent value="fenster">
          {legend}
          <div className="overflow-x-auto">
            <svg viewBox="0 0 400 320" className="w-full max-w-[450px] h-auto mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
              <rect x="0" y="0" width="400" height="320" rx="8" fill="hsl(0 0% 5%)" />
              <text x="200" y="25" textAnchor="middle" fill="hsl(0 0% 55%)" fontSize="13" fontWeight="600" letterSpacing="2">FENSTERBEREICH</text>

              {/* 75-Zoll screens on wall */}
              <rect x="370" y="50" width="14" height="70" rx="2" fill="hsl(210 80% 30% / 0.3)" stroke="hsl(210 60% 50% / 0.4)" strokeWidth="1" />
              <rect x="370" y="180" width="14" height="70" rx="2" fill="hsl(210 80% 30% / 0.3)" stroke="hsl(210 60% 50% / 0.4)" strokeWidth="1" />

              {[0, 1, 2, 3, 4].map((i) => {
                const tx = 40;
                const ty = 45 + i * 55;
                const occupied = i < fensterRes.length;
                const res = occupied ? fensterRes[i] : null;
                const isHovered = res?.id === hoveredId;
                const tc = tableColor(occupied, isHovered);
                return (
                  <g
                    key={`f${i}`}
                    className={occupied ? "cursor-pointer" : ""}
                    onClick={() => handleClick(res)}
                    onMouseEnter={() => res && setHoveredId(res.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Window bench */}
                    <rect x={tx - 10} y={ty} width="12" height="42" rx="3" fill="hsl(0 0% 18%)" stroke="hsl(0 0% 25%)" strokeWidth="0.5" />
                    {/* Table */}
                    <rect x={tx + 15} y={ty + 3} width="120" height="36" rx="4" fill={tc.fill} stroke={tc.stroke} strokeWidth="1.5" />
                    {/* Chairs opposite */}
                    {[0, 1].map((ci) => (
                      <rect key={ci} x={tx + 145} y={ty + 5 + ci * 20} width="14" height="15" rx="3" fill="hsl(0 0% 15%)" stroke="hsl(0 0% 28%)" strokeWidth="0.5" />
                    ))}
                    <text x={tx + 75} y={ty + 18} textAnchor="middle" fill="hsl(0 0% 70%)" fontSize="11">F{i + 1}</text>
                    <text x={tx + 75} y={ty + 32} textAnchor="middle" fill="hsl(0 0% 45%)" fontSize="9">4 Plätze</text>
                    {res && (
                      <text x={tx + 200} y={ty + 25} textAnchor="start" fill="hsl(51 100% 50%)" fontSize="10" fontWeight="600">
                        {res.customer_name.split(" ")[0]} · {res.reservation_time}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
          {zoneSummary(fensterRes)}
        </TabsContent>

        {/* VIP TAB */}
        <TabsContent value="vip">
          {legend}
          <div className="overflow-x-auto">
            <svg viewBox="0 0 400 250" className="w-full max-w-[450px] h-auto mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
              <rect x="0" y="0" width="400" height="250" rx="8" fill="hsl(0 0% 5%)" />
              <text x="200" y="25" textAnchor="middle" fill="hsl(0 0% 55%)" fontSize="13" fontWeight="600" letterSpacing="2">VIP RAUM</text>
              <text x="200" y="42" textAnchor="middle" fill="hsl(0 0% 40%)" fontSize="10">Privater Bereich · Ab 11 Personen</text>

              {/* Door */}
              <rect x="340" y="0" width="40" height="8" rx="2" fill="hsl(0 0% 15%)" stroke="hsl(0 0% 35%)" strokeWidth="1" />
              <text x="360" y="20" textAnchor="middle" fill="hsl(0 0% 35%)" fontSize="8">Tür</text>

              {/* U-shaped sofa */}
              <path d="M 60,70 L 60,200 L 340,200 L 340,70" fill="none" stroke={vipRes.length > 0 ? "hsl(51 100% 50% / 0.5)" : "hsl(0 0% 25%)"} strokeWidth="12" strokeLinecap="round" />

              {/* Large table */}
              <rect
                x="110" y="95" width="180" height="80" rx="6"
                fill={vipRes.length > 0 ? "hsl(51 100% 50% / 0.12)" : "hsl(0 0% 12%)"}
                stroke={vipRes.length > 0 ? "hsl(51 100% 50% / 0.5)" : "hsl(0 0% 30%)"}
                strokeWidth="1.5"
                className={vipRes.length > 0 ? "cursor-pointer" : ""}
                onClick={() => vipRes.length > 0 && handleClick(vipRes[0])}
              />
              <text x="200" y="130" textAnchor="middle" fill="hsl(0 0% 50%)" fontSize="11">Großer Tisch</text>
              {vipRes.length > 0 && (
                <>
                  <text x="200" y="148" textAnchor="middle" fill="hsl(51 100% 50%)" fontSize="11" fontWeight="600">
                    {vipRes.map((r) => r.customer_name.split(" ")[0]).join(", ")}
                  </text>
                  <text x="200" y="165" textAnchor="middle" fill="hsl(51 100% 50% / 0.7)" fontSize="10">
                    {vipRes.reduce((s, r) => s + r.guest_count, 0)} Gäste
                  </text>
                </>
              )}
            </svg>
          </div>
          {zoneSummary(vipRes)}
        </TabsContent>

        {/* PODEST TAB */}
        <TabsContent value="podest">
          {legend}
          <div className="overflow-x-auto">
            <svg viewBox="0 0 500 280" className="w-full max-w-[550px] h-auto mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
              <rect x="0" y="0" width="500" height="280" rx="8" fill="hsl(0 0% 5%)" />
              {/* Elevated border */}
              <rect x="5" y="5" width="490" height="270" rx="6" fill="none" stroke="hsl(0 0% 18%)" strokeWidth="1" strokeDasharray="4 2" />
              <text x="250" y="28" textAnchor="middle" fill="hsl(0 0% 55%)" fontSize="13" fontWeight="600" letterSpacing="2">PODEST</text>
              <text x="250" y="45" textAnchor="middle" fill="hsl(0 0% 40%)" fontSize="10">Erhöhter Bereich · Bis zu 33 Gäste</text>

              {/* Row 1: 3 tables */}
              {[0, 1, 2].map((i) => {
                const cx = 100 + i * 150;
                const cy = 110;
                const occupied = podestRes.length > 0;
                const tc = tableColor(occupied, false);
                return (
                  <g
                    key={`p1${i}`}
                    className={occupied ? "cursor-pointer" : ""}
                    onClick={() => occupied && handleClick(podestRes[0])}
                  >
                    <circle cx={cx} cy={cy} r="28" fill={tc.fill} stroke={tc.stroke} strokeWidth="1.5" />
                    {[0, 72, 144, 216, 288].map((angle, ci) => {
                      const rad = (angle * Math.PI) / 180;
                      return <circle key={ci} cx={cx + Math.cos(rad) * 38} cy={cy + Math.sin(rad) * 38} r="5" fill="hsl(0 0% 15%)" stroke="hsl(0 0% 25%)" strokeWidth="0.5" />;
                    })}
                    <text x={cx} y={cy + 4} textAnchor="middle" fill="hsl(0 0% 60%)" fontSize="10">P{i + 1}</text>
                  </g>
                );
              })}

              {/* Row 2: 2 tables */}
              {[0, 1].map((i) => {
                const cx = 175 + i * 150;
                const cy = 210;
                const occupied = podestRes.length > 0;
                const tc = tableColor(occupied, false);
                return (
                  <g
                    key={`p2${i}`}
                    className={occupied ? "cursor-pointer" : ""}
                    onClick={() => occupied && handleClick(podestRes[0])}
                  >
                    <circle cx={cx} cy={cy} r="28" fill={tc.fill} stroke={tc.stroke} strokeWidth="1.5" />
                    {[0, 72, 144, 216, 288].map((angle, ci) => {
                      const rad = (angle * Math.PI) / 180;
                      return <circle key={ci} cx={cx + Math.cos(rad) * 38} cy={cy + Math.sin(rad) * 38} r="5" fill="hsl(0 0% 15%)" stroke="hsl(0 0% 25%)" strokeWidth="0.5" />;
                    })}
                    <text x={cx} y={cy + 4} textAnchor="middle" fill="hsl(0 0% 60%)" fontSize="10">P{i + 4}</text>
                  </g>
                );
              })}

              {podestRes.length > 0 && podestRes.map((r, i) => (
                <text key={r.id} x="250" y={60 + i * 14} textAnchor="middle" fill="hsl(51 100% 50%)" fontSize="10" fontWeight="600">
                  {r.customer_name.split(" ")[0]} · {r.guest_count} Gäste · {r.reservation_time}
                </text>
              ))}
            </svg>
          </div>
          {zoneSummary(podestRes)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FloorPlan;
