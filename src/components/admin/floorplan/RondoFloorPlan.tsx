import { useMemo } from "react";
import { FloorPlanProps, TableData, TABLE_AREA_MAP } from "./types";
import BillardTable from "./BillardTable";
import RestaurantTable from "./RestaurantTable";
import AreaPlaceholder from "./AreaPlaceholder";
import FensterFloorPlan from "./FensterFloorPlan";
import BillardFloorPlan from "./BillardFloorPlan";

const DEFAULT_TABLES: Record<string, TableData> = {
  t10: { id: "t10", title: "Tisch 10", status: "free" },
  t30: { id: "t30", title: "Tisch 30", status: "free" },
  t50: { id: "t50", title: "Tisch 50", status: "free" },
  t51: { id: "t51", title: "Tisch 51", status: "free" },
  t52: { id: "t52", title: "Tisch 52", status: "free" },
  t53: { id: "t53", title: "Tisch 53", status: "free" },
  t54: { id: "t54", title: "Tisch 54", status: "free" },
  t58: { id: "t58", title: "Tisch 58", status: "free" },
  t59: { id: "t59", title: "Tisch 59", status: "free" },
  t60: { id: "t60", title: "Tisch 60", status: "free" },
  t61: { id: "t61", title: "Tisch 61", status: "free" },
  t62: { id: "t62", title: "Tisch 62", status: "free" },
  t63: { id: "t63", title: "Tisch 63", status: "free" },
  t64: { id: "t64", title: "Tisch 64", status: "free" },
  t65: { id: "t65", title: "Tisch 65", status: "free" },
  t66: { id: "t66", title: "Tisch 66", status: "free" },
  t67: { id: "t67", title: "Tisch 67", status: "free" },
  b1:  { id: "b1",  title: "Billard 1", status: "free" },
  b2:  { id: "b2",  title: "Billard 2", status: "free" },
  b3:  { id: "b3",  title: "Billard 3", status: "free" },
};

const AREA_INFO: Record<string, { title: string; desc: string; img?: string }> = {
  vip: {
    title: "VIP-Raum",
    desc: "Privater Bereich für Gruppen ab 11 Personen mit eigenem Service",
  },
  podest: {
    title: "Podest",
    desc: "Erhöhter Bereich für bis zu 33 Gäste – ideal für größere Gruppen und Feiern",
    img: "/images/podest.jpg",
  },
};

