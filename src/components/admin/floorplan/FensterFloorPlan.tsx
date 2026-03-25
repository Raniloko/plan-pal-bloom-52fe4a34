import { useMemo } from "react";
import { FloorPlanProps, TableData } from "./types";
import BillardTable from "./BillardTable";
import RestaurantTable from "./RestaurantTable";

/**
 * SVG Floor plan for "Restaurant 75 Zoll".
 * Same room layout as 140 Zoll but only shows:
 * - Billard 1-3 (synced via bt prefix)
 * - Tisch 55, 56, 57 (right side, vertical behind Billard 3)
 */

const DEFAULT_FENSTER_TABLES: Record<string, TableData> = {
  bt1: { id: "bt1", title: "Billard 1", status: "free" },
  bt2: { id: "bt2", title: "Billard 2", status: "free" },
  bt3: { id: "bt3", title: "Billard 3", status: "free" },
  t55: { id: "t55", title: "Tisch 55", status: "free" },
  t56: { id: "t56", title: "Tisch 56", status: "free" },
  t57: { id: "t57", title: "Tisch 57", status: "free" },
};

const FensterFloorPlan = ({ tables: tablesProp, onTableClick, showLabels = true, zoom = 1, colorMode = "status" }: FloorPlanProps) => {
  const tables = useMemo(() => ({ ...DEFAULT_FENSTER_TABLES, ...tablesProp }), [tablesProp]);
  const click = (id: string) => onTableClick?.(id, tables[id]);

  return (
    <div className="relative w-full h-full min-h-[400px]" style={{
      background: "#111111",
      overflow: "auto",
    }}>
      <svg
        viewBox="0 0 1200 950"
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
          @keyframes statusFade { 0% { opacity: 0.3; } 100% { opacity: 1; } }
          .status-transition { animation: statusFade 0.5s ease-out; }
        `}</style>

        {/* ═══ OUTER ROOM WALLS ═══ */}
        <rect x={10} y={10} width={1180} height={930} rx={4} fill="none" stroke="#444" strokeWidth={3} />

        {/* ─── DARK SCREENS (top, left of billard) ─── */}
        <rect x={200} y={50} width={70} height={100} rx={3} fill="#222" stroke="#333" strokeWidth={1.5} />
        <rect x={290} y={50} width={70} height={100} rx={3} fill="#222" stroke="#333" strokeWidth={1.5} />

        {/* ─── BILLARD 1 & 2 (top center, side by side) ─── */}
        <BillardTable id="bt1" data={tables.bt1} onClick={() => click("bt1")}
          x={420} y={40} w={210} h={140}
          showLabels={showLabels} colorMode={colorMode} />

        <BillardTable id="bt2" data={tables.bt2} onClick={() => click("bt2")}
          x={680} y={40} w={210} h={140}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ─── BILLARD 3 (rotated ~45°, right side) ─── */}
        <BillardTable id="bt3" data={tables.bt3} onClick={() => click("bt3")}
          x={900} y={180} w={180} h={130}
          rotation={{ angle: -45, cx: 990, cy: 245 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ─── Horizontal bar/counter ─── */}
        <rect x={350} y={290} width={400} height={8} rx={3} fill="#444" stroke="#555" strokeWidth={1} />

        {/* ═══ TISCH 55, 56, 57 – right side, vertical column behind Billard 3 ═══ */}
        <RestaurantTable id="t55" data={tables.t55} onClick={() => click("t55")}
          cx={1050} cy={420} tw={44} th={44}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="t56" data={tables.t56} onClick={() => click("t56")}
          cx={1050} cy={560} tw={44} th={44}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="t57" data={tables.t57} onClick={() => click("t57")}
          cx={1050} cy={700} tw={44} th={44}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ─── RONDO LOGO (bottom left) ─── */}
        <image href="/images/rondo-logo.png" x={30} y={720} width={230} height={120}
          style={{ opacity: 0.9 } as React.CSSProperties} />
      </svg>
    </div>
  );
};

export default FensterFloorPlan;
