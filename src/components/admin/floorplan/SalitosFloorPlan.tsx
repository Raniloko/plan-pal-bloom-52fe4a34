import { useMemo } from "react";
import { FloorPlanProps, TableData } from "./types";
import RestaurantTable from "./RestaurantTable";

/**
 * SVG Floor plan for "Salitos Lounge / Outdoor".
 * Layout matches the reference photo 1:1:
 *  - Top row: 212BZ, 211BZ, 210BZ, 209BZ, 208BZ, 207BZ, 206, [gap], 205
 *  - Mid-left: round table 213, 4 lounge chairs (round circles) along top-mid
 *  - Center: round table 215
 *  - Bottom row: 214 (left), Bar (striped rectangle), 204, 203BZ, 202BZ, 201BZ
 */

const DEFAULT_SALITOS_TABLES: Record<string, TableData> = {
  // Top row (BZ tables)
  s212: { id: "s212", title: "212BZ", status: "free" },
  s211: { id: "s211", title: "211BZ", status: "free" },
  s210: { id: "s210", title: "210BZ", status: "free" },
  s209: { id: "s209", title: "209BZ", status: "free" },
  s208: { id: "s208", title: "208BZ", status: "free" },
  s207: { id: "s207", title: "207BZ", status: "free" },
  s206: { id: "s206", title: "206",   status: "free" },
  s205: { id: "s205", title: "205",   status: "free" },
  // Round / single tables
  s213: { id: "s213", title: "213", status: "free" },
  s215: { id: "s215", title: "215", status: "free" },
  // Bottom row
  s214: { id: "s214", title: "214",   status: "free" },
  s204: { id: "s204", title: "204",   status: "free" },
  s203: { id: "s203", title: "203BZ", status: "free" },
  s202: { id: "s202", title: "202BZ", status: "free" },
  s201: { id: "s201", title: "201BZ", status: "free" },
};

