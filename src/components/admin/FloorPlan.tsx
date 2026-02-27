import { useMemo } from "react";

interface Reservation {
  id: string;
  reservation_date: string;
  reservation_time: string;
  guest_count: number;
  zone: string;
  status: string;
  customer_name: string;
}

interface FloorPlanProps {
  reservations: Reservation[];
  selectedDate: string;
}

const FloorPlan = ({ reservations, selectedDate }: FloorPlanProps) => {
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

  const zoneColor = (occupied: boolean) => ({
    fill: occupied ? "hsl(51 100% 50% / 0.15)" : "hsl(120 50% 40% / 0.08)",
    stroke: occupied ? "hsl(51 100% 50%)" : "hsl(120 50% 40% / 0.5)",
  });

  const tableColor = (occupied: boolean) => ({
    fill: occupied ? "hsl(51 100% 50% / 0.2)" : "hsl(140 40% 25% / 0.3)",
    stroke: occupied ? "hsl(51 100% 50%)" : "hsl(120 50% 40% / 0.6)",
  });

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl">
          Raumplan <span className="text-primary">{selectedDate}</span>
        </h2>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-green-500/20 border border-green-500/50" /> Frei
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-primary/30 border border-primary" /> Reserviert
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox="0 0 1000 600" className="w-full min-w-[700px] h-auto" style={{ fontFamily: "Inter, sans-serif" }}>
          {/* Background - venue outline */}
          <rect x="0" y="0" width="1000" height="600" rx="12" fill="hsl(0 0% 5%)" />
          {/* Venue walls */}
          <rect x="10" y="10" width="980" height="580" rx="8" fill="none" stroke="hsl(0 0% 20%)" strokeWidth="2" />

          {/* ===== ENTRANCE ===== */}
          <rect x="440" y="575" width="120" height="20" rx="2" fill="hsl(0 0% 12%)" stroke="hsl(0 0% 30%)" strokeWidth="1" />
          <text x="500" y="590" textAnchor="middle" fill="hsl(0 0% 45%)" fontSize="10">EINGANG</text>

          {/* ===== BILLARD AREA (left side) ===== */}
          <rect x="20" y="20" width="420" height="340" rx="6" {...zoneColor(billardRes.length > 0)} strokeWidth="1.5" strokeDasharray="6 3" />
          <text x="230" y="45" textAnchor="middle" fill="hsl(0 0% 55%)" fontSize="12" fontWeight="600" letterSpacing="2">BILLARD AREA</text>
          <text x="230" y="60" textAnchor="middle" fill="hsl(0 0% 40%)" fontSize="9">8 Olio-Billardtische · 0,23€/Min</text>

          {/* Billiard tables - 2 rows of 4, bird's eye rectangle with pockets */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const col = i % 4;
            const row = Math.floor(i / 4);
            const tx = 50 + col * 100;
            const ty = 85 + row * 140;
            const occupied = i < billardRes.length;
            const res = occupied ? billardRes[i] : null;
            const tc = tableColor(occupied);

            return (
              <g key={`b${i}`}>
                {/* Table body */}
                <rect x={tx} y={ty} width="80" height="110" rx="3" fill={tc.fill} stroke={tc.stroke} strokeWidth="1.5" />
                {/* Felt */}
                <rect x={tx + 6} y={ty + 6} width="68" height="98" rx="2" fill={occupied ? "hsl(51 100% 50% / 0.06)" : "hsl(140 40% 22% / 0.5)"} />
                {/* Pockets - 6 circles */}
                {[
                  [tx + 6, ty + 6], [tx + 40, ty + 4], [tx + 74, ty + 6],
                  [tx + 6, ty + 104], [tx + 40, ty + 106], [tx + 74, ty + 104],
                ].map(([cx, cy], pi) => (
                  <circle key={pi} cx={cx} cy={cy} r="3" fill="hsl(0 0% 8%)" stroke="hsl(0 0% 25%)" strokeWidth="0.5" />
                ))}
                {/* Center line */}
                <line x1={tx + 10} y1={ty + 55} x2={tx + 70} y2={ty + 55} stroke="hsl(0 0% 40% / 0.3)" strokeWidth="0.5" strokeDasharray="3 2" />
                {/* Label */}
                <text x={tx + 40} y={ty + 48} textAnchor="middle" fill="hsl(0 0% 70%)" fontSize="10" fontWeight="500">
                  Tisch {i + 1}
                </text>
                {res && (
                  <text x={tx + 40} y={ty + 68} textAnchor="middle" fill="hsl(51 100% 50%)" fontSize="9" fontWeight="600">
                    {res.customer_name.split(" ")[0]}
                  </text>
                )}
              </g>
            );
          })}

          {/* ===== RESTAURANT 140-ZOLL SCREEN (top right) ===== */}
          <rect x="460" y="20" width="280" height="180" rx="6" {...zoneColor(hauptRes.length > 0)} strokeWidth="1.5" strokeDasharray="6 3" />
          <text x="600" y="42" textAnchor="middle" fill="hsl(0 0% 55%)" fontSize="11" fontWeight="600" letterSpacing="1.5">HAUPTBEREICH</text>
          <text x="600" y="56" textAnchor="middle" fill="hsl(0 0% 40%)" fontSize="9">Restaurantbereich am 140-Zoll Screen</text>

          {/* 140-Zoll Screen */}
          <rect x="470" y="65" width="260" height="12" rx="2" fill="hsl(210 80% 30% / 0.4)" stroke="hsl(210 60% 50% / 0.6)" strokeWidth="1" />
          <text x="600" y="74" textAnchor="middle" fill="hsl(210 60% 60%)" fontSize="7">🖥 140-ZOLL LED SCREEN</text>

          {/* Dining tables in front of screen - round tables */}
          {[0, 1, 2, 3].map((i) => {
            const cx = 505 + i * 60;
            const cy = 115;
            const occupied = i < hauptRes.length;
            const res = occupied ? hauptRes[i] : null;
            const tc = tableColor(occupied);
            return (
              <g key={`h${i}`}>
                <circle cx={cx} cy={cy} r="22" fill={tc.fill} stroke={tc.stroke} strokeWidth="1.5" />
                {/* Chairs around table */}
                {[0, 60, 120, 180, 240, 300].map((angle, ci) => {
                  const rad = (angle * Math.PI) / 180;
                  const sx = cx + Math.cos(rad) * 30;
                  const sy = cy + Math.sin(rad) * 30;
                  return <circle key={ci} cx={sx} cy={sy} r="4" fill="hsl(0 0% 15%)" stroke="hsl(0 0% 28%)" strokeWidth="0.5" />;
                })}
                <text x={cx} y={cy - 2} textAnchor="middle" fill="hsl(0 0% 70%)" fontSize="8">{String.fromCharCode(65 + i)}</text>
                <text x={cx} y={cy + 8} textAnchor="middle" fill="hsl(0 0% 45%)" fontSize="7">6 Pl.</text>
                {res && (
                  <text x={cx} y={cy + 18} textAnchor="middle" fill="hsl(51 100% 50%)" fontSize="7" fontWeight="600">
                    {res.customer_name.split(" ")[0]}
                  </text>
                )}
              </g>
            );
          })}

          {/* Second row */}
          {[0, 1, 2].map((i) => {
            const cx = 530 + i * 70;
            const cy = 170;
            const idx = 4 + i;
            const occupied = idx < hauptRes.length;
            const res = occupied ? hauptRes[idx] : null;
            const tc = tableColor(occupied);
            return (
              <g key={`h2${i}`}>
                <circle cx={cx} cy={cy} r="18" fill={tc.fill} stroke={tc.stroke} strokeWidth="1.5" />
                {[0, 90, 180, 270].map((angle, ci) => {
                  const rad = (angle * Math.PI) / 180;
                  const sx = cx + Math.cos(rad) * 25;
                  const sy = cy + Math.sin(rad) * 25;
                  return <circle key={ci} cx={sx} cy={sy} r="3.5" fill="hsl(0 0% 15%)" stroke="hsl(0 0% 28%)" strokeWidth="0.5" />;
                })}
                <text x={cx} y={cy + 3} textAnchor="middle" fill="hsl(0 0% 70%)" fontSize="8">{String.fromCharCode(69 + i)}</text>
                {res && (
                  <text x={cx} y={cy + 14} textAnchor="middle" fill="hsl(51 100% 50%)" fontSize="7" fontWeight="600">
                    {res.customer_name.split(" ")[0]}
                  </text>
                )}
              </g>
            );
          })}

          {/* ===== FENSTERBEREICH (right side) ===== */}
          <rect x="760" y="20" width="220" height="280" rx="6" {...zoneColor(fensterRes.length > 0)} strokeWidth="1.5" strokeDasharray="6 3" />
          <text x="870" y="42" textAnchor="middle" fill="hsl(0 0% 55%)" fontSize="11" fontWeight="600" letterSpacing="1.5">FENSTERBEREICH</text>
          <text x="870" y="56" textAnchor="middle" fill="hsl(0 0% 40%)" fontSize="9">Restaurantbereich am 75-Zoll Screen</text>

          {/* 75-Zoll screens on wall */}
          <rect x="965" y="70" width="10" height="60" rx="1" fill="hsl(210 80% 30% / 0.3)" stroke="hsl(210 60% 50% / 0.4)" strokeWidth="0.5" />
          <rect x="965" y="180" width="10" height="60" rx="1" fill="hsl(210 80% 30% / 0.3)" stroke="hsl(210 60% 50% / 0.4)" strokeWidth="0.5" />

          {/* Window tables - booths along window */}
          {[0, 1, 2, 3, 4].map((i) => {
            const tx = 775;
            const ty = 68 + i * 45;
            const occupied = i < fensterRes.length;
            const res = occupied ? fensterRes[i] : null;
            const tc = tableColor(occupied);
            return (
              <g key={`f${i}`}>
                {/* Window bench */}
                <rect x={tx - 5} y={ty} width="8" height="35" rx="2" fill="hsl(0 0% 18%)" stroke="hsl(0 0% 25%)" strokeWidth="0.5" />
                {/* Table */}
                <rect x={tx + 10} y={ty + 4} width="55" height="27" rx="3" fill={tc.fill} stroke={tc.stroke} strokeWidth="1.5" />
                {/* Chairs opposite */}
                {[0, 1].map((ci) => (
                  <rect key={ci} x={tx + 72} y={ty + 5 + ci * 15} width="10" height="12" rx="2" fill="hsl(0 0% 15%)" stroke="hsl(0 0% 28%)" strokeWidth="0.5" />
                ))}
                <text x={tx + 37} y={ty + 15} textAnchor="middle" fill="hsl(0 0% 70%)" fontSize="8">F{i + 1}</text>
                <text x={tx + 37} y={ty + 25} textAnchor="middle" fill="hsl(0 0% 45%)" fontSize="7">4 Pl.</text>
                {res && (
                  <text x={tx + 95} y={ty + 20} textAnchor="start" fill="hsl(51 100% 50%)" fontSize="8" fontWeight="600">
                    {res.customer_name.split(" ")[0]}
                  </text>
                )}
              </g>
            );
          })}

          {/* ===== VIP RAUM (bottom left) ===== */}
          <rect x="20" y="380" width="300" height="190" rx="6" {...zoneColor(vipRes.length > 0)} strokeWidth="1.5" strokeDasharray="6 3" />
          {/* Door */}
          <rect x="280" y="378" width="30" height="6" rx="1" fill="hsl(0 0% 15%)" stroke="hsl(0 0% 35%)" strokeWidth="0.5" />
          <text x="170" y="402" textAnchor="middle" fill="hsl(0 0% 55%)" fontSize="12" fontWeight="600" letterSpacing="2">VIP RAUM</text>
          <text x="170" y="416" textAnchor="middle" fill="hsl(0 0% 40%)" fontSize="9">Privater Bereich für Gruppen</text>

          {/* VIP interior - U-shaped sofa + table */}
          <path d="M 60,440 L 60,540 L 280,540 L 280,440" fill="none" stroke="hsl(0 0% 25%)" strokeWidth="8" strokeLinecap="round" />
          <rect x="100" y="460" width="140" height="60" rx="4" fill={vipRes.length > 0 ? "hsl(51 100% 50% / 0.12)" : "hsl(0 0% 12%)"} stroke="hsl(0 0% 30%)" strokeWidth="1" />
          <text x="170" y="488" textAnchor="middle" fill="hsl(0 0% 50%)" fontSize="9">Großer Tisch</text>
          {vipRes.length > 0 && (
            <>
              <text x="170" y="503" textAnchor="middle" fill="hsl(51 100% 50%)" fontSize="9" fontWeight="600">
                {vipRes.map((r) => r.customer_name.split(" ")[0]).join(", ")}
              </text>
              <text x="170" y="516" textAnchor="middle" fill="hsl(51 100% 50% / 0.7)" fontSize="8">
                {vipRes.reduce((s, r) => s + r.guest_count, 0)} Gäste
              </text>
            </>
          )}

          {/* ===== PODEST (bottom center) ===== */}
          <rect x="340" y="380" width="300" height="190" rx="6" {...zoneColor(podestRes.length > 0)} strokeWidth="1.5" strokeDasharray="6 3" />
          {/* Elevated platform indicator */}
          <rect x="345" y="385" width="290" height="180" rx="4" fill="none" stroke="hsl(0 0% 18%)" strokeWidth="1" strokeDasharray="2 2" />
          <text x="490" y="403" textAnchor="middle" fill="hsl(0 0% 55%)" fontSize="12" fontWeight="600" letterSpacing="2">PODEST</text>
          <text x="490" y="417" textAnchor="middle" fill="hsl(0 0% 40%)" fontSize="9">Erhöht · Bis zu 33 Gäste</text>

          {/* Podest tables */}
          {[0, 1, 2].map((i) => {
            const cx = 400 + i * 90;
            const cy = 465;
            return (
              <g key={`p1${i}`}>
                <circle cx={cx} cy={cy} r="20" fill={podestRes.length > 0 ? "hsl(51 100% 50% / 0.1)" : "hsl(0 0% 12%)"} stroke="hsl(0 0% 30%)" strokeWidth="1" />
                {[0, 90, 180, 270].map((angle, ci) => {
                  const rad = (angle * Math.PI) / 180;
                  return <circle key={ci} cx={cx + Math.cos(rad) * 27} cy={cy + Math.sin(rad) * 27} r="3.5" fill="hsl(0 0% 15%)" stroke="hsl(0 0% 25%)" strokeWidth="0.5" />;
                })}
              </g>
            );
          })}
          {[0, 1].map((i) => {
            const cx = 440 + i * 100;
            const cy = 530;
            return (
              <g key={`p2${i}`}>
                <circle cx={cx} cy={cy} r="20" fill={podestRes.length > 0 ? "hsl(51 100% 50% / 0.1)" : "hsl(0 0% 12%)"} stroke="hsl(0 0% 30%)" strokeWidth="1" />
                {[0, 90, 180, 270].map((angle, ci) => {
                  const rad = (angle * Math.PI) / 180;
                  return <circle key={ci} cx={cx + Math.cos(rad) * 27} cy={cy + Math.sin(rad) * 27} r="3.5" fill="hsl(0 0% 15%)" stroke="hsl(0 0% 25%)" strokeWidth="0.5" />;
                })}
              </g>
            );
          })}
          {podestRes.length > 0 && podestRes.map((r, i) => (
            <text key={r.id} x="490" y={440 + i * 14} textAnchor="middle" fill="hsl(51 100% 50%)" fontSize="9" fontWeight="600">
              {r.customer_name.split(" ")[0]} ({r.guest_count} Gäste)
            </text>
          ))}

          {/* ===== KICKER & DART (bottom right) ===== */}
          <rect x="660" y="320" width="320" height="250" rx="6" fill="hsl(0 0% 7%)" stroke="hsl(0 0% 20%)" strokeWidth="1" strokeDasharray="4 3" />
          <text x="820" y="342" textAnchor="middle" fill="hsl(0 0% 45%)" fontSize="11" fontWeight="600" letterSpacing="1.5">KICKER & DART</text>

          {/* Kicker tables */}
          {[0, 1].map((i) => (
            <g key={`k${i}`}>
              <rect x={685 + i * 80} y={360} width="55" height="90" rx="3" fill="hsl(0 0% 10%)" stroke="hsl(0 0% 25%)" strokeWidth="1" />
              {/* Rods */}
              {[0, 1, 2, 3].map((r) => (
                <line key={r} x1={685 + i * 80 + 5} y1={375 + r * 20} x2={685 + i * 80 + 50} y2={375 + r * 20} stroke="hsl(0 0% 30%)" strokeWidth="1.5" />
              ))}
              <text x={712 + i * 80} y={465} textAnchor="middle" fill="hsl(0 0% 40%)" fontSize="8">Kicker {i + 1}</text>
            </g>
          ))}

          {/* Dart boards */}
          {[0, 1].map((i) => (
            <g key={`d${i}`}>
              <circle cx={895 + i * 60} cy={400} r="25" fill="hsl(0 0% 10%)" stroke="hsl(0 0% 25%)" strokeWidth="1" />
              <circle cx={895 + i * 60} cy={400} r="15" fill="none" stroke="hsl(0 0% 20%)" strokeWidth="0.5" />
              <circle cx={895 + i * 60} cy={400} r="5" fill="hsl(0 72% 45% / 0.3)" stroke="hsl(0 72% 50%)" strokeWidth="0.5" />
              <text x={895 + i * 60} y={435} textAnchor="middle" fill="hsl(0 0% 40%)" fontSize="8">Dart {i + 1}</text>
            </g>
          ))}

          {/* ===== BAR / THEKE (center area) ===== */}
          <rect x="460" y="220" width="280" height="60" rx="20" fill="hsl(0 0% 10%)" stroke="hsl(0 0% 28%)" strokeWidth="1.5" />
          <text x="600" y="255" textAnchor="middle" fill="hsl(0 0% 50%)" fontSize="11" fontWeight="500" letterSpacing="1">THEKE / BAR</text>
          {/* Bar stools */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <circle key={i} cx={485 + i * 30} cy={290} r="5" fill="hsl(0 0% 13%)" stroke="hsl(0 0% 25%)" strokeWidth="0.5" />
          ))}

          {/* ===== SUMMARY COUNTERS ===== */}
          <g>
            <rect x="460" y="310" width="180" height="50" rx="4" fill="hsl(0 0% 8%)" stroke="hsl(0 0% 18%)" strokeWidth="1" />
            <text x="470" y="328" fill="hsl(0 0% 50%)" fontSize="9">Billard: <tspan fill="hsl(51 100% 50%)">{billardRes.length}/8</tspan></text>
            <text x="470" y="342" fill="hsl(0 0% 50%)" fontSize="9">Hauptber.: <tspan fill="hsl(51 100% 50%)">{hauptRes.length}</tspan></text>
            <text x="560" y="328" fill="hsl(0 0% 50%)" fontSize="9">Fenster: <tspan fill="hsl(51 100% 50%)">{fensterRes.length}</tspan></text>
            <text x="560" y="342" fill="hsl(0 0% 50%)" fontSize="9">VIP: <tspan fill="hsl(51 100% 50%)">{vipRes.length > 0 ? "Belegt" : "Frei"}</tspan></text>
            <text x="560" y="355" fill="hsl(0 0% 50%)" fontSize="9">Podest: <tspan fill="hsl(51 100% 50%)">{podestRes.length > 0 ? `${podestRes.reduce((s, r) => s + r.guest_count, 0)} Gäste` : "Frei"}</tspan></text>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default FloorPlan;
