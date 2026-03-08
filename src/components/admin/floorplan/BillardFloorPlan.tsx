import { useMemo } from "react";
import { FloorPlanProps, TableData } from "./types";
import BillardTable from "./BillardTable";

/**
 * SVG Floor plan for the "Billard / Kicker / Dart" area.
 * 8 Olio-Billardtische, 2 Leonhart-Tischkicker, 2 Löwen-Elektronik Darts
 */

const DEFAULT_BILLARD_TABLES: Record<string, TableData> = {
  bt1: { id: "bt1", title: "Billard 1", status: "free" },
  bt2: { id: "bt2", title: "Billard 2", status: "free" },
  bt3: { id: "bt3", title: "Billard 3", status: "free" },
  bt4: { id: "bt4", title: "Billard 4", status: "free" },
  bt5: { id: "bt5", title: "Billard 5", status: "free" },
  bt6: { id: "bt6", title: "Billard 6", status: "free" },
  bt7: { id: "bt7", title: "Billard 7", status: "free" },
  bt8: { id: "bt8", title: "Billard 8", status: "free" },
  k1:  { id: "k1",  title: "Kicker 1", status: "free" },
  k2:  { id: "k2",  title: "Kicker 2", status: "free" },
  d1:  { id: "d1",  title: "Dart 1", status: "free" },
  d2:  { id: "d2",  title: "Dart 2", status: "free" },
};

/** Kicker table SVG element */
const KickerTable = ({ id, data, onClick, x, y, w, h, showLabels }: {
  id: string; data: TableData; onClick: () => void;
  x: number; y: number; w: number; h: number; showLabels?: boolean;
}) => {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const isReserved = data.status === "reserved";
  const isPresent = data.status === "present";
  const isBlocked = data.status === "blocked";

  const borderColor = isPresent ? "#1e8a38" : isReserved ? "#3a7bd5" : isBlocked ? "#cc2222" : "#555";

  return (
    <g id={id} onClick={onClick} style={{ cursor: "pointer" }}>
      {isPresent && (
        <rect className="pulse-ring" x={x - 4} y={y - 4} width={w + 8} height={h + 8} rx={6}
          fill="none" stroke="#1e8a38" strokeWidth={2}
          style={{ transformOrigin: `${cx}px ${cy}px` }} />
      )}
      {/* Table body */}
      <rect x={x} y={y} width={w} height={h} rx={4}
        fill="#2a2a2a" stroke={borderColor} strokeWidth={2} />
      {/* Playing field (green) */}
      <rect x={x + 6} y={y + 4} width={w - 12} height={h - 8} rx={2}
        fill="#1a5c28" opacity={0.7} />
      {/* Rods (horizontal lines) */}
      {[0.2, 0.35, 0.5, 0.65, 0.8].map((pct, i) => (
        <line key={i} x1={x + 4} y1={y + h * pct} x2={x + w - 4} y2={y + h * pct}
          stroke="rgba(200,200,200,0.3)" strokeWidth={1.5} />
      ))}
      {/* Handles on sides */}
      {[0.2, 0.35, 0.5, 0.65, 0.8].map((pct, i) => (
        <g key={`h${i}`}>
          <rect x={x - 8} y={y + h * pct - 4} width={8} height={8} rx={2} fill="#444" stroke="#555" strokeWidth={0.5} />
          <rect x={x + w} y={y + h * pct - 4} width={8} height={8} rx={2} fill="#444" stroke="#555" strokeWidth={0.5} />
        </g>
      ))}
      {/* Label */}
      <text x={cx} y={y - 8} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.35)"
        fontFamily="'DM Sans', sans-serif" fontWeight={600}>
        {data.title.toUpperCase()}
      </text>
      {/* Guest info */}
      {showLabels && data.guest && (isReserved || isPresent) && (
        <>
          <rect x={x} y={y + h + 4} width={w} height={16} rx={3}
            fill={isPresent ? "#1e8a38" : "#3a7bd5"} />
          <text x={cx} y={y + h + 15} textAnchor="middle" fontSize={9} fontWeight={700} fill="#fff"
            fontFamily="'DM Sans', sans-serif">
            {data.pax ? `${data.pax} · ` : ""}{data.guest}
          </text>
        </>
      )}
    </g>
  );
};

