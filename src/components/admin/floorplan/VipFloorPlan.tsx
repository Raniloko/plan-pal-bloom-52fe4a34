import { useMemo } from "react";
import { FloorPlanProps, TableData } from "./types";
import RestaurantTable from "./RestaurantTable";

/**
 * SVG Floor plan for the "VIP-Raum".
 * 6 × 4er-Tische with bench seating along the back walls.
 * Layout matches the reference image exactly.
 */

const DEFAULT_VIP_TABLES: Record<string, TableData> = {
  vip1: { id: "vip1", title: "101", status: "free" },
  vip2: { id: "vip2", title: "102", status: "free" },
  vip3: { id: "vip3", title: "103", status: "free" },
  vip4: { id: "vip4", title: "104", status: "free" },
  vip5: { id: "vip5", title: "105", status: "free" },
  vip6: { id: "vip6", title: "106", status: "free" },
};

const VipFloorPlan = ({ tables: tablesProp, onTableClick, onTableDrop, showLabels = true, zoom = 1, colorMode = "status" }: FloorPlanProps) => {
  const tables = useMemo(() => ({ ...DEFAULT_VIP_TABLES, ...tablesProp }), [tablesProp]);
  const click = (id: string) => onTableClick?.(id, tables[id]);
  const drop = (id: string, resId: string) => onTableDrop?.(id, tables[id], resId);

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

        {/* ══════ ROOM OUTER WALLS ══════ */}
        <rect x={30} y={20} width={840} height={660} rx={4} fill="none" stroke="#555" strokeWidth={3} />

        {/* ══════ TOP CORRIDOR / ENTRANCE ══════ */}
        {/* Left corridor wall */}
        <rect x={380} y={20} width={8} height={130} fill="#555" />
        {/* Top corridor ceiling */}
        <rect x={380} y={20} width={230} height={8} fill="#555" />
        {/* Right corridor wall */}
        <rect x={602} y={20} width={8} height={130} fill="#555" />

        {/* ══════ RIGHT WALL PARTITION ══════ */}
        <rect x={640} y={20} width={8} height={180} fill="#555" />

        {/* ══════ BENCH SEATING (Sitzbänke) ══════ */}
        {/* Back wall bench – left side (behind tables 101) */}
        <rect x={40} y={30} width={330} height={18} rx={3} fill="#3a3a3a" stroke="#555" strokeWidth={1} />
        <text x={205} y={43} textAnchor="middle" fontSize={8} fill="#888" fontFamily="'DM Sans', sans-serif">Sitzbank</text>

        {/* Left wall bench (behind table 101) */}
        <rect x={40} y={48} width={18} height={280} rx={3} fill="#3a3a3a" stroke="#555" strokeWidth={1} />
        <text x={49} y={190} textAnchor="middle" fontSize={8} fill="#888" fontFamily="'DM Sans', sans-serif"
          transform="rotate(-90, 49, 190)">Sitzbank</text>

        {/* Right wall bench (behind tables 102, 103) */}
        <rect x={812} y={30} width={18} height={380} rx={3} fill="#3a3a3a" stroke="#555" strokeWidth={1} />
        <text x={821} y={220} textAnchor="middle" fontSize={8} fill="#888" fontFamily="'DM Sans', sans-serif"
          transform="rotate(-90, 821, 220)">Sitzbank</text>

        {/* Bottom wall bench (behind tables 104, 105, 106) */}
        <rect x={250} y={610} width={530} height={18} rx={3} fill="#3a3a3a" stroke="#555" strokeWidth={1} />
        <text x={515} y={623} textAnchor="middle" fontSize={8} fill="#888" fontFamily="'DM Sans', sans-serif">Sitzbank</text>

        {/* ═══ TABLE 101 – left center ═══ */}
        <RestaurantTable id="vip1" data={tables.vip1} onClick={() => click("vip1")}
          cx={220} cy={230} tw={48} th={48}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ═══ TABLE 102 – right top ═══ */}
        <RestaurantTable id="vip2" data={tables.vip2} onClick={() => click("vip2")}
          cx={730} cy={200} tw={48} th={48}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ═══ TABLE 103 – right below 102 ═══ */}
        <RestaurantTable id="vip3" data={tables.vip3} onClick={() => click("vip3")}
          cx={730} cy={370} tw={48} th={48}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ═══ BOTTOM ROW: 106, 105, 104 (left to right) ═══ */}
        <RestaurantTable id="vip6" data={tables.vip6} onClick={() => click("vip6")}
          cx={340} cy={530} tw={48} th={48}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="vip5" data={tables.vip5} onClick={() => click("vip5")}
          cx={530} cy={530} tw={48} th={48}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="vip4" data={tables.vip4} onClick={() => click("vip4")}
          cx={710} cy={530} tw={48} th={48}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ─── RONDO LOGO ─── */}
        <image href="/images/rondo-logo.png" x={40} y={580} width={160} height={80}
          style={{ opacity: 0.85 } as React.CSSProperties} />
      </svg>
    </div>
  );
};

export default VipFloorPlan;
