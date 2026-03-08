import { TableData, STATUS_FILLS } from "./types";

interface RestaurantTableProps {
  id: string;
  data: TableData;
  onClick: () => void;
  cx: number;
  cy: number;
  tw: number;  // total width including chairs
  th: number;  // total height including chairs
  seats: { top: number; right: number; bottom: number; left: number };
}

/**
 * Cross-shaped table matching the ResDiary/Quandoo reference design.
 * The table body is a rounded rect, with rectangular chair stubs protruding from each edge.
 */
const RestaurantTable = ({ id, data, onClick, cx, cy, tw, th, seats }: RestaurantTableProps) => {
  const s = STATUS_FILLS[data.status] || STATUS_FILLS.free;
  const isReserved = data.status === "reserved";
  const isPresent = data.status === "present";
  const isBlocked = data.status === "blocked";

  // Chair stub dimensions
  const cW = 12; // chair width (along table edge)
  const cD = 8;  // chair depth (how far it sticks out)
  const cGap = 4; // gap between chair and table edge
  const cR = 3;  // border radius of chair

  // Core table dimensions (inner rect)
  const tableW = tw;
  const tableH = th;
  const halfW = tableW / 2;
  const halfH = tableH / 2;

  // Generate chair stubs for each side
  const makeChairs = (count: number, side: "top" | "bottom" | "left" | "right") => {
    const chairs: { x: number; y: number; w: number; h: number }[] = [];
    if (count === 0) return chairs;

    if (side === "top" || side === "bottom") {
      const totalChairWidth = count * cW + (count - 1) * 3;
      const startX = cx - totalChairWidth / 2;
      for (let i = 0; i < count; i++) {
        const x = startX + i * (cW + 3);
        const y = side === "top" ? cy - halfH - cGap - cD : cy + halfH + cGap;
        chairs.push({ x, y, w: cW, h: cD });
      }
    } else {
      const totalChairHeight = count * cW + (count - 1) * 3;
      const startY = cy - totalChairHeight / 2;
      for (let i = 0; i < count; i++) {
        const x = side === "left" ? cx - halfW - cGap - cD : cx + halfW + cGap;
        const y = startY + i * (cW + 3);
        chairs.push({ x, y, w: cD, h: cW });
      }
    }
    return chairs;
  };

  const allChairs = [
    ...makeChairs(seats.top, "top"),
    ...makeChairs(seats.right, "right"),
    ...makeChairs(seats.bottom, "bottom"),
    ...makeChairs(seats.left, "left"),
  ];

  // Name tag position below the table + chairs
  const bottomEdge = cy + halfH + (seats.bottom > 0 ? cGap + cD : 0);
  const tagY = bottomEdge + 4;
  const num = data.title.replace("Tisch ", "");

  const strokeCol = isReserved ? "#2a62b8" : isPresent ? "#166a2a" : isBlocked ? "#991111" : "rgba(160,160,180,0.4)";

  return (
    <g id={id} onClick={onClick} style={{ cursor: "pointer" }}>
      {/* Chair stubs */}
      {allChairs.map((c, i) => (
        <rect key={i} x={c.x} y={c.y} width={c.w} height={c.h} rx={cR}
          fill={s.fill} opacity={s.chairOpacity}
          stroke={strokeCol} strokeWidth={0.5}
        />
      ))}

      {/* Table body - single rounded rect */}
      <rect
        x={cx - halfW} y={cy - halfH} width={tableW} height={tableH} rx={5}
        fill={s.fill} opacity={s.opacity}
        stroke={strokeCol} strokeWidth={1.2}
      />

      {/* Table number */}
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central"
        fontSize={12} fontWeight={700} fill={s.numColor}
        fontFamily="'DM Sans', sans-serif">
        {num}
      </text>

      {/* Present: time badge */}
      {isPresent && data.startTime && (
        <>
          <rect x={cx - 24} y={tagY} width={48} height={14} rx={3} fill="rgba(0,0,0,0.65)" />
          <text x={cx} y={tagY + 10} textAnchor="middle" fontSize={9} fontWeight={700} fill="#5de88a"
            fontFamily="'DM Sans', sans-serif">{data.startTime}</text>
        </>
      )}

      {/* Name tag for reserved/present */}
      {data.guest && (isReserved || isPresent) && (
        <>
          <rect x={cx - halfW - 6} y={tagY + (isPresent && data.startTime ? 16 : 0)}
            width={tableW + 12} height={16} rx={3}
            fill={isPresent ? "#1e8a38" : "#3a7bd5"} />
          <text x={cx} y={tagY + (isPresent && data.startTime ? 28 : 12)}
            textAnchor="middle" fontSize={9} fontWeight={700} fill="#fff"
            fontFamily="'DM Sans', sans-serif">
            {data.pax ? `${data.pax} · ` : ""}{data.guest}
          </text>
        </>
      )}
    </g>
  );
};

export default RestaurantTable;