/** Dart board SVG element */
const DartBoard = ({ id, data, onClick, cx, cy, r, showLabels }: {
  id: string; data: TableData; onClick: () => void;
  cx: number; cy: number; r: number; showLabels?: boolean;
}) => {
  const isReserved = data.status === "reserved";
  const isPresent = data.status === "present";
  const isBlocked = data.status === "blocked";

  const borderColor = isPresent ? "#1e8a38" : isReserved ? "#3a7bd5" : isBlocked ? "#cc2222" : "#555";

  return (
    <g id={id} onClick={onClick} style={{ cursor: "pointer" }}>
      {isPresent && (
        <circle className="pulse-ring" cx={cx} cy={cy} r={r + 6}
          fill="none" stroke="#1e8a38" strokeWidth={2}
          style={{ transformOrigin: `${cx}px ${cy}px` }} />
      )}
      {/* Board backing */}
      <rect x={cx - r - 10} y={cy - r - 10} width={(r + 10) * 2} height={(r + 10) * 2} rx={4}
        fill="#1a1a1a" stroke={borderColor} strokeWidth={1.5} />
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r} fill="#2a2a2a" stroke="#444" strokeWidth={1} />
      {/* Scoring rings */}
      <circle cx={cx} cy={cy} r={r * 0.8} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={0.5} />
      <circle cx={cx} cy={cy} r={r * 0.6} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={0.5} />
      <circle cx={cx} cy={cy} r={r * 0.4} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />
      {/* Alternating segments */}
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i * 18 - 90) * Math.PI / 180;
        const nextAngle = ((i + 1) * 18 - 90) * Math.PI / 180;
        return (
          <path key={i}
            d={`M${cx} ${cy} L${cx + Math.cos(angle) * r} ${cy + Math.sin(angle) * r} A${r} ${r} 0 0 1 ${cx + Math.cos(nextAngle) * r} ${cy + Math.sin(nextAngle) * r} Z`}
            fill={i % 2 === 0 ? "rgba(200,50,50,0.15)" : "rgba(50,150,50,0.15)"}
            stroke="rgba(255,255,255,0.05)" strokeWidth={0.5}
          />
        );
      })}
      {/* Inner bull */}
      <circle cx={cx} cy={cy} r={r * 0.15} fill="#cc2222" opacity={0.8} />
      <circle cx={cx} cy={cy} r={r * 0.06} fill="#1e8a38" opacity={0.9} />
      {/* Label */}
      <text x={cx} y={cy - r - 16} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.35)"
        fontFamily="'DM Sans', sans-serif" fontWeight={600}>
        {data.title.toUpperCase()}
      </text>
      {/* Guest info */}
      {showLabels && data.guest && (isReserved || isPresent) && (
        <>
          <rect x={cx - r - 10} y={cy + r + 14} width={(r + 10) * 2} height={16} rx={3}
            fill={isPresent ? "#1e8a38" : "#3a7bd5"} />
          <text x={cx} y={cy + r + 25} textAnchor="middle" fontSize={9} fontWeight={700} fill="#fff"
            fontFamily="'DM Sans', sans-serif">
            {data.pax ? `${data.pax} · ` : ""}{data.guest}
          </text>
        </>
      )}
    </g>
  );
};

