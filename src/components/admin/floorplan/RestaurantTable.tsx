import { TableData, STATUS_FILLS } from "./types";

interface ChairRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface RestaurantTableProps {
  id: string;
  data: TableData;
  onClick: () => void;
  vRect: { x: number; y: number; w: number; h: number };
  hRect: { x: number; y: number; w: number; h: number };
  chairs: {
    left: ChairRect[];
    right: ChairRect[];
    top: ChairRect[];
    bottom: ChairRect[];
  };
  numPos: { x: number; y: number };
}

const RestaurantTable = ({ id, data, onClick, vRect, hRect, chairs, numPos }: RestaurantTableProps) => {
  const s = STATUS_FILLS[data.status] || STATUS_FILLS.free;

  const allChairs = [
    ...chairs.left.map(c => ({ ...c, side: "left" })),
    ...chairs.right.map(c => ({ ...c, side: "right" })),
    ...chairs.top.map(c => ({ ...c, side: "top" })),
    ...chairs.bottom.map(c => ({ ...c, side: "bottom" })),
  ];

  // Name tag position below the table
  const tagY = Math.max(vRect.y + vRect.h, hRect.y + hRect.h) + 6;
  const tagX = hRect.x;
  const tagW = hRect.w;
  const tagCx = tagX + tagW / 2;

  const isReserved = data.status === "reserved";
  const isPresent = data.status === "present";

  return (
    <g id={id} onClick={onClick} style={{ cursor: "pointer" }} className="hover:brightness-110">
      {/* Chair stubs */}
      {allChairs.map((c, i) => (
        <rect key={i} x={c.x} y={c.y} width={c.w} height={c.h} rx={3}
          fill={s.fill} opacity={s.chairOpacity} />
      ))}
      {/* Cross-shape table */}
      <rect x={vRect.x} y={vRect.y} width={vRect.w} height={vRect.h} rx={5}
        fill={s.fill} opacity={s.opacity} />
      <rect x={hRect.x} y={hRect.y} width={hRect.w} height={hRect.h} rx={5}
        fill={s.fill} opacity={s.opacity} />
      {/* Table number */}
      <text x={numPos.x} y={numPos.y} textAnchor="middle" fontSize={13} fontWeight={700}
        fill={s.numColor} fontFamily="'DM Sans', sans-serif">
        {data.title.replace("Tisch ", "")}
      </text>

      {/* Present: time badge above */}
      {isPresent && data.startTime && (
        <>
          <rect x={tagCx - 23} y={tagY - 20} width={46} height={13} rx={3} fill="rgba(0,0,0,0.6)" />
          <text x={tagCx} y={tagY - 10} textAnchor="middle" fontSize={9} fontWeight={700} fill="#5de88a"
            fontFamily="'DM Sans', sans-serif">{data.startTime}</text>
        </>
      )}

      {/* Name tag for reserved/present */}
      {data.guest && (isReserved || isPresent) && (
        <>
          <rect x={tagX} y={tagY} width={tagW} height={15} rx={3}
            fill={isPresent ? "#1e8a38" : "#3a7bd5"} />
          <text x={tagCx} y={tagY + 11} textAnchor="middle" fontSize={10} fontWeight={700} fill="#fff"
            fontFamily="'DM Sans', sans-serif">
            {data.pax ? `${data.pax} | ` : ""}{data.guest}
          </text>
        </>
      )}
    </g>
  );
};

export default RestaurantTable;
