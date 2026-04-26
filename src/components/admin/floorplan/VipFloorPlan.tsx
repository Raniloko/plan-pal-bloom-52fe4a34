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

        {/* ══════ BENCH SEATING (3 Bänke: oben, rechts, unten) ══════ */}
        {/* Top bench – along upper wall (behind tables 101, 102) */}
        <rect x={140} y={38} width={620} height={22} rx={3} fill="#3a3a3a" stroke="#555" strokeWidth={1} />
        <text x={450} y={53} textAnchor="middle" fontSize={9} fill="#888" fontFamily="'DM Sans', sans-serif">Sitzbank</text>

        {/* Right bench – along right wall (behind tables 103, 104) */}
        <rect x={800} y={140} width={22} height={420} rx={3} fill="#3a3a3a" stroke="#555" strokeWidth={1} />
        <text x={811} y={350} textAnchor="middle" fontSize={9} fill="#888" fontFamily="'DM Sans', sans-serif"
          transform="rotate(-90, 811, 350)">Sitzbank</text>

        {/* Bottom bench – along lower wall (behind tables 105, 106) */}
        <rect x={140} y={640} width={620} height={22} rx={3} fill="#3a3a3a" stroke="#555" strokeWidth={1} />
        <text x={450} y={655} textAnchor="middle" fontSize={9} fill="#888" fontFamily="'DM Sans', sans-serif">Sitzbank</text>

        {/* ══════ TABLES — ALONG BENCHES ══════
            Bench-side seat count = 0 (bench replaces chairs).
            Total seats per table:  101=3, 102=4, 103=2, 104=4, 105=2, 106=4
        */}

        {/* TABLE 101 – top bench, left (3 seats: 0 top + 1 left + 1 right + 1 bottom) */}
        <RestaurantTable id="vip1" data={tables.vip1} onClick={() => click("vip1")} onDrop={(resId) => drop("vip1", resId)}
          cx={290} cy={120} tw={56} th={48}
          seats={{ top: 0, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* TABLE 102 – top bench, right (4 seats: 0 top + 1 left + 1 right + 2 bottom) */}
        <RestaurantTable id="vip2" data={tables.vip2} onClick={() => click("vip2")} onDrop={(resId) => drop("vip2", resId)}
          cx={610} cy={120} tw={56} th={48}
          seats={{ top: 0, right: 1, bottom: 2, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* TABLE 103 – right bench, top (2 seats: 1 top + 0 right + 1 bottom + 0 left) */}
        <RestaurantTable id="vip3" data={tables.vip3} onClick={() => click("vip3")} onDrop={(resId) => drop("vip3", resId)}
          cx={730} cy={250} tw={48} th={56}
          seats={{ top: 1, right: 0, bottom: 1, left: 0 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* TABLE 104 – right bench, bottom (4 seats: 1 top + 0 right + 1 bottom + 2 left) */}
        <RestaurantTable id="vip4" data={tables.vip4} onClick={() => click("vip4")} onDrop={(resId) => drop("vip4", resId)}
          cx={730} cy={450} tw={48} th={56}
          seats={{ top: 1, right: 0, bottom: 1, left: 2 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* TABLE 105 – bottom bench, right (2 seats: 1 top + 1 left + 0 bottom + 0 right) */}
        <RestaurantTable id="vip5" data={tables.vip5} onClick={() => click("vip5")} onDrop={(resId) => drop("vip5", resId)}
          cx={580} cy={560} tw={56} th={48}
          seats={{ top: 1, right: 0, bottom: 0, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* TABLE 106 – bottom bench, left (4 seats: 2 top + 1 left + 0 bottom + 1 right) */}
        <RestaurantTable id="vip6" data={tables.vip6} onClick={() => click("vip6")} onDrop={(resId) => drop("vip6", resId)}
          cx={310} cy={560} tw={56} th={48}
          seats={{ top: 2, right: 1, bottom: 0, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ─── RONDO LOGO ─── */}
        <image href="/images/rondo-logo.png" x={40} y={600} width={140} height={70}
          style={{ opacity: 0.85 } as React.CSSProperties} />
      </svg>
    </div>
  );
};

export default VipFloorPlan;
