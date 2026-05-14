import { useMemo } from "react";
import { FloorPlanProps, TableData } from "./types";
import BillardTable from "./BillardTable";
import RestaurantTable from "./RestaurantTable";
import FensterFloorPlan from "./FensterFloorPlan";
import BillardFloorPlan from "./BillardFloorPlan";
import VipFloorPlan from "./VipFloorPlan";
import SalitosFloorPlan from "./SalitosFloorPlan";


const DEFAULT_TABLES: Record<string, TableData> = {
  t10: { id: "t10", title: "Tisch 10", status: "free" },
  t30: { id: "t30", title: "Tisch 30", status: "free" },
  t50: { id: "t50", title: "Tisch 50", status: "free" },
  t51: { id: "t51", title: "Tisch 51", status: "free" },
  t52: { id: "t52", title: "Tisch 52", status: "free" },
  t53: { id: "t53", title: "Tisch 53", status: "free" },
  t54: { id: "t54", title: "Tisch 54", status: "free" },
  t55: { id: "t55", title: "Tisch 55", status: "free" },
  t56: { id: "t56", title: "Tisch 56", status: "free" },
  t57: { id: "t57", title: "Tisch 57", status: "free" },
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
  bt1: { id: "bt1", title: "Billard 1", status: "free" },
  bt2: { id: "bt2", title: "Billard 2", status: "free" },
  bt3: { id: "bt3", title: "Billard 3", status: "free" },
};

