import { useMemo } from "react";
import { FloorPlanProps, TableData } from "./types";
import RestaurantTable from "./RestaurantTable";

/**
 * SVG Floor plan for "Restaurant 75 Zoll" (Fensterbereich).
 * Tables 101–106 matching the reference layout.
 */

const DEFAULT_FENSTER_TABLES: Record<string, TableData> = {
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
        viewBox="0 0 900 700"
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

        {/* Room walls */}
        <rect x={10} y={10} width={880} height={680} rx={4} fill="none" stroke="#444" strokeWidth={3} />

        {/* Inner wall structure - bar/counter area */}
        <rect x={200} y={280} width={500} height={12} rx={2} fill="#333" stroke="#444" strokeWidth={1.5} />
        
        {/* Vertical wall segment */}
        <rect x={196} y={280} width={12} height={180} rx={2} fill="#333" stroke="#444" strokeWidth={1.5} />

        {/* ═══ TOP ROW: 101, 102 ═══ */}
        <RestaurantTable id="f1" data={tables.f1} onClick={() => click("f1")}
          cx={380} cy={140} tw={50} th={50}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="f2" data={tables.f2} onClick={() => click("f2")}
          cx={680} cy={140} tw={50} th={50}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ═══ RIGHT SIDE: 103 ═══ */}
        <RestaurantTable id="f3" data={tables.f3} onClick={() => click("f3")}
          cx={740} cy={360} tw={50} th={50}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ═══ BOTTOM ROW: 106, 105, 104 ═══ */}
        <RestaurantTable id="f6" data={tables.f6} onClick={() => click("f6")}
          cx={380} cy={540} tw={50} th={50}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="f5" data={tables.f5} onClick={() => click("f5")}
          cx={560} cy={540} tw={50} th={50}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="f4" data={tables.f4} onClick={() => click("f4")}
          cx={740} cy={540} tw={50} th={50}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ─── RONDO LOGO ─── */}
        <image href="/images/rondo-logo.png" x={30} y={560} width={150} height={100}
          style={{ opacity: 0.85 } as React.CSSProperties} />
      </svg>
    </div>
  );
};

export default FensterFloorPlan;
