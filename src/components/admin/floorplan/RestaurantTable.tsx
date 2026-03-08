import { TableData, STATUS_FILLS } from "./types";

interface ChairPos { x: number; y: number; w: number; h: number }

interface Props {
  id: string;
  data: TableData;
  vRect: { x: number; y: number; w: number; h: number };
  hRect: { x: number; y: number; w: number; h: number };
  chairs: { left?: ChairPos[]; right?: ChairPos[]; top?: ChairPos[]; bottom?: ChairPos[] };
  numPos: { x: number; y: number };
  onClick?: () => void;
}

const RestaurantTable = ({ id, data, vRect, hRect, chairs, numPos, onClick }: Props) => {
  const s = STATUS_FILLS[data.status];
  const isReserved = data.status === "reserved";
  const isPresent = data.status === "present";
  const cx = numPos.x;
  const tagY = Math.max(vRect.y + vRect.h, hRect.y + hRect.h);

  return (
    <g onClick={onClick} style={{ cursor: "pointer" }} className="transition-all hover:brightness-[1.15]">
      {/* Vertical rect */}
      <rect x={vRect.x} y={vRect.y} width={vRect.w} height={vRect.h} rx={5}
            fill={s.fill} opacity={s.opacity} />
      {/* Horizontal rect */}
      <rect x={hRect.x} y={hRect.y} width={hRect.w} height={hRect.h} rx={5}
            fill={s.fill} opacity={s.opacity} />
      {/* Chairs */}
      {Object.values(chairs).flat().filter(Boolean).map((c, i) => (
        <rect key={i} x={c!.x} y={c!.y} width={c!.w} height={c!.h} rx={3}
              fill={s.fill} opacity={s.chairOpacity} />
      ))}
      {/* Number */}
      <text x={numPos.x} y={numPos.y} textAnchor="middle" fill={s.numColor}
            fontSize={13} fontWeight="bold" fontFamily="'DM Sans', sans-serif">
        {data.title.replace("Tisch ", "")}
      </text>

      {/* Reserved name tag */}
      {isReserved && data.guest && (
        <>
          <rect x={cx - 40} y={tagY + 4} width={80} height={15} rx={3} fill="#3a7bd5" />
          <text x={cx} y={tagY + 14} textAnchor="middle" fill="#fff" fontSize={10} fontWeight="bold"
                fontFamily="'DM Sans', sans-serif">{data.pax} | {data.guest}</text>
        </>
      )}

      {/* Present name + time tag */}
      {isPresent && data.guest && (
        <>
          {data.startTime && (
            <>
              <rect x={cx - 23} y={vRect.y - 16} width={46} height={13} rx={3} fill="rgba(0,0,0,0.6)" />
              <text x={cx} y={vRect.y - 6} textAnchor="middle" fill="#5de88a" fontSize={9} fontWeight="bold"
                    fontFamily="'DM Sans', sans-serif">{data.startTime}</text>
            </>
          )}
          <rect x={cx - 40} y={tagY + 4} width={80} height={15} rx={3} fill="#1e8a38" />
          <text x={cx} y={tagY + 14} textAnchor="middle" fill="#fff" fontSize={10} fontWeight="bold"
                fontFamily="'DM Sans', sans-serif">{data.pax} | {data.guest}</text>
        </>
      )}
    </g>
  );
};

export default RestaurantTable;
