import { useMemo } from "react";
import { FloorPlanProps, TableData } from "./types";
import BillardTable from "./BillardTable";
import RestaurantTable from "./RestaurantTable";

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
        {/* Atmospheric glow */}
        <ellipse cx={430} cy={230} rx={80} ry={40} fill="rgba(255,160,50,0.06)" opacity={0.7} />

        {/* TABLE 10 */}
        <RestaurantTable id="t10" data={tables.t10} onClick={() => click("t10")}
          vRect={{ x: 88, y: 28, w: 28, h: 76 }}
          hRect={{ x: 62, y: 50, w: 80, h: 32 }}
          chairs={{
            left: [{ x: 60, y: 55, w: 10, h: 14 }],
            right: [{ x: 134, y: 55, w: 10, h: 14 }],
            top: [{ x: 94, y: 20, w: 16, h: 8 }],
            bottom: [{ x: 94, y: 102, w: 16, h: 8 }],
          }}
          numPos={{ x: 102, y: 71 }}
        />

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

        {/* ROW 1: Tables 52, 53, 54 */}
        <RestaurantTable id="t52" data={tables.t52} onClick={() => click("t52")}
          vRect={{ x: 158, y: 278, w: 26, h: 60 }}
          hRect={{ x: 130, y: 296, w: 82, h: 24 }}
          chairs={{
            left: [{ x: 128, y: 300, w: 10, h: 12 }],
            right: [{ x: 206, y: 300, w: 10, h: 12 }],
            top: [{ x: 165, y: 270, w: 14, h: 8 }],
            bottom: [{ x: 165, y: 336, w: 14, h: 8 }],
          }}
          numPos={{ x: 171, y: 312 }}
        />
        <RestaurantTable id="t53" data={tables.t53} onClick={() => click("t53")}
          vRect={{ x: 330, y: 278, w: 28, h: 60 }}
          hRect={{ x: 296, y: 296, w: 96, h: 24 }}
          chairs={{
            left: [{ x: 293, y: 299, w: 10, h: 12 }],
            right: [{ x: 382, y: 299, w: 10, h: 12 }],
            top: [{ x: 306, y: 270, w: 14, h: 8 }, { x: 334, y: 270, w: 14, h: 8 }, { x: 362, y: 270, w: 14, h: 8 }],
            bottom: [{ x: 306, y: 336, w: 14, h: 8 }, { x: 334, y: 336, w: 14, h: 8 }, { x: 362, y: 336, w: 14, h: 8 }],
          }}
          numPos={{ x: 344, y: 312 }}
        />
        <RestaurantTable id="t54" data={tables.t54} onClick={() => click("t54")}
          vRect={{ x: 522, y: 272, w: 34, h: 72 }}
          hRect={{ x: 480, y: 292, w: 118, h: 32 }}
          chairs={{
            left: [{ x: 476, y: 296, w: 10, h: 12 }, { x: 476, y: 314, w: 10, h: 12 }],
            right: [{ x: 592, y: 296, w: 10, h: 12 }, { x: 592, y: 314, w: 10, h: 12 }],
            top: [{ x: 492, y: 264, w: 14, h: 8 }, { x: 514, y: 264, w: 14, h: 8 }, { x: 536, y: 264, w: 14, h: 8 }, { x: 558, y: 264, w: 14, h: 8 }],
            bottom: [{ x: 492, y: 342, w: 14, h: 8 }, { x: 514, y: 342, w: 14, h: 8 }, { x: 536, y: 342, w: 14, h: 8 }, { x: 558, y: 342, w: 14, h: 8 }],
          }}
          numPos={{ x: 539, y: 312 }}
        />

        {/* ROW 2: Tables 51, 50, 58, 59 */}
        <RestaurantTable id="t51" data={tables.t51} onClick={() => click("t51")}
          vRect={{ x: 158, y: 388, w: 26, h: 60 }}
          hRect={{ x: 130, y: 406, w: 82, h: 24 }}
          chairs={{
            left: [{ x: 128, y: 410, w: 10, h: 12 }],
            right: [{ x: 206, y: 410, w: 10, h: 12 }],
            top: [{ x: 165, y: 380, w: 14, h: 8 }],
            bottom: [{ x: 165, y: 446, w: 14, h: 8 }],
          }}
          numPos={{ x: 171, y: 422 }}
        />
        <RestaurantTable id="t50" data={tables.t50} onClick={() => click("t50")}
          vRect={{ x: 330, y: 388, w: 26, h: 60 }}
          hRect={{ x: 302, y: 406, w: 82, h: 24 }}
          chairs={{
            left: [{ x: 300, y: 410, w: 10, h: 12 }],
            right: [{ x: 378, y: 410, w: 10, h: 12 }],
            top: [{ x: 338, y: 380, w: 14, h: 8 }],
            bottom: [{ x: 338, y: 446, w: 14, h: 8 }],
          }}
          numPos={{ x: 343, y: 422 }}
        />
        <RestaurantTable id="t58" data={tables.t58} onClick={() => click("t58")}
          vRect={{ x: 516, y: 388, w: 28, h: 60 }}
          hRect={{ x: 482, y: 406, w: 96, h: 24 }}
          chairs={{
            left: [{ x: 480, y: 409, w: 10, h: 12 }],
            right: [{ x: 572, y: 409, w: 10, h: 12 }],
            top: [{ x: 492, y: 380, w: 14, h: 8 }, { x: 514, y: 380, w: 14, h: 8 }, { x: 536, y: 380, w: 14, h: 8 }],
            bottom: [{ x: 492, y: 446, w: 14, h: 8 }, { x: 514, y: 446, w: 14, h: 8 }, { x: 536, y: 446, w: 14, h: 8 }],
          }}
          numPos={{ x: 530, y: 422 }}
        />
        <RestaurantTable id="t59" data={tables.t59} onClick={() => click("t59")}
          vRect={{ x: 720, y: 400, w: 22, h: 48 }}
          hRect={{ x: 698, y: 416, w: 66, h: 20 }}
          chairs={{
            left: [{ x: 696, y: 419, w: 9, h: 10 }],
            right: [{ x: 759, y: 419, w: 9, h: 10 }],
            top: [{ x: 726, y: 393, w: 12, h: 7 }],
            bottom: [{ x: 726, y: 446, w: 12, h: 7 }],
          }}
          numPos={{ x: 731, y: 430 }}
        />

        {/* TABLE 30 */}
        <RestaurantTable id="t30" data={tables.t30} onClick={() => click("t30")}
          vRect={{ x: 72, y: 460, w: 26, h: 60 }}
          hRect={{ x: 46, y: 478, w: 78, h: 24 }}
          chairs={{
            left: [{ x: 44, y: 482, w: 10, h: 12 }],
            right: [{ x: 118, y: 482, w: 10, h: 12 }],
            top: [{ x: 78, y: 452, w: 14, h: 8 }],
            bottom: [{ x: 78, y: 518, w: 14, h: 8 }],
          }}
          numPos={{ x: 85, y: 494 }}
        />

        {/* Plant */}
        <text x={272} y={540} fontSize={38}>🌿</text>

        {/* ENCLOSED BOX */}
        <rect x={330} y={490} width={638} height={184} rx={5}
              fill="rgba(14,14,16,0.88)" stroke="#2a2a2a" strokeWidth={2} />

        {/* BOX ROW 1: 61, 60, 67, 66 */}
        <RestaurantTable id="t61" data={tables.t61} onClick={() => click("t61")}
          vRect={{ x: 366, y: 506, w: 24, h: 58 }}
          hRect={{ x: 338, y: 524, w: 80, h: 22 }}
          chairs={{
            left: [{ x: 336, y: 528, w: 10, h: 10 }],
            right: [{ x: 412, y: 528, w: 10, h: 10 }],
            top: [{ x: 371, y: 498, w: 14, h: 8 }],
            bottom: [{ x: 371, y: 562, w: 14, h: 8 }],
          }}
          numPos={{ x: 378, y: 538 }}
        />
        <RestaurantTable id="t60" data={tables.t60} onClick={() => click("t60")}
          vRect={{ x: 518, y: 506, w: 24, h: 58 }}
          hRect={{ x: 490, y: 524, w: 80, h: 22 }}
          chairs={{
            left: [{ x: 488, y: 528, w: 10, h: 10 }],
            right: [{ x: 564, y: 528, w: 10, h: 10 }],
            top: [{ x: 524, y: 498, w: 14, h: 8 }],
            bottom: [{ x: 524, y: 562, w: 14, h: 8 }],
          }}
          numPos={{ x: 530, y: 538 }}
        />
        <RestaurantTable id="t67" data={tables.t67} onClick={() => click("t67")}
          vRect={{ x: 668, y: 506, w: 24, h: 58 }}
          hRect={{ x: 640, y: 524, w: 80, h: 22 }}
          chairs={{
            left: [{ x: 638, y: 528, w: 10, h: 10 }],
            right: [{ x: 714, y: 528, w: 10, h: 10 }],
            top: [{ x: 674, y: 498, w: 14, h: 8 }],
            bottom: [{ x: 674, y: 562, w: 14, h: 8 }],
          }}
          numPos={{ x: 680, y: 538 }}
        />
        <RestaurantTable id="t66" data={tables.t66} onClick={() => click("t66")}
          vRect={{ x: 820, y: 506, w: 24, h: 58 }}
          hRect={{ x: 792, y: 524, w: 80, h: 22 }}
          chairs={{
            left: [{ x: 790, y: 528, w: 10, h: 10 }],
            right: [{ x: 866, y: 528, w: 10, h: 10 }],
            top: [{ x: 826, y: 498, w: 14, h: 8 }],
            bottom: [{ x: 826, y: 562, w: 14, h: 8 }],
          }}
          numPos={{ x: 832, y: 538 }}
        />

        {/* BOX ROW 2: 62, 63, 64, 65 */}
        <RestaurantTable id="t62" data={tables.t62} onClick={() => click("t62")}
          vRect={{ x: 366, y: 618, w: 24, h: 42 }}
          hRect={{ x: 338, y: 632, w: 80, h: 20 }}
          chairs={{
            left: [{ x: 336, y: 636, w: 10, h: 9 }],
            right: [{ x: 412, y: 636, w: 10, h: 9 }],
            top: [{ x: 371, y: 612, w: 14, h: 6 }],
            bottom: [{ x: 371, y: 658, w: 14, h: 6 }],
          }}
          numPos={{ x: 378, y: 645 }}
        />
        <RestaurantTable id="t63" data={tables.t63} onClick={() => click("t63")}
          vRect={{ x: 518, y: 618, w: 24, h: 42 }}
          hRect={{ x: 490, y: 632, w: 80, h: 20 }}
          chairs={{
            left: [{ x: 488, y: 636, w: 10, h: 9 }],
            right: [{ x: 564, y: 636, w: 10, h: 9 }],
            top: [{ x: 524, y: 612, w: 14, h: 6 }],
            bottom: [{ x: 524, y: 658, w: 14, h: 6 }],
          }}
          numPos={{ x: 530, y: 645 }}
        />
        <RestaurantTable id="t64" data={tables.t64} onClick={() => click("t64")}
          vRect={{ x: 668, y: 615, w: 24, h: 44 }}
          hRect={{ x: 640, y: 630, w: 80, h: 22 }}
          chairs={{
            left: [{ x: 638, y: 634, w: 10, h: 10 }],
            right: [{ x: 714, y: 634, w: 10, h: 10 }],
            top: [{ x: 674, y: 608, w: 14, h: 7 }],
            bottom: [{ x: 674, y: 657, w: 14, h: 7 }],
          }}
          numPos={{ x: 680, y: 644 }}
        />
        <RestaurantTable id="t65" data={tables.t65} onClick={() => click("t65")}
          vRect={{ x: 820, y: 615, w: 24, h: 44 }}
          hRect={{ x: 792, y: 630, w: 80, h: 22 }}
          chairs={{
            left: [{ x: 790, y: 634, w: 10, h: 10 }],
            right: [{ x: 866, y: 634, w: 10, h: 10 }],
            top: [{ x: 826, y: 608, w: 14, h: 7 }],
            bottom: [{ x: 826, y: 657, w: 14, h: 7 }],
          }}
          numPos={{ x: 832, y: 644 }}
        />

        {/* RONDO LOGO BOX */}
        <rect x={14} y={545} width={222} height={126} rx={6}
              fill="rgba(10,10,10,0.96)" stroke="#2a2a2a" strokeWidth={1.5} />
        <ellipse cx={82} cy={596} rx={44} ry={30}
                 fill="rgba(200,180,40,0.08)" stroke="rgba(200,180,40,0.25)" strokeWidth={1.5} />
        <text x={82} y={600} textAnchor="middle" fontSize={22}>🚗</text>
        <text x={158} y={590} textAnchor="middle" fill="#c8b830" fontSize={30}
              fontFamily="'Bebas Neue', sans-serif" letterSpacing={2}>RONDO</text>
        <text x={158} y={602} textAnchor="middle" fill="#888" fontSize={9}
              fontFamily="'DM Sans', sans-serif" letterSpacing={2}>GOOD TIMES</text>
        <rect x={32} y={614} width={190} height={46} rx={4}
              fill="rgba(200,180,40,0.12)" stroke="rgba(200,180,40,0.28)" strokeWidth={1} />
        <text x={127} y={643} textAnchor="middle" fill="#c8b830" fontSize={22}
              fontFamily="'Bebas Neue', sans-serif" letterSpacing={3}>GOOD TIMES</text>
      </svg>
    </div>
  );
};

export default RondoFloorPlan;
