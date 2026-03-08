import { TableData, STATUS_FILLS } from "./types";

interface RestaurantTableProps {
  id: string;
  data: TableData;
  onClick: () => void;
  cx: number;
  cy: number;
  tw: number;
  th: number;
  seats: { top: number; right: number; bottom: number; left: number };
}

const RestaurantTable = ({ id, data, onClick, cx, cy, tw, th, seats }: RestaurantTableProps) => {
  const s = STATUS_FILLS[data.status] || STATUS_FILLS.free;
  const isReserved = data.status === "reserved";
  const isPresent = data.status === "present";
  const isBlocked = data.status === "blocked";

  const halfW = tw / 2;
  const halfH = th / 2;
  const chairR = 5;
  const chairGap = 8;

  const makeSeats = (count: number, side: "top" | "bottom" | "left" | "right") => {
    const result: { sx: number; sy: number }[] = [];
    if (count === 0) return result;

    if (side === "top" || side === "bottom") {
      const spacing = tw / (count + 1);
      const baseY = side === "top" ? cy - halfH - chairGap : cy + halfH + chairGap;
      for (let i = 0; i < count; i++) {
        result.push({ sx: cx - halfW + spacing * (i + 1), sy: baseY });
      }
    } else {
      const spacing = th / (count + 1);
      const baseX = side === "left" ? cx - halfW - chairGap : cx + halfW + chairGap;
      for (let i = 0; i < count; i++) {
        result.push({ sx: baseX, sy: cy - halfH + spacing * (i + 1) });
      }
    }
    return result;
  };

  const allChairs = [
    ...makeSeats(seats.top, "top"),
    ...makeSeats(seats.right, "right"),
    ...makeSeats(seats.bottom, "bottom"),
    ...makeSeats(seats.left, "left"),
  ];

  const tagY = cy + halfH + chairGap + chairR + 4;
  const num = data.title.replace("Tisch ", "");

  return (
    <g id={id} onClick={onClick} style={{ cursor: "pointer" }}>
      {/* Chair circles */}
      {allChairs.map((c, i) => (
        <circle key={i} cx={c.sx} cy={c.sy} r={chairR}
          fill={s.fill} opacity={s.chairOpacity} />
      ))}

      {/* Table surface - rounded rectangle */}
      <rect
        x={cx - halfW} y={cy - halfH} width={tw} height={th} rx={8}
        fill={s.fill} opacity={s.opacity}
        stroke={isReserved ? "#2a62b8" : isPresent ? "#166a2a" : isBlocked ? "#991111" : "#b0b0c0"}
        strokeWidth={1.5}
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
          <rect x={cx - 24} y={tagY - 2} width={48} height={14} rx={3} fill="rgba(0,0,0,0.6)" />
          <text x={cx} y={tagY + 8} textAnchor="middle" fontSize={9} fontWeight={700} fill="#5de88a"
            fontFamily="'DM Sans', sans-serif">{data.startTime}</text>
        </>
      )}

      {/* Name tag for reserved/present */}
      {data.guest && (isReserved || isPresent) && (
        <>
          <rect x={cx - tw / 2 - 4} y={tagY + (isPresent && data.startTime ? 14 : 0)}
            width={tw + 8} height={15} rx={3}
            fill={isPresent ? "#1e8a38" : "#3a7bd5"} />
          <text x={cx} y={tagY + (isPresent && data.startTime ? 25 : 11)}
            textAnchor="middle" fontSize={9} fontWeight={700} fill="#fff"
            fontFamily="'DM Sans', sans-serif">
            {data.pax ? `${data.pax}P | ` : ""}{data.guest}
          </text>
        </>
      )}
    </g>
  );
};

export default RestaurantTable;