const SalitosFloorPlan = ({
  tables: tablesProp, onTableClick, onTableDrop,
  showLabels = true, zoom = 1, colorMode = "status",
}: FloorPlanProps) => {
  const tables = useMemo(
    () => ({ ...DEFAULT_SALITOS_TABLES, ...tablesProp }),
    [tablesProp]
  );
  const click = (id: string) => onTableClick?.(id, tables[id]);
  const drop = (id: string, resId: string) => onTableDrop?.(id, tables[id], resId);

  // Top row positioning – 8 tables left→right
  const topY = 110;
  const topXs = [90, 175, 260, 345, 430, 515, 605, 760]; // gap before 205

  // Bottom row positioning
  const bottomY = 600;
  const bottomXsRight = [575, 660, 745, 830]; // 204, 203BZ, 202BZ, 201BZ

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
          {/* Stripe pattern for the bar */}
          <pattern id="barStripes" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="#d4d4dc" />
            <line x1="0" y1="0" x2="0" y2="8" stroke="#9a9aa3" strokeWidth="1.4" />
          </pattern>
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

        {/* ══════ TOP ROW – BZ tables (4 seats each, 207BZ-212BZ) + 206 + 205 ══════ */}
        {/* 212BZ – 207BZ : 4-seater BZ tables (2 left + 2 right chairs visible in photo) */}
        {[
          { id: "s212", x: topXs[0] },
          { id: "s211", x: topXs[1] },
          { id: "s210", x: topXs[2] },
          { id: "s209", x: topXs[3] },
          { id: "s208", x: topXs[4] },
          { id: "s207", x: topXs[5] },
        ].map(t => (
          <RestaurantTable
            key={t.id}
            id={t.id}
            data={tables[t.id]}
            onClick={() => click(t.id)}
            onDrop={(resId) => drop(t.id, resId)}
            cx={t.x} cy={topY} tw={48} th={42}
            seats={{ top: 0, right: 2, bottom: 0, left: 2 }}
            showLabels={showLabels} colorMode={colorMode}
          />
        ))}

        {/* 206 – 4 seater (no BZ suffix), chairs top+bottom in photo */}
        <RestaurantTable
          id="s206"
          data={tables.s206}
          onClick={() => click("s206")}
          onDrop={(resId) => drop("s206", resId)}
          cx={topXs[6]} cy={topY} tw={48} th={42}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode}
        />

        {/* 205 – larger 6-seater (right end of top row) */}
        <RestaurantTable
          id="s205"
          data={tables.s205}
          onClick={() => click("s205")}
          onDrop={(resId) => drop("s205", resId)}
          cx={topXs[7]} cy={topY} tw={64} th={48}
          seats={{ top: 2, right: 1, bottom: 2, left: 1 }}
          showLabels={showLabels} colorMode={colorMode}
        />

        {/* ══════ LOUNGE CHAIRS – 4 grey circles between 213 and the right wall ══════ */}
        {[230, 380, 530, 680].map((cx, i) => (
          <g key={`lounge-${i}`}>
            <circle cx={cx} cy={235} r={32} fill="#3a3a3a" stroke="#555" strokeWidth={1} />
            <circle cx={cx} cy={235} r={26} fill="#2c2c2c" />
          </g>
        ))}
        <text x={455} y={300} textAnchor="middle" fontSize={10} fill="#555"
          fontFamily="'DM Sans', sans-serif" letterSpacing="0.1em">
          LOUNGE
        </text>

        {/* ══════ ROUND TABLE 213 (left of lounge chairs) ══════ */}
        <RestaurantTable
          id="s213"
          data={tables.s213}
          onClick={() => click("s213")}
          onDrop={(resId) => drop("s213", resId)}
          cx={95} cy={235} tw={36} th={36}
          seats={{ top: 1, right: 0, bottom: 1, left: 0 }}
          showLabels={showLabels} colorMode={colorMode}
        />

        {/* ══════ ROUND TABLE 215 (centered, mid-left) ══════ */}
        <RestaurantTable
          id="s215"
          data={tables.s215}
          onClick={() => click("s215")}
          onDrop={(resId) => drop("s215", resId)}
          cx={195} cy={400} tw={36} th={36}
          seats={{ top: 1, right: 0, bottom: 0, left: 1 }}
          showLabels={showLabels} colorMode={colorMode}
        />

        {/* ══════ BAR – striped rectangle in lower middle ══════ */}
        <g>
          <rect x={290} y={555} width={220} height={90} rx={3}
            fill="url(#barStripes)" stroke="#666" strokeWidth={1.5} />
          {/* Bar top counter strip */}
          <rect x={290} y={555} width={220} height={14} rx={2}
            fill="#5a5a5a" stroke="#666" strokeWidth={1} />
          <text x={400} y={565} textAnchor="middle" fontSize={9} fill="#ddd"
            fontFamily="'DM Sans', sans-serif" letterSpacing="0.15em" fontWeight={600}>
            BAR
          </text>
        </g>

        {/* ══════ TABLE 214 – bottom-left, 4 seats ══════ */}
        <RestaurantTable
          id="s214"
          data={tables.s214}
          onClick={() => click("s214")}
          onDrop={(resId) => drop("s214", resId)}
          cx={150} cy={bottomY} tw={48} th={42}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode}
        />

        {/* ══════ BOTTOM-RIGHT ROW: 204, 203BZ, 202BZ, 201BZ ══════ */}
        {/* 204 – 4 seater (no BZ) */}
        <RestaurantTable
          id="s204"
          data={tables.s204}
          onClick={() => click("s204")}
          onDrop={(resId) => drop("s204", resId)}
          cx={bottomXsRight[0]} cy={bottomY} tw={48} th={42}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode}
        />

        {/* 203BZ, 202BZ, 201BZ – BZ tables (4 seats each, left+right chairs) */}
        {[
          { id: "s203", x: bottomXsRight[1] },
          { id: "s202", x: bottomXsRight[2] },
          { id: "s201", x: bottomXsRight[3] },
        ].map(t => (
          <RestaurantTable
            key={t.id}
            id={t.id}
            data={tables[t.id]}
            onClick={() => click(t.id)}
            onDrop={(resId) => drop(t.id, resId)}
            cx={t.x} cy={bottomY} tw={48} th={42}
            seats={{ top: 0, right: 2, bottom: 0, left: 2 }}
            showLabels={showLabels} colorMode={colorMode}
          />
        ))}

        {/* ─── RONDO LOGO ─── */}
        <image href="/images/rondo-logo.png" x={40} y={40} width={120} height={60}
          style={{ opacity: 0.65 } as React.CSSProperties} />
      </svg>
    </div>
  );
};

export default SalitosFloorPlan;