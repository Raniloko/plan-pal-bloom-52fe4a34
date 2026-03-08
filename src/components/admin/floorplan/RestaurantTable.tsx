import { useState } from "react";
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
  dimmed?: boolean;
  showLabels?: boolean;
}

const RestaurantTable = ({ id, data, onClick, cx, cy, tw, th, seats, dimmed = false, showLabels = true }: RestaurantTableProps) => {
  const [hovered, setHovered] = useState(false);
  const s = STATUS_FILLS[data.status] || STATUS_FILLS.free;
  const isReserved = data.status === "reserved";
  const isPresent = data.status === "present";
  const isBlocked = data.status === "blocked";

  const cW = 12;
  const cD = 8;
  const cGap = 4;
  const cR = 3;

  const tableW = tw;
  const tableH = th;
  const halfW = tableW / 2;
  const halfH = tableH / 2;

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

  const bottomEdge = cy + halfH + (seats.bottom > 0 ? cGap + cD : 0);
  const tagY = bottomEdge + 4;
  const num = data.title.replace("Tisch ", "");

  const strokeCol = isReserved ? "#2a62b8" : isPresent ? "#166a2a" : isBlocked ? "#991111" : "rgba(160,160,180,0.4)";

  const groupOpacity = dimmed ? 0.2 : 1;
  const scale = hovered && !dimmed ? 1.06 : 1;

  // Tooltip content
  const hasInfo = data.guest || data.startTime || data.pax;

  return (
    <g
      id={id}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: dimmed ? "default" : "pointer",
        opacity: groupOpacity,
        transform: `scale(${scale})`,
        transformOrigin: `${cx}px ${cy}px`,
        transition: "opacity 0.4s ease, transform 0.2s ease",
      }}
    >
      {/* Drop shadow */}
      {hovered && !dimmed && (
        <ellipse cx={cx} cy={cy + halfH + 2} rx={halfW + 4} ry={6}
          fill="rgba(0,0,0,0.25)" />
      )}

      {/* Chair stubs with gradient */}
      {allChairs.map((c, i) => (
        <rect key={i} x={c.x} y={c.y} width={c.w} height={c.h} rx={cR}
          fill={s.fill} opacity={s.chairOpacity}
          stroke={strokeCol} strokeWidth={0.5}
        />
      ))}

      {/* Table body */}
      <rect
        x={cx - halfW} y={cy - halfH} width={tableW} height={tableH} rx={5}
        fill={s.fill} opacity={s.opacity}
        stroke={hovered && !dimmed ? "rgba(255,255,255,0.5)" : strokeCol}
        strokeWidth={hovered && !dimmed ? 1.8 : 1.2}
        filter={hovered && !dimmed ? "url(#tableGlow)" : undefined}
      />

      {/* Inner highlight for depth */}
      <rect
        x={cx - halfW + 2} y={cy - halfH + 1} width={tableW - 4} height={tableH / 2 - 1} rx={3}
        fill="rgba(255,255,255,0.08)" opacity={s.opacity}
      />

      {/* Table number */}
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central"
        fontSize={12} fontWeight={700} fill={s.numColor}
        fontFamily="'DM Sans', sans-serif">
        {num}
      </text>

      {/* Present: time badge */}
      {showLabels && isPresent && data.startTime && (
        <>
          <rect x={cx - 24} y={tagY} width={48} height={14} rx={3} fill="rgba(0,0,0,0.65)" />
          <text x={cx} y={tagY + 10} textAnchor="middle" fontSize={9} fontWeight={700} fill="#5de88a"
            fontFamily="'DM Sans', sans-serif">{data.startTime}</text>
        </>
      )}

      {/* Name tag for reserved/present */}
      {showLabels && data.guest && (isReserved || isPresent) && (
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

      {/* Hover tooltip */}
      {hovered && !dimmed && hasInfo && (
        <g>
          <rect x={cx - 60} y={cy - halfH - 48} width={120} height={38} rx={6}
            fill="rgba(0,0,0,0.88)" stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />
          <polygon points={`${cx - 5},${cy - halfH - 10} ${cx + 5},${cy - halfH - 10} ${cx},${cy - halfH - 4}`}
            fill="rgba(0,0,0,0.88)" />
          <text x={cx} y={cy - halfH - 34} textAnchor="middle" fontSize={10} fontWeight={700} fill="#fff"
            fontFamily="'DM Sans', sans-serif">
            {data.guest || data.title}
          </text>
          <text x={cx} y={cy - halfH - 20} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.7)"
            fontFamily="'DM Sans', sans-serif">
            {[data.startTime, data.pax ? `${data.pax} Gäste` : ""].filter(Boolean).join(" · ") || data.status}
          </text>
        </g>
      )}
    </g>
  );
};

export default RestaurantTable;
