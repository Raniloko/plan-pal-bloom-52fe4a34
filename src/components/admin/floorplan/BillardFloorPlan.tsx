import { useMemo } from "react";
import { FloorPlanProps, TableData } from "./types";
import BillardTable from "./BillardTable";

/**
 * SVG Floor plan for the "Billard" area.
 * Billard tables 4–8 (1–3 are in Restaurant 140 Zoll / Hauptbereich).
 */

const DEFAULT_BILLARD_TABLES: Record<string, TableData> = {
  bt4: { id: "bt4", title: "Billard 4", status: "free" },
  bt5: { id: "bt5", title: "Billard 5", status: "free" },
  bt6: { id: "bt6", title: "Billard 6", status: "free" },
  bt7: { id: "bt7", title: "Billard 7", status: "free" },
  bt8: { id: "bt8", title: "Billard 8", status: "free" },
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
        viewBox="0 0 900 550"
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
        <rect x={6} y={6} width={888} height={538} rx={5} fill="none" stroke="#222" strokeWidth={1.5} />

        {/* Section label */}
        <text x={450} y={42} textAnchor="middle" fontSize={13} fontWeight={600}
          fill="rgba(255,255,255,0.2)" fontFamily="'DM Sans', sans-serif" letterSpacing="0.15em">
          BILLARD · TISCHE 4–8
        </text>
        <text x={450} y={60} textAnchor="middle" fontSize={10} fontWeight={400}
          fill="rgba(255,255,255,0.12)" fontFamily="'DM Sans', sans-serif">
          (Billard 1–3 → Restaurant 140 Zoll)
        </text>

        {/* ═══ ROW 1: Billard 4–6 ═══ */}
        <BillardTable id="bt4" data={tables.bt4} onClick={() => click("bt4")}
          x={60} y={100} w={200} h={130}
          showLabels={showLabels} colorMode={colorMode} />

        <BillardTable id="bt5" data={tables.bt5} onClick={() => click("bt5")}
          x={320} y={100} w={200} h={130}
          showLabels={showLabels} colorMode={colorMode} />

        <BillardTable id="bt6" data={tables.bt6} onClick={() => click("bt6")}
          x={580} y={100} w={200} h={130}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ═══ ROW 2: Billard 7–8 ═══ */}
        <BillardTable id="bt7" data={tables.bt7} onClick={() => click("bt7")}
          x={180} y={310} w={200} h={130}
          showLabels={showLabels} colorMode={colorMode} />

        <BillardTable id="bt8" data={tables.bt8} onClick={() => click("bt8")}
          x={460} y={310} w={200} h={130}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ─── RONDO LOGO ─── */}
        <rect x={340} y={470} width={220} height={60} rx={6}
          fill="rgba(10,10,10,0.96)" stroke="#2a2a2a" strokeWidth={1.5} />
        <image href="/images/rondo-logo.png" x={348} y={474} width={204} height={52}
          style={{ filter: "brightness(0) invert(1)", opacity: 0.85 } as React.CSSProperties} />
      </svg>
    </div>
  );
};

export default BillardFloorPlan;
