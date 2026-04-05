import { useState } from "react";
import { TableData, STATUS_FILLS, TIME_SLOT_FILLS, getTimeSlot } from "./types";

interface RestaurantTableProps {
  id: string;
  data: TableData;
  onClick: () => void;
  onDrop?: (reservationId: string) => void;
  cx: number;
  cy: number;
  tw: number;
  th: number;
  seats: { top: number; right: number; bottom: number; left: number };
  dimmed?: boolean;
  showLabels?: boolean;
  colorMode?: "status" | "timeSlot";
}

const RestaurantTable = ({ id, data, onClick, onDrop, cx, cy, tw, th, seats, dimmed = false, showLabels = true, colorMode = "status" }: RestaurantTableProps) => {
  const [hovered, setHovered] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const s = STATUS_FILLS[data.status] || STATUS_FILLS.free;
  const isReserved = data.status === "reserved";
  const isPresent = data.status === "present";
  const isBlocked = data.status === "blocked";
  const isFree = data.status === "free";

  // Color mode override
  const useTimeSlot = colorMode === "timeSlot" && !isFree && !isBlocked;
  const tsFill = useTimeSlot ? TIME_SLOT_FILLS[getTimeSlot(data.startTime)] : null;
  const fillColor = tsFill ? tsFill.fill : s.fill;
  const numColor = tsFill ? tsFill.numColor : s.numColor;

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

  const hasInfo = data.guest || data.startTime || data.pax;

  return (
    <g
      id={id}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setDragOver(false); }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const resId = e.dataTransfer.getData("reservationId");
        if (resId && onDrop) onDrop(resId);
      }}
      style={{
        cursor: dimmed ? "default" : "pointer",
        opacity: groupOpacity,
        transform: `scale(${scale})`,
        transformOrigin: `${cx}px ${cy}px`,
        transition: "opacity 0.4s ease, transform 0.2s ease",
      }}
    >
      {/* Pulse ring for "present" status (check-in animation) */}
      {isPresent && !dimmed && (
        <>
          <rect
            className="pulse-ring"
            x={cx - halfW - 6} y={cy - halfH - 6}
            width={tableW + 12} height={tableH + 12} rx={8}
            fill="none" stroke="#1e8a38" strokeWidth={2}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
          <rect
            className="pulse-ring"
            x={cx - halfW - 10} y={cy - halfH - 10}
            width={tableW + 20} height={tableH + 20} rx={10}
            fill="none" stroke="#1e8a38" strokeWidth={1}
            style={{ transformOrigin: `${cx}px ${cy}px`, animationDelay: "0.8s" }}
          />
        </>
      )}

      {/* Drop shadow */}
      {hovered && !dimmed && (
        <ellipse cx={cx} cy={cy + halfH + 2} rx={halfW + 4} ry={6}
          fill="rgba(0,0,0,0.25)" />
      )}

      {/* Chair stubs */}
      {allChairs.map((c, i) => (
        <rect key={i} x={c.x} y={c.y} width={c.w} height={c.h} rx={cR}
          fill={fillColor} opacity={s.chairOpacity}
          stroke={strokeCol} strokeWidth={0.5}
          className={isPresent ? "status-transition" : undefined}
        />
      ))}

      {/* Drag-over highlight */}
      {dragOver && !dimmed && (
        <rect
          x={cx - halfW - 8} y={cy - halfH - 8} width={tableW + 16} height={tableH + 16} rx={8}
          fill="none" stroke="#c9a84c" strokeWidth={3} strokeDasharray="6 3"
          style={{ animation: "pulseRing 1s ease-out infinite" }}
        />
      )}

      {/* Table body */}
      <rect
        x={cx - halfW} y={cy - halfH} width={tableW} height={tableH} rx={5}
        fill={fillColor} opacity={s.opacity}
        stroke={dragOver && !dimmed ? "#c9a84c" : hovered && !dimmed ? "rgba(255,255,255,0.5)" : strokeCol}
        strokeWidth={dragOver && !dimmed ? 2.5 : hovered && !dimmed ? 1.8 : 1.2}
        filter={hovered && !dimmed ? "url(#tableGlow)" : isPresent && !dimmed ? "url(#pulseGlow)" : undefined}
        className={isPresent ? "status-transition" : undefined}
      />

      {/* Inner highlight for depth */}
      <rect
        x={cx - halfW + 2} y={cy - halfH + 1} width={tableW - 4} height={tableH / 2 - 1} rx={3}
        fill="rgba(255,255,255,0.08)" opacity={s.opacity}
      />

      {/* Table number */}
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central"
        fontSize={12} fontWeight={700} fill={numColor}
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
