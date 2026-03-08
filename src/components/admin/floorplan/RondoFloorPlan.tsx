import { useMemo } from "react";
import { FloorPlanProps, TableData } from "./types";
import BillardTable from "./BillardTable";
import RestaurantTable from "./RestaurantTable";

const DEFAULT_TABLES: Record<string, TableData> = {
  t10: { id: "t10", title: "Tisch 10", status: "free" },
  t30: { id: "t30", title: "Tisch 30", status: "free" },
  t50: { id: "t50", title: "Tisch 50", status: "free" },
  t52: { id: "t52", title: "Tisch 52", status: "free" },
  t53: { id: "t53", title: "Tisch 53", status: "free" },
  t54: { id: "t54", title: "Tisch 54", status: "free" },
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

const RondoFloorPlan = ({ tables: tablesProp, onTableClick }: FloorPlanProps) => {
  const tables = useMemo(() => ({ ...DEFAULT_TABLES, ...tablesProp }), [tablesProp]);
  const click = (id: string) => onTableClick?.(id, tables[id]);

  return (
    <div className="relative w-full h-full min-h-[400px]" style={{
      background: "radial-gradient(ellipse 40% 35% at 52% 38%, rgba(255,150,40,0.07) 0%, transparent 65%), #111111",
    }}>
      <svg
        viewBox="0 0 1000 700"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 w-full h-full"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* Room border */}
        <rect x={6} y={6} width={988} height={688} rx={5} fill="none" stroke="#222" strokeWidth={1.5} />

        {/* TABLE 10 - top left */}
        <RestaurantTable id="t10" data={tables.t10} onClick={() => click("t10")}
          cx={102} cy={67} tw={72} th={38}
          seats={{ top: 2, right: 1, bottom: 2, left: 1 }} />

        {/* BILLARD 1 */}
        <BillardTable id="b1" data={tables.b1} onClick={() => click("b1")}
          x={290} y={30} w={210} h={135} />

        {/* BILLARD 2 */}
        <BillardTable id="b2" data={tables.b2} onClick={() => click("b2")}
          x={525} y={30} w={210} h={135} strokeColor="#3a6adb" strokeWidth={4} />

        {/* BILLARD 3 - rotated */}
        <BillardTable id="b3" data={tables.b3} onClick={() => click("b3")}
          x={755} y={160} w={230} h={130}
          rotation={{ angle: -32, cx: 870, cy: 270 }} />

        {/* ROW 1: 52, 53, 54 */}
        <RestaurantTable id="t52" data={tables.t52} onClick={() => click("t52")}
          cx={172} cy={308} tw={72} th={38}
          seats={{ top: 2, right: 1, bottom: 2, left: 1 }} />
        <RestaurantTable id="t53" data={tables.t53} onClick={() => click("t53")}
          cx={344} cy={308} tw={88} th={38}
          seats={{ top: 3, right: 1, bottom: 3, left: 1 }} />
        <RestaurantTable id="t54" data={tables.t54} onClick={() => click("t54")}
          cx={540} cy={308} tw={108} th={44}
          seats={{ top: 4, right: 2, bottom: 4, left: 2 }} />

        {/* ROW 2: 50, 59 */}
        <RestaurantTable id="t50" data={tables.t50} onClick={() => click("t50")}
          cx={344} cy={418} tw={72} th={38}
          seats={{ top: 2, right: 1, bottom: 2, left: 1 }} />
        <RestaurantTable id="t59" data={tables.t59} onClick={() => click("t59")}
          cx={726} cy={418} tw={60} th={32}
          seats={{ top: 1, right: 1, bottom: 1, left: 1 }} />

        {/* TABLE 30 */}
        <RestaurantTable id="t30" data={tables.t30} onClick={() => click("t30")}
          cx={85} cy={490} tw={72} th={38}
          seats={{ top: 2, right: 1, bottom: 2, left: 1 }} />

        {/* ENCLOSED BOX */}
        <rect x={330} y={490} width={638} height={184} rx={5}
              fill="rgba(14,14,16,0.88)" stroke="#2a2a2a" strokeWidth={2} />

        {/* BOX ROW 1: 61, 60, 67, 66 */}
        <RestaurantTable id="t61" data={tables.t61} onClick={() => click("t61")}
          cx={378} cy={530} tw={72} th={36}
          seats={{ top: 2, right: 1, bottom: 2, left: 1 }} />
        <RestaurantTable id="t60" data={tables.t60} onClick={() => click("t60")}
          cx={530} cy={530} tw={72} th={36}
          seats={{ top: 2, right: 1, bottom: 2, left: 1 }} />
        <RestaurantTable id="t67" data={tables.t67} onClick={() => click("t67")}
          cx={681} cy={530} tw={72} th={36}
          seats={{ top: 2, right: 1, bottom: 2, left: 1 }} />
        <RestaurantTable id="t66" data={tables.t66} onClick={() => click("t66")}
          cx={833} cy={530} tw={72} th={36}
          seats={{ top: 2, right: 1, bottom: 2, left: 1 }} />

        {/* BOX ROW 2: 62, 63, 64, 65 */}
        <RestaurantTable id="t62" data={tables.t62} onClick={() => click("t62")}
          cx={378} cy={636} tw={72} th={34}
          seats={{ top: 2, right: 1, bottom: 2, left: 1 }} />
        <RestaurantTable id="t63" data={tables.t63} onClick={() => click("t63")}
          cx={530} cy={636} tw={72} th={34}
          seats={{ top: 2, right: 1, bottom: 2, left: 1 }} />
        <RestaurantTable id="t64" data={tables.t64} onClick={() => click("t64")}
          cx={681} cy={636} tw={72} th={34}
          seats={{ top: 2, right: 1, bottom: 2, left: 1 }} />
        <RestaurantTable id="t65" data={tables.t65} onClick={() => click("t65")}
          cx={833} cy={636} tw={72} th={34}
          seats={{ top: 2, right: 1, bottom: 2, left: 1 }} />

        {/* RONDO LOGO BOX */}
        <rect x={14} y={545} width={222} height={126} rx={6}
              fill="rgba(10,10,10,0.96)" stroke="#2a2a2a" strokeWidth={1.5} />
        <image href="/images/rondo-logo.png" x={20} y={552} width={210} height={112}
               style={{ filter: "brightness(0) invert(1)", opacity: 0.85 } as React.CSSProperties} />
      </svg>
    </div>
  );
};

export default RondoFloorPlan;