const BillardFloorPlan = ({ tables: tablesProp, onTableClick, showLabels = true, zoom = 1, colorMode = "status" }: FloorPlanProps) => {
  const tables = useMemo(() => ({ ...DEFAULT_BILLARD_TABLES, ...tablesProp }), [tablesProp]);
  const click = (id: string) => onTableClick?.(id, tables[id]);

  return (
    <div className="relative w-full h-full min-h-[400px]" style={{
      background: "radial-gradient(ellipse 50% 40% at 50% 30%, rgba(30,120,48,0.06) 0%, transparent 70%), #111111",
      overflow: "auto",
    }}>
      <svg
        viewBox="0 0 1100 750"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 w-full h-full"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          transform: `scale(${zoom})`,
          transformOrigin: "center center",
          transition: "transform 0.3s ease",
        }}
      >
        <defs>
          <filter id="tableGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="rgba(255,255,255,0.15)" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="pulseGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feFlood floodColor="#1e8a38" floodOpacity="0.6" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <style>{`
          @keyframes pulseRing {
            0% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 0; transform: scale(1.4); }
            100% { opacity: 0; transform: scale(1.4); }
          }
          .pulse-ring { animation: pulseRing 2s ease-out infinite; }
        `}</style>

        {/* Room border */}
        <rect x={6} y={6} width={1088} height={738} rx={5} fill="none" stroke="#222" strokeWidth={1.5} />

        {/* Section labels */}
        <text x={370} y={42} textAnchor="middle" fontSize={13} fontWeight={600}
          fill="rgba(255,255,255,0.2)" fontFamily="'DM Sans', sans-serif" letterSpacing="0.15em">
          BILLARD
        </text>
        <text x={920} y={42} textAnchor="middle" fontSize={13} fontWeight={600}
          fill="rgba(255,255,255,0.2)" fontFamily="'DM Sans', sans-serif" letterSpacing="0.15em">
          KICKER / DART
        </text>

        {/* Divider between billard and kicker/dart */}
        <line x1={740} y1={30} x2={740} y2={720} stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="6 10" />

        {/* ═══ ROW 1: Billard 1–4 ═══ */}
        <BillardTable id="bt1" data={tables.bt1} onClick={() => click("bt1")}
          x={40} y={75} w={160} h={100}
          showLabels={showLabels} colorMode={colorMode} />

        <BillardTable id="bt2" data={tables.bt2} onClick={() => click("bt2")}
          x={230} y={75} w={160} h={100}
          showLabels={showLabels} colorMode={colorMode} />

        <BillardTable id="bt3" data={tables.bt3} onClick={() => click("bt3")}
          x={420} y={75} w={160} h={100}
          showLabels={showLabels} colorMode={colorMode} />

        <BillardTable id="bt4" data={tables.bt4} onClick={() => click("bt4")}
          x={40} y={250} w={160} h={100}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ═══ ROW 2: Billard 5–8 ═══ */}
        <BillardTable id="bt5" data={tables.bt5} onClick={() => click("bt5")}
          x={230} y={250} w={160} h={100}
          showLabels={showLabels} colorMode={colorMode} />

        <BillardTable id="bt6" data={tables.bt6} onClick={() => click("bt6")}
          x={420} y={250} w={160} h={100}
          showLabels={showLabels} colorMode={colorMode} />

        <BillardTable id="bt7" data={tables.bt7} onClick={() => click("bt7")}
          x={40} y={425} w={160} h={100}
          showLabels={showLabels} colorMode={colorMode} />

        <BillardTable id="bt8" data={tables.bt8} onClick={() => click("bt8")}
          x={230} y={425} w={160} h={100}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ═══ KICKER 1 & 2 ═══ */}
        <KickerTable id="k1" data={tables.k1} onClick={() => click("k1")}
          x={790} y={80} w={120} h={180} showLabels={showLabels} />

        <KickerTable id="k2" data={tables.k2} onClick={() => click("k2")}
          x={960} y={80} w={120} h={180} showLabels={showLabels} />

        {/* ═══ DART 1 & 2 ═══ */}
        <DartBoard id="d1" data={tables.d1} onClick={() => click("d1")}
          cx={850} cy={430} r={55} showLabels={showLabels} />

        <DartBoard id="d2" data={tables.d2} onClick={() => click("d2")}
          cx={1010} cy={430} r={55} showLabels={showLabels} />

        {/* Throw lines for darts */}
        <line x1={790} y1={560} x2={910} y2={560} stroke="rgba(255,200,50,0.2)" strokeWidth={2} strokeDasharray="4 4" />
        <text x={850} y={575} textAnchor="middle" fontSize={8} fill="rgba(255,200,50,0.25)" fontFamily="'DM Sans', sans-serif">Abwurflinie</text>
        <line x1={950} y1={560} x2={1070} y2={560} stroke="rgba(255,200,50,0.2)" strokeWidth={2} strokeDasharray="4 4" />
        <text x={1010} y={575} textAnchor="middle" fontSize={8} fill="rgba(255,200,50,0.25)" fontFamily="'DM Sans', sans-serif">Abwurflinie</text>

        {/* ─── RONDO LOGO ─── */}
        <rect x={420} y={580} width={220} height={100} rx={6}
          fill="rgba(10,10,10,0.96)" stroke="#2a2a2a" strokeWidth={1.5} />
        <image href="/images/rondo-logo.png" x={428} y={588} width={204} height={84}
          style={{ filter: "brightness(0) invert(1)", opacity: 0.85 } as React.CSSProperties} />
      </svg>
    </div>
  );
};

export default BillardFloorPlan;
