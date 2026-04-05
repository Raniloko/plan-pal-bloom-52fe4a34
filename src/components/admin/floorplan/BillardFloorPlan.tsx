import { useMemo } from "react";
import { FloorPlanProps, TableData } from "./types";
import BillardTable from "./BillardTable";

/**
 * SVG Floor plan for the "Billard" area.
 * 8 Billard tables: Row 1 (1–5), Row 2 (6–8).
 */

const DEFAULT_BILLARD_TABLES: Record<string, TableData> = {
  bt1: { id: "bt1", title: "Billard 1", status: "free" },
  bt2: { id: "bt2", title: "Billard 2", status: "free" },
  bt3: { id: "bt3", title: "Billard 3", status: "free" },
  bt4: { id: "bt4", title: "Billard 4", status: "free" },
  bt5: { id: "bt5", title: "Billard 5", status: "free" },
  bt6: { id: "bt6", title: "Billard 6", status: "free" },
  bt7: { id: "bt7", title: "Billard 7", status: "free" },
  bt8: { id: "bt8", title: "Billard 8", status: "free" },
};

const BillardFloorPlan = ({ tables: tablesProp, onTableClick, onTableDrop, showLabels = true, zoom = 1, colorMode = "status" }: FloorPlanProps) => {
  const tables = useMemo(() => ({ ...DEFAULT_BILLARD_TABLES, ...tablesProp }), [tablesProp]);
  const click = (id: string) => onTableClick?.(id, tables[id]);
  const drop = (id: string, resId: string) => onTableDrop?.(id, tables[id], resId);

  return (
    <div className="relative w-full h-full min-h-[400px]" style={{
      background: "#111111",
      overflow: "auto",
    }}>
      <svg
        viewBox="0 0 1100 600"
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
        `}</style>

        {/* Room border */}
        <rect x={6} y={6} width={1088} height={588} rx={4} fill="none" stroke="#444" strokeWidth={3} />

        {/* ═══ ROW 1: Billard 1–5 ═══ */}
        <BillardTable id="bt1" data={tables.bt1} onClick={() => click("bt1")} onDrop={(resId) => drop("bt1", resId)}}
          x={30} y={60} w={190} h={130}
          showLabels={showLabels} colorMode={colorMode} />

        <BillardTable id="bt2" data={tables.bt2} onClick={() => click("bt2")} onDrop={(resId) => drop("bt2", resId)}}
          x={240} y={60} w={190} h={130}
          showLabels={showLabels} colorMode={colorMode} />

        <BillardTable id="bt3" data={tables.bt3} onClick={() => click("bt3")} onDrop={(resId) => drop("bt3", resId)}}
          x={450} y={60} w={190} h={130}
          showLabels={showLabels} colorMode={colorMode} />

        <BillardTable id="bt4" data={tables.bt4} onClick={() => click("bt4")} onDrop={(resId) => drop("bt4", resId)}}
          x={660} y={60} w={190} h={130}
          showLabels={showLabels} colorMode={colorMode} />

        <BillardTable id="bt5" data={tables.bt5} onClick={() => click("bt5")} onDrop={(resId) => drop("bt5", resId)}}
          x={870} y={60} w={190} h={130}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ═══ ROW 2: Billard 6–8 ═══ */}
        <BillardTable id="bt6" data={tables.bt6} onClick={() => click("bt6")} onDrop={(resId) => drop("bt6", resId)}}
          x={140} y={330} w={190} h={130}
          showLabels={showLabels} colorMode={colorMode} />

        <BillardTable id="bt7" data={tables.bt7} onClick={() => click("bt7")} onDrop={(resId) => drop("bt7", resId)}}
          x={400} y={330} w={190} h={130}
          showLabels={showLabels} colorMode={colorMode} />

        <BillardTable id="bt8" data={tables.bt8} onClick={() => click("bt8")} onDrop={(resId) => drop("bt8", resId)}}
          x={660} y={330} w={190} h={130}
          showLabels={showLabels} colorMode={colorMode} />

        {/* ─── RONDO LOGO ─── */}
        <image href="/images/rondo-logo.png" x={870} y={440} width={180} height={100}
          style={{ opacity: 0.85 } as React.CSSProperties} />
      </svg>
    </div>
  );
};

export default BillardFloorPlan;
