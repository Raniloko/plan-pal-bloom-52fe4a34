import { useMemo } from "react";
import { FloorPlanProps, TableData } from "./types";
import RestaurantTable from "./RestaurantTable";

/**
 * SVG Floor plan for the "Restaurant 75 Zoll" (Fensterbereich) area.
 * Window-side seating with 75-inch screens. Tables f1–f8.
 */

const DEFAULT_FENSTER_TABLES: Record<string, TableData> = {
  f1: { id: "f1", title: "Tisch F1", status: "free" },
  f2: { id: "f2", title: "Tisch F2", status: "free" },
  f3: { id: "f3", title: "Tisch F3", status: "free" },
  f4: { id: "f4", title: "Tisch F4", status: "free" },
  f5: { id: "f5", title: "Tisch F5", status: "free" },
  f6: { id: "f6", title: "Tisch F6", status: "free" },
  f7: { id: "f7", title: "Tisch F7", status: "free" },
  f8: { id: "f8", title: "Tisch F8", status: "free" },
};

const FensterFloorPlan = ({ tables: tablesProp, onTableClick, showLabels = true, zoom = 1, colorMode = "status" }: FloorPlanProps) => {
  const tables = useMemo(() => ({ ...DEFAULT_FENSTER_TABLES, ...tablesProp }), [tablesProp]);
  const click = (id: string) => onTableClick?.(id, tables[id]);

  return (
    <div className="relative w-full h-full min-h-[400px]" style={{
      background: "radial-gradient(ellipse 50% 40% at 50% 35%, rgba(120,180,255,0.05) 0%, transparent 70%), #111111",
      overflow: "auto",
    }}>
      <svg
        viewBox="0 0 900 600"
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
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="pulseGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feFlood floodColor="#1e8a38" floodOpacity="0.6" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Window glass pattern */}
          <linearGradient id="windowGlass" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(140,200,255,0.12)" />
            <stop offset="100%" stopColor="rgba(80,140,200,0.04)" />
          </linearGradient>
        </defs>

        <style>{`
          @keyframes pulseRing {
            0% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 0; transform: scale(1.4); }
            100% { opacity: 0; transform: scale(1.4); }
          }
          .pulse-ring {
            animation: pulseRing 2s ease-out infinite;
          }
          @keyframes statusFade {
            0% { opacity: 0.3; }
            100% { opacity: 1; }
          }
          .status-transition {
            animation: statusFade 0.5s ease-out;
          }
        `}</style>

        {/* Room border */}
        <rect x={6} y={6} width={888} height={588} rx={5} fill="none" stroke="#222" strokeWidth={1.5} />

        {/* ─── WINDOW WALL (top) ─── */}
        <rect x={30} y={10} width={840} height={18} rx={3}
          fill="url(#windowGlass)" stroke="rgba(140,200,255,0.2)" strokeWidth={1} />
        {/* Window panes */}
        {[0, 1, 2, 3, 4, 5].map(i => (
          <rect key={i} x={50 + i * 140} y={12} width={120} height={14} rx={2}
            fill="rgba(140,200,255,0.08)" stroke="rgba(140,200,255,0.15)" strokeWidth={0.5} />
        ))}

        {/* Area label */}
        <text x={450} y={55} textAnchor="middle" fontSize={13} fontWeight={600}
          fill="rgba(255,255,255,0.25)" fontFamily="'DM Sans', sans-serif"
          letterSpacing="0.15em">
          FENSTERBEREICH · 75 ZOLL
        </text>

        {/* ─── 75" SCREENS on wall ─── */}
        {[150, 450, 750].map((sx, i) => (
          <g key={i}>
            <rect x={sx - 40} y={32} width={80} height={8} rx={2}
              fill="rgba(60,120,200,0.25)" stroke="rgba(100,160,240,0.3)" strokeWidth={0.8} />
            <text x={sx} y={38} textAnchor="middle" fontSize={6} fill="rgba(140,200,255,0.5)"
              fontFamily="'DM Sans', sans-serif">
              75"
            </text>
          </g>
        ))}

        {/* ═══ ROW 1: Window-side tables (F1–F4) ═══ */}
        <RestaurantTable id="f1" data={tables.f1} onClick={() => click("f1")}
          cx={130} cy={140} tw={50} th={34}
          seats={{ top: 2, right: 0, bottom: 2, left: 0 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="f2" data={tables.f2} onClick={() => click("f2")}
          cx={310} cy={140} tw={50} th={34}
          seats={{ top: 2, right: 0, bottom: 2, left: 0 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="f3" data={tables.f3} onClick={() => click("f3")}
          cx={490} cy={140} tw={50} th={34}
          seats={{ top: 2, right: 0, bottom: 2, left: 0 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="f4" data={tables.f4} onClick={() => click("f4")}
          cx={670} cy={140} tw={50} th={34}
          seats={{ top: 2, right: 0, bottom: 2, left: 0 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* Subtle divider */}
        <line x1={60} y1={250} x2={840} y2={250} stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="4 8" />

        {/* ═══ ROW 2: Inner tables (F5–F8) ═══ */}
        <RestaurantTable id="f5" data={tables.f5} onClick={() => click("f5")}
          cx={130} cy={360} tw={50} th={34}
          seats={{ top: 2, right: 1, bottom: 2, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="f6" data={tables.f6} onClick={() => click("f6")}
          cx={310} cy={360} tw={66} th={34}
          seats={{ top: 2, right: 1, bottom: 2, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="f7" data={tables.f7} onClick={() => click("f7")}
          cx={490} cy={360} tw={66} th={34}
          seats={{ top: 2, right: 1, bottom: 2, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="f8" data={tables.f8} onClick={() => click("f8")}
          cx={670} cy={360} tw={90} th={40}
          seats={{ top: 3, right: 2, bottom: 3, left: 2 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ─── RONDO LOGO ─── */}
        <rect x={340} y={470} width={220} height={100} rx={6}
          fill="rgba(10,10,10,0.96)" stroke="#2a2a2a" strokeWidth={1.5} />
        <image href="/images/rondo-logo.png" x={348} y={478} width={204} height={84}
          style={{ filter: "brightness(0) invert(1)", opacity: 0.85 } as React.CSSProperties} />
      </svg>
    </div>
  );
};

export default FensterFloorPlan;
