import { useState } from "react";
import { TableData, STATUS_FILLS, TIME_SLOT_FILLS, getTimeSlot } from "./types";
import { useTableDrag } from "./useTableDrag";

interface BillardTableProps {
  id: string;
  data: TableData;
  onClick: () => void;
  onDrop?: (reservationId: string) => void;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: { angle: number; cx: number; cy: number };
  strokeColor?: string;
  strokeWidth?: number;
  dimmed?: boolean;
  showLabels?: boolean;
  colorMode?: "status" | "timeSlot";
}

const BillardTable = ({ id, data, onClick, onDrop, x, y, w, h, rotation, strokeColor = "#7a4e1a", strokeWidth = 5, dimmed = false, showLabels = true, colorMode = "status" }: BillardTableProps) => {
  const [hovered, setHovered] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dragging, setDragging] = useState(false);
  const isReserved = data.status === "reserved";
  const isPresent = data.status === "present";
  const isFree = data.status === "free";
  const isBlocked = data.status === "blocked";

  // Color mode
  const useTimeSlot = colorMode === "timeSlot" && !isFree && !isBlocked;
  const tsFill = useTimeSlot ? TIME_SLOT_FILLS[getTimeSlot(data.startTime)] : null;

  const sc = tsFill ? tsFill.fill : isReserved ? "#3a6adb" : isPresent ? "#1e8a38" : strokeColor;
  const sw = isReserved ? 4 : strokeWidth;

  const cx = x + w / 2;
  const cy = y + h / 2;

  const pockets = [
    { px: x + 4, py: y + 4 },
    { px: x + w - 4, py: y + 4 },
    { px: x + 4, py: y + h - 2 },
    { px: x + w - 4, py: y + h - 2 },
    { px: x + 4, py: cy },
    { px: x + w - 4, py: cy },
  ];

  const balls = [
    { bx: cx - 45, by: cy - 23, r: 7, color: "#f0f0f0", op: 0.75 },
    { bx: cx - 15, by: cy - 8, r: 6, color: "#cc2222", op: 0.8 },
    { bx: cx - 65, by: cy + 7, r: 6, color: "#f5c842", op: 0.75 },
    { bx: cx + 25, by: cy - 18, r: 6, color: "#1a4adc", op: 0.75 },
    { bx: cx + 45, by: cy + 22, r: 6, color: "#f0f0f0", op: 0.55 },
    { bx: cx - 35, by: cy + 32, r: 5, color: "#cc2222", op: 0.6 },
    { bx: cx + 15, by: cy + 12, r: 5, color: "#f5c842", op: 0.6 },
  ];

  const labelY = y - 8;
  const label = data.title.toUpperCase();
  const groupOpacity = dimmed ? 0.2 : 1;
  const scale = hovered && !dimmed ? 1.03 : 1;
  const hasInfo = data.guest || data.startTime || data.pax;
  const isDraggable = !!data.reservationId && !dimmed;
  const { touchDragging, isRebookSource, wrapClick, pointerProps } = useTableDrag({
    id,
    reservationId: data.reservationId,
    enabled: isDraggable,
    onDrop,
    label: data.title,
    guest: data.guest,
    time: data.startTime,
    status: data.status,
  });

  return (
    <g
      id={id}
      data-table-id={id}
      data-table-drag-source={isRebookSource ? "1" : undefined}
      transform={rotation ? `rotate(${rotation.angle}, ${rotation.cx}, ${rotation.cy})` : undefined}
      onClick={wrapClick(onClick)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setDragOver(false); }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const resId = e.dataTransfer.getData("reservationId");
        const fromUnit = e.dataTransfer.getData("fromUnitId");
        if (resId && onDrop && fromUnit !== id) onDrop(resId);
      }}
      {...pointerProps}
      {...(isDraggable ? {
        draggable: true,
        onDragStart: (e: React.DragEvent) => {
          e.dataTransfer.setData("reservationId", data.reservationId!);
          e.dataTransfer.setData("fromUnitId", id);
          e.dataTransfer.effectAllowed = "move";
          setDragging(true);
        },
        onDragEnd: () => setDragging(false),
      } as any : {})}
      style={{
        cursor: dimmed ? "default" : isDraggable ? "grab" : "pointer",
        opacity: dragging || touchDragging ? 0.5 : groupOpacity,
        transition: "opacity 0.4s ease",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        touchAction: isDraggable ? "none" : "manipulation",
      }}
    >
      {/* Pulse ring for "present" status */}
      {isPresent && !dimmed && (
        <>
          <rect
            className="pulse-ring"
            x={x - 4} y={y - 4} width={w + 8} height={h + 8} rx={8}
            fill="none" stroke="#1e8a38" strokeWidth={2}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
          <rect
            className="pulse-ring"
            x={x - 8} y={y - 8} width={w + 16} height={h + 16} rx={10}
            fill="none" stroke="#1e8a38" strokeWidth={1}
            style={{ transformOrigin: `${cx}px ${cy}px`, animationDelay: "0.8s" }}
          />
        </>
      )}

      {/* Shadow underneath */}
      {hovered && !dimmed && (
        <ellipse cx={cx} cy={y + h + 6} rx={w / 2 - 10} ry={8}
          fill="rgba(0,0,0,0.3)" />
      )}

      {/* Drag-over highlight */}
      {dragOver && !dimmed && (
        <rect x={x - 4} y={y - 4} width={w + 8} height={h + 8} rx={8}
          fill="none" stroke="#c9a84c" strokeWidth={3} strokeDasharray="6 3"
          style={{ animation: "pulseRing 1s ease-out infinite" }}
        />
      )}

      {/* Outer frame */}
      <rect x={x} y={y} width={w} height={h} rx={6}
        fill={tsFill ? tsFill.fill : "#1c6e2a"}
        stroke={dragOver && !dimmed ? "#c9a84c" : hovered && !dimmed ? "rgba(255,255,255,0.4)" : sc}
        strokeWidth={dragOver && !dimmed ? sw + 2 : hovered && !dimmed ? sw + 1 : sw}
        filter={hovered && !dimmed ? "url(#tableGlow)" : isPresent && !dimmed ? "url(#pulseGlow)" : undefined}
        className={isPresent ? "status-transition" : undefined}
      />
      {/* Wood border inner highlight */}
      <rect x={x + 2} y={y + 2} width={w - 4} height={4} rx={2}
        fill="rgba(255,255,255,0.06)" />

      {/* Felt */}
      {!tsFill && (
        <>
          <rect x={x + 5} y={y + 5} width={w - 10} height={h - 10} rx={4} fill="#1e7830" opacity={0.6} />
          {isReserved && <rect x={x + 5} y={y + 5} width={w - 10} height={h - 10} rx={4} fill="rgba(58,106,219,0.06)" />}
        </>
      )}

      {/* Pockets */}
      {pockets.map((p, i) => (
        <g key={i}>
          <circle cx={p.px} cy={p.py} r={7} fill="#0a0a0a" />
          <circle cx={p.px - 1} cy={p.py - 1} r={3} fill="rgba(255,255,255,0.04)" />
        </g>
      ))}

      {/* Center line */}
      <line x1={cx} y1={y + 5} x2={cx} y2={y + h - 4} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />

      {/* Balls */}
      {!tsFill && balls.map((b, i) => (
        <g key={i}>
          <circle cx={b.bx} cy={b.by} r={b.r} fill={b.color} opacity={b.op} />
          <circle cx={b.bx - 1} cy={b.by - 2} r={b.r * 0.35} fill="rgba(255,255,255,0.3)" opacity={b.op} />
        </g>
      ))}

      {/* Glow */}
      <ellipse cx={cx} cy={cy} rx={30} ry={18} fill="rgba(255,200,80,0.06)" />

      {/* Label */}
      <text x={cx} y={labelY} textAnchor="middle" fontSize={11} fontWeight={600} fill="rgba(255,255,255,0.85)" fontFamily="'DM Sans', sans-serif">{label}</text>

      {/* Center overlay: name + time for reserved/present */}
      {showLabels && data.guest && (isReserved || isPresent) && (
        <>
          <rect x={cx - w / 2 + 10} y={cy - 22} width={w - 20} height={44} rx={6}
            fill="rgba(0,0,0,0.78)" stroke={isPresent ? "#1e8a38" : "#3a6adb"} strokeWidth={1.5} />
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize={13} fontWeight={700}
            fill="#fff" fontFamily="'DM Sans', sans-serif">
            {data.guest}
          </text>
          {data.startTime && (
            <text x={cx} y={cy + 14} textAnchor="middle" fontSize={11} fontWeight={600}
              fill={isPresent ? "#5de88a" : "#7aadff"} fontFamily="'DM Sans', sans-serif">
              {data.endTime ? `${data.startTime} – ${data.endTime}` : data.startTime}
              {data.pax ? ` · ${data.pax}P` : ""}
            </text>
          )}
        </>
      )}

      {/* Hover tooltip */}
      {hovered && !dimmed && hasInfo && (
        <g>
          <rect x={cx - 60} y={y - 48} width={120} height={38} rx={6}
            fill="rgba(0,0,0,0.88)" stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />
          <polygon points={`${cx - 5},${y - 10} ${cx + 5},${y - 10} ${cx},${y - 4}`}
            fill="rgba(0,0,0,0.88)" />
          <text x={cx} y={y - 34} textAnchor="middle" fontSize={10} fontWeight={700} fill="#fff"
            fontFamily="'DM Sans', sans-serif">
            {data.guest || data.title}
          </text>
          <text x={cx} y={y - 20} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.7)"
            fontFamily="'DM Sans', sans-serif">
            {[data.startTime, data.pax ? `${data.pax} Gäste` : ""].filter(Boolean).join(" · ") || data.status}
          </text>
        </g>
      )}
    </g>
  );
};

export default BillardTable;
