import { useMemo } from "react";
import { FloorPlanProps, TableData } from "./types";
import BillardTable from "./BillardTable";
import RestaurantTable from "./RestaurantTable";

/**
 * SVG Floor plan for "Restaurant 75 Zoll / Sport".
 * Matches reference: Billard 1-3, Tables 55-57 (right), room walls,
 * plus tables 101-106 in lower section.
 */

const DEFAULT_FENSTER_TABLES: Record<string, TableData> = {
  // Billard tables (synced with hauptbereich via bt prefix)
  bt1: { id: "bt1", title: "Billard 1", status: "free" },
  bt2: { id: "bt2", title: "Billard 2", status: "free" },
  bt3: { id: "bt3", title: "Billard 3", status: "free" },
  // Restaurant tables
  t55: { id: "t55", title: "Tisch 55", status: "free" },
  t56: { id: "t56", title: "Tisch 56", status: "free" },
  t57: { id: "t57", title: "Tisch 57", status: "free" },
  // Fenster tables 101-106
  f1: { id: "f1", title: "Tisch 101", status: "free" },
  f2: { id: "f2", title: "Tisch 102", status: "free" },
  f3: { id: "f3", title: "Tisch 103", status: "free" },
  f4: { id: "f4", title: "Tisch 104", status: "free" },
  f5: { id: "f5", title: "Tisch 105", status: "free" },
  f6: { id: "f6", title: "Tisch 106", status: "free" },
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
        viewBox="0 0 1300 900"
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
          .status-transition { animation: statusFade 0.5s ease-out; }
          @keyframes statusFade { 0% { opacity: 0.3; } 100% { opacity: 1; } }
        `}</style>

        {/* ═══ OUTER ROOM WALLS ═══ */}
        <rect x={10} y={10} width={1280} height={880} rx={4} fill="none" stroke="#444" strokeWidth={3} />

        {/* ─── UPPER SECTION: Billard + Tables 55-57 ─── */}

        {/* Dark screen/TV rectangles (top-left) */}
        <rect x={80} y={60} width={70} height={120} rx={3} fill="#222" stroke="#333" strokeWidth={1.5} />
        <rect x={180} y={60} width={70} height={120} rx={3} fill="#222" stroke="#333" strokeWidth={1.5} />

        {/* Billard 1 & 2 side by side (center-top) */}
        <BillardTable id="bt1" data={tables.bt1} onClick={() => click("bt1")}
          x={420} y={50} w={200} h={130}
          showLabels={showLabels} colorMode={colorMode} />

        <BillardTable id="bt2" data={tables.bt2} onClick={() => click("bt2")}
          x={680} y={50} w={200} h={130}
          showLabels={showLabels} colorMode={colorMode} />

        {/* Horizontal bar/counter (middle) */}
        <rect x={250} y={310} width={400} height={10} rx={3} fill="#444" stroke="#555" strokeWidth={1} />

        {/* Billard 3 rotated ~45° (center-right) */}
        <BillardTable id="bt3" data={tables.bt3} onClick={() => click("bt3")}
          x={830} y={220} w={180} h={120}
          rotation={{ angle: -45, cx: 920, cy: 280 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ═══ TABLES 55, 56, 57 (far right, stacked vertically) ═══ */}
        <RestaurantTable id="t55" data={tables.t55} onClick={() => click("t55")}
          cx={1200} cy={100} tw={44} th={44}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="t56" data={tables.t56} onClick={() => click("t56")}
          cx={1200} cy={250} tw={44} th={44}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="t57" data={tables.t57} onClick={() => click("t57")}
          cx={1200} cy={400} tw={44} th={44}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ─── LOWER SECTION: Room walls + corridors ─── */}

        {/* Vertical divider wall */}
        <line x1={550} y1={420} x2={550} y2={600} stroke="#555" strokeWidth={2.5} />

        {/* Diagonal corridor wall */}
        <line x1={200} y1={500} x2={350} y2={620} stroke="#555" strokeWidth={2.5} />

        {/* Horizontal corridor walls */}
        <line x1={10} y1={500} x2={200} y2={500} stroke="#444" strokeWidth={2} />
        <line x1={10} y1={620} x2={350} y2={620} stroke="#444" strokeWidth={2} />

        {/* ─── BOTTOM SECTION: Tables 101-106 ─── */}

        {/* Enclosed area for 101-106 */}
        <rect x={580} y={460} width={690} height={420} rx={4}
              fill="rgba(12,12,14,0.85)" stroke="#333" strokeWidth={2} />

        {/* Inner wall structure (bar area) */}
        <rect x={660} y={580} width={400} height={10} rx={2} fill="#333" stroke="#444" strokeWidth={1.5} />
        <rect x={656} y={580} width={10} height={160} rx={2} fill="#333" stroke="#444" strokeWidth={1.5} />

        {/* 101, 102 (top row) */}
        <RestaurantTable id="f1" data={tables.f1} onClick={() => click("f1")}
          cx={830} cy={520} tw={50} th={50}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="f2" data={tables.f2} onClick={() => click("f2")}
          cx={1100} cy={520} tw={50} th={50}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* 103 (right side) */}
        <RestaurantTable id="f3" data={tables.f3} onClick={() => click("f3")}
          cx={1180} cy={680} tw={50} th={50}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* 106, 105, 104 (bottom row) */}
        <RestaurantTable id="f6" data={tables.f6} onClick={() => click("f6")}
          cx={830} cy={810} tw={50} th={50}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="f5" data={tables.f5} onClick={() => click("f5")}
          cx={1000} cy={810} tw={50} th={50}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="f4" data={tables.f4} onClick={() => click("f4")}
          cx={1180} cy={810} tw={50} th={50}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ─── RONDO LOGO (bottom left) ─── */}
        <image href="/images/rondo-logo.png" x={40} y={700} width={200} height={110}
          style={{ opacity: 0.85 } as React.CSSProperties} />

        {/* Plant decoration */}
        <text x={330} y={760} fontSize={40} style={{ opacity: 0.7 } as React.CSSProperties}>🌿</text>
      </svg>
    </div>
  );
};

export default FensterFloorPlan;
