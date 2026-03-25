import { useMemo } from "react";
import { FloorPlanProps, TableData } from "./types";
import RestaurantTable from "./RestaurantTable";

/**
 * SVG Floor plan for the "VIP-Raum".
 * 2 large VIP tables.
 */

const DEFAULT_VIP_TABLES: Record<string, TableData> = {
  vip1: { id: "vip1", title: "VIP 1", status: "free" },
  vip2: { id: "vip2", title: "VIP 2", status: "free" },
};

const VipFloorPlan = ({ tables: tablesProp, onTableClick, showLabels = true, zoom = 1, colorMode = "status" }: FloorPlanProps) => {
  const tables = useMemo(() => ({ ...DEFAULT_VIP_TABLES, ...tablesProp }), [tablesProp]);
  const click = (id: string) => onTableClick?.(id, tables[id]);

  return (
    <div className="relative w-full h-full min-h-[400px]" style={{
      background: "#111111",
      overflow: "auto",
    }}>
      <svg
        viewBox="0 0 700 500"
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

        {/* Room border */}
        <rect x={10} y={10} width={680} height={480} rx={4} fill="none" stroke="#444" strokeWidth={3} />

        {/* VIP label */}
        <text x={350} y={50} textAnchor="middle" fontSize={18} fontWeight={700} fill="rgba(255,255,255,0.15)"
          fontFamily="'DM Sans', sans-serif" letterSpacing="0.15em">VIP RAUM</text>

        {/* Door indicator */}
        <rect x={10} y={200} width={6} height={80} rx={2} fill="#666" />
        <text x={3} y={245} textAnchor="middle" fontSize={8} fill="#888"
          fontFamily="'DM Sans', sans-serif" transform="rotate(-90, 3, 245)">Eingang</text>

        {/* VIP Table 1 - Large table, left side */}
        <RestaurantTable id="vip1" data={tables.vip1} onClick={() => click("vip1")}
          cx={230} cy={220} tw={80} th={50}
          seats={{ top: 3, right: 1, bottom: 3, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* VIP Table 2 - Large table, right side */}
        <RestaurantTable id="vip2" data={tables.vip2} onClick={() => click("vip2")}
          cx={480} cy={220} tw={80} th={50}
          seats={{ top: 3, right: 1, bottom: 3, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* Decorative elements - Sofa/couch along back wall */}
        <rect x={100} y={400} width={500} height={20} rx={4} fill="#2a2a2a" stroke="#444" strokeWidth={1} />
        <text x={350} y={414} textAnchor="middle" fontSize={9} fill="#555"
          fontFamily="'DM Sans', sans-serif">Lounge</text>

        {/* ─── RONDO LOGO ─── */}
        <image href="/images/rondo-logo.png" x={520} y={410} width={140} height={70}
          style={{ opacity: 0.85 } as React.CSSProperties} />
      </svg>
    </div>
  );
};

export default VipFloorPlan;