const RondoFloorPlan = ({ tables: tablesProp, onTableClick, onTableDrop, activeArea, showLabels = true, zoom = 1, colorMode = "status" }: FloorPlanProps) => {
  const tables = useMemo(() => ({ ...DEFAULT_TABLES, ...tablesProp }), [tablesProp]);
  const click = (id: string) => onTableClick?.(id, tables[id]);
  const drop = (id: string, resId: string) => onTableDrop?.(id, tables[id], resId);

  if (activeArea === "fenster") {
    return <FensterFloorPlan tables={tablesProp} onTableClick={onTableClick} onTableDrop={onTableDrop} showLabels={showLabels} zoom={zoom} colorMode={colorMode} />;
  }
  if (activeArea === "billard") {
    return <BillardFloorPlan tables={tablesProp} onTableClick={onTableClick} onTableDrop={onTableDrop} showLabels={showLabels} zoom={zoom} colorMode={colorMode} />;
  }
  if (activeArea === "vip") {
    return <VipFloorPlan tables={tablesProp} onTableClick={onTableClick} onTableDrop={onTableDrop} showLabels={showLabels} zoom={zoom} colorMode={colorMode} />;
  }
  if (activeArea === "salitos") {
    return <SalitosFloorPlan tables={tablesProp} onTableClick={onTableClick} onTableDrop={onTableDrop} showLabels={showLabels} zoom={zoom} colorMode={colorMode} />;
  }

  return (
    <div className="relative w-full h-full min-h-[400px]" style={{ background: "#111111", overflow: "auto" }}>
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

        {/* ─── TOP-LEFT: Tisch 10 (freistehend, keine Trennwand) ─── */}
        <RestaurantTable id="t10" data={tables.t10} onClick={() => click("t10")} onDrop={(resId) => drop("t10", resId)}
          cx={85} cy={120} tw={44} th={44}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ─── DARK SCREENS / TVs (top, left of billard) – matched to 75 Zoll style ─── */}
        <rect x={230} y={50} width={70} height={100} rx={3} fill="#222" stroke="#333" strokeWidth={1.5} />
        <rect x={320} y={50} width={70} height={100} rx={3} fill="#222" stroke="#333" strokeWidth={1.5} />

        {/* ─── BILLARD 1 & 2 (top center, side by side) ─── */}
        <BillardTable id="bt1" data={tables.bt1} onClick={() => click("bt1")} onDrop={(resId) => drop("bt1", resId)}
          x={420} y={40} w={210} h={140}
          showLabels={showLabels} colorMode={colorMode} />

        <BillardTable id="bt2" data={tables.bt2} onClick={() => click("bt2")} onDrop={(resId) => drop("bt2", resId)}
          x={680} y={40} w={210} h={140}
          showLabels={showLabels} colorMode={colorMode} />


        {/* ─── BILLARD 3 (rotated ~45°, right side) ─── */}
        <BillardTable id="bt3" data={tables.bt3} onClick={() => click("bt3")} onDrop={(resId) => drop("bt3", resId)}
          x={900} y={180} w={180} h={130}
          rotation={{ angle: -45, cx: 990, cy: 245 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ─── Horizontal bar/counter (matched to 75 Zoll style) ─── */}
        <rect x={350} y={290} width={400} height={8} rx={3} fill="#444" stroke="#555" strokeWidth={1} />

        {/* ═══ MIDDLE ROW: Tisch 52, 53, 54 ═══ */}
        <RestaurantTable id="t52" data={tables.t52} onClick={() => click("t52")} onDrop={(resId) => drop("t52", resId)}
          cx={330} cy={430} tw={44} th={44}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="t53" data={tables.t53} onClick={() => click("t53")} onDrop={(resId) => drop("t53", resId)}
          cx={510} cy={430} tw={64} th={42}
          seats={{ top: 2, right: 1, bottom: 2, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="t54" data={tables.t54} onClick={() => click("t54")} onDrop={(resId) => drop("t54", resId)}
          cx={745} cy={430} tw={170} th={44}
          seats={{ top: 4, right: 1, bottom: 4, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ─── LEFT: Tisch 30 (freistehend, ohne Umrandung) ─── */}
        <RestaurantTable id="t30" data={tables.t30} onClick={() => click("t30")} onDrop={(resId) => drop("t30", resId)}
          cx={120} cy={580} tw={44} th={44}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ═══ LOWER ROW: 51, 50, 58, 59 ═══ */}
        <RestaurantTable id="t51" data={tables.t51} onClick={() => click("t51")} onDrop={(resId) => drop("t51", resId)}
          cx={330} cy={585} tw={44} th={42}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="t50" data={tables.t50} onClick={() => click("t50")} onDrop={(resId) => drop("t50", resId)}
          cx={470} cy={585} tw={44} th={42}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="t58" data={tables.t58} onClick={() => click("t58")} onDrop={(resId) => drop("t58", resId)}
          cx={780} cy={585} tw={50} th={42}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="t59" data={tables.t59} onClick={() => click("t59")} onDrop={(resId) => drop("t59", resId)}
          cx={1080} cy={585} tw={36} th={42}
          seats={{ top: 1, right: 0, bottom: 1, left: 0 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ═══ BOTTOM ENCLOSED AREA (tables 60-67) ═══
            Klarer rechteckiger Rahmen mit dunklem Hintergrund, wie im Referenzbild.
        */}
        <rect
          x={600}
          y={660}
          width={590}
          height={275}
          rx={4}
          fill="none"
          stroke="#444"
          strokeWidth={3}
        />

        {/* ─── Row 1: 61, 60, 67, 66 ─── */}
        <RestaurantTable id="t61" data={tables.t61} onClick={() => click("t61")} onDrop={(resId) => drop("t61", resId)}
          cx={680} cy={730} tw={48} th={42}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="t60" data={tables.t60} onClick={() => click("t60")} onDrop={(resId) => drop("t60", resId)}
          cx={840} cy={730} tw={48} th={42}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="t67" data={tables.t67} onClick={() => click("t67")} onDrop={(resId) => drop("t67", resId)}
          cx={1000} cy={730} tw={48} th={42}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="t66" data={tables.t66} onClick={() => click("t66")} onDrop={(resId) => drop("t66", resId)}
          cx={1140} cy={730} tw={48} th={42}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ─── Row 2: 62, 63, 64, 65 ─── */}
        <RestaurantTable id="t62" data={tables.t62} onClick={() => click("t62")} onDrop={(resId) => drop("t62", resId)}
          cx={680} cy={870} tw={48} th={42}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="t63" data={tables.t63} onClick={() => click("t63")} onDrop={(resId) => drop("t63", resId)}
          cx={840} cy={870} tw={48} th={42}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="t64" data={tables.t64} onClick={() => click("t64")} onDrop={(resId) => drop("t64", resId)}
          cx={1000} cy={870} tw={48} th={42}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        <RestaurantTable id="t65" data={tables.t65} onClick={() => click("t65")} onDrop={(resId) => drop("t65", resId)}
          cx={1140} cy={870} tw={48} th={42}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ─── RONDO LOGO (bottom left) – matched to 75 Zoll position ─── */}
        <image href="/images/rondo-logo.png" x={30} y={720} width={230} height={120}
          style={{ opacity: 0.9 } as React.CSSProperties} />

      </svg>
    </div>
  );
};

export default RondoFloorPlan;