const RondoFloorPlan = ({ tables: tablesProp, onTableClick, activeArea, showLabels = true, zoom = 1, colorMode = "status" }: FloorPlanProps) => {
  const tables = useMemo(() => ({ ...DEFAULT_TABLES, ...tablesProp }), [tablesProp]);
  const click = (id: string) => onTableClick?.(id, tables[id]);

  if (activeArea === "fenster") {
    return <FensterFloorPlan tables={tablesProp} onTableClick={onTableClick} showLabels={showLabels} zoom={zoom} colorMode={colorMode} />;
  }

  if (activeArea === "billard") {
    return <BillardFloorPlan tables={tablesProp} onTableClick={onTableClick} showLabels={showLabels} zoom={zoom} colorMode={colorMode} />;
  }

  const showPlaceholder = activeArea && activeArea !== "all" && activeArea !== "hauptbereich";
  if (showPlaceholder && activeArea) {
    const info = AREA_INFO[activeArea];
    if (info) return <AreaPlaceholder {...info} />;
  }

  return (
    <div className="relative w-full h-full min-h-[400px]" style={{ background: "#111111", overflow: "auto" }}>
      <svg
        viewBox="0 0 1100 850"
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

        {/* ═══ ROOM WALLS ═══ */}
        {/* Outer room border */}
        <rect x={10} y={10} width={1080} height={830} rx={4} fill="none" stroke="#444" strokeWidth={3} />

        {/* Left upper enclosure (Tisch 10 area) - goes down to corridor */}
        <rect x={10} y={10} width={160} height={330} fill="none" stroke="#555" strokeWidth={2.5} />

        {/* Corridor wall horizontal */}
        <line x1={10} y1={340} x2={170} y2={340} stroke="#444" strokeWidth={2} />

        {/* Left lower enclosure (Tisch 30 area) */}
        <rect x={10} y={420} width={160} height={180} fill="none" stroke="#555" strokeWidth={2.5} />

        {/* Diagonal wall from left enclosure */}
        <line x1={100} y1={340} x2={170} y2={420} stroke="#555" strokeWidth={2.5} />

        {/* Bottom enclosed area (Fenster-side tables 60-67) */}
        <rect x={310} y={550} width={760} height={280} rx={4}
              fill="rgba(12,12,14,0.85)" stroke="#333" strokeWidth={2} />

        {/* ─── RONDO LOGO (bottom left) ─── */}
        <image href="/images/rondo-logo.png" x={20} y={680} width={240} height={120}
          style={{ opacity: 0.9 } as React.CSSProperties} />

        {/* ═══ BILLARD TABLES (top area) ═══ */}
        {/* B1 and B2 side by side in center-top */}
        <BillardTable id="b1" data={tables.b1} onClick={() => click("b1")}
          x={350} y={40} w={200} h={130}
          showLabels={showLabels} colorMode={colorMode} />

        <BillardTable id="b2" data={tables.b2} onClick={() => click("b2")}
          x={600} y={40} w={200} h={130}
          showLabels={showLabels} colorMode={colorMode} />

        {/* B3 rotated ~45° on the right */}
        <BillardTable id="b3" data={tables.b3} onClick={() => click("b3")}
          x={870} y={60} w={170} h={110}
          rotation={{ angle: -45, cx: 955, cy: 115 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ═══ TISCH 10 (top-left enclosure) ═══ */}
        <RestaurantTable id="t10" data={tables.t10} onClick={() => click("t10")}
          cx={90} cy={120} tw={44} th={44}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ═══ MIDDLE ROW: Tisch 52, 53, 54 ═══ */}
        <RestaurantTable id="t52" data={tables.t52} onClick={() => click("t52")}
          cx={310} cy={310} tw={44} th={44}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="t53" data={tables.t53} onClick={() => click("t53")}
          cx={450} cy={310} tw={56} th={38}
          seats={{ top: 2, right: 1, bottom: 2, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* Tisch 54 - large table (10 seats) */}
        <RestaurantTable id="t54" data={tables.t54} onClick={() => click("t54")}
          cx={640} cy={310} tw={100} th={42}
          seats={{ top: 3, right: 2, bottom: 3, left: 2 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ═══ LOWER ROW: 30, 51, 50, 58, 59 ═══ */}
        {/* Tisch 30 - round/left enclosure */}
        <RestaurantTable id="t30" data={tables.t30} onClick={() => click("t30")}
          cx={90} cy={510} tw={44} th={44}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="t51" data={tables.t51} onClick={() => click("t51")}
          cx={310} cy={460} tw={44} th={44}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="t50" data={tables.t50} onClick={() => click("t50")}
          cx={450} cy={460} tw={44} th={44}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="t58" data={tables.t58} onClick={() => click("t58")}
          cx={640} cy={460} tw={50} th={44}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="t59" data={tables.t59} onClick={() => click("t59")}
          cx={870} cy={460} tw={44} th={44}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ═══ BOTTOM BOX - Row 1: 61, 60, 67, 66 ═══ */}
        <RestaurantTable id="t61" data={tables.t61} onClick={() => click("t61")}
          cx={420} cy={620} tw={50} th={38}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />
        <RestaurantTable id="t60" data={tables.t60} onClick={() => click("t60")}
          cx={570} cy={620} tw={50} th={38}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />
        <RestaurantTable id="t67" data={tables.t67} onClick={() => click("t67")}
          cx={720} cy={620} tw={50} th={38}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />
        <RestaurantTable id="t66" data={tables.t66} onClick={() => click("t66")}
          cx={920} cy={620} tw={50} th={38}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ═══ BOTTOM BOX - Row 2: 62, 63, 64, 65 ═══ */}
        <RestaurantTable id="t62" data={tables.t62} onClick={() => click("t62")}
          cx={420} cy={750} tw={50} th={38}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />
        <RestaurantTable id="t63" data={tables.t63} onClick={() => click("t63")}
          cx={570} cy={750} tw={50} th={38}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />
        <RestaurantTable id="t64" data={tables.t64} onClick={() => click("t64")}
          cx={720} cy={750} tw={50} th={38}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />
        <RestaurantTable id="t65" data={tables.t65} onClick={() => click("t65")}
          cx={920} cy={750} tw={50} th={38}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />
      </svg>
    </div>
  );
};

export default RondoFloorPlan;
