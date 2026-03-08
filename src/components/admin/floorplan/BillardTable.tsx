import { TableData, STATUS_FILLS } from "./types";

interface BillardTableProps {
  id: string;
  data: TableData;
  onClick: () => void;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: { angle: number; cx: number; cy: number };
  strokeColor?: string;
  strokeWidth?: number;
}

const BillardTable = ({ id, data, onClick, x, y, w, h, rotation, strokeColor = "#7a4e1a", strokeWidth = 5 }: BillardTableProps) => {
  const isReserved = data.status === "reserved";
  const isPresent = data.status === "present";
  const sc = isReserved ? "#3a6adb" : isPresent ? "#1e8a38" : strokeColor;
  const sw = isReserved ? 4 : strokeWidth;

  const cx = x + w / 2;
  const cy = y + h / 2;

  // Pocket positions: 4 corners + 2 midpoints on long sides
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

  return (
    <g
      id={id}
      transform={rotation ? `rotate(${rotation.angle}, ${rotation.cx}, ${rotation.cy})` : undefined}
      onClick={onClick}
      style={{ cursor: "pointer" }}
      className="hover:brightness-110"
    >
      {/* Outer frame */}
      <rect x={x} y={y} width={w} height={h} rx={6} fill="#1c6e2a" stroke={sc} strokeWidth={sw} />
      {/* Felt */}
      <rect x={x + 5} y={y + 5} width={w - 10} height={h - 10} rx={4} fill="#1e7830" opacity={0.6} />
      {/* Blue tint overlay for reserved */}
      {isReserved && <rect x={x + 5} y={y + 5} width={w - 10} height={h - 10} rx={4} fill="rgba(58,106,219,0.06)" />}
      {/* Pockets */}
      {pockets.map((p, i) => (
        <circle key={i} cx={p.px} cy={p.py} r={7} fill="#0a0a0a" />
      ))}
      {/* Center line */}
      <line x1={cx} y1={y + 5} x2={cx} y2={y + h - 4} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
      {/* Balls */}
      {balls.map((b, i) => (
        <circle key={i} cx={b.bx} cy={b.by} r={b.r} fill={b.color} opacity={b.op} />
      ))}
      {/* Glow */}
      <ellipse cx={cx} cy={cy} rx={30} ry={18} fill="rgba(255,200,80,0.06)" />
      {/* Label */}
      <text x={cx} y={labelY} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.1)" fontFamily="'DM Sans', sans-serif">{label}</text>

      {/* Name tag for reserved/present */}
      {data.guest && (isReserved || isPresent) && (
        <>
          {isPresent && data.startTime && (
            <>
              <rect x={x} y={y + h + 5} width={w} height={13} rx={3} fill="rgba(0,0,0,0.6)" />
              <text x={cx} y={y + h + 15} textAnchor="middle" fontSize={9} fontWeight={700} fill="#5de88a" fontFamily="'DM Sans', sans-serif">{data.startTime}</text>
            </>
          )}
          <rect x={x} y={y + h + (isPresent ? 19 : 5)} width={w} height={16} rx={3} fill={isPresent ? "#1e8a38" : "#3a6adb"} />
          <text x={cx} y={y + h + (isPresent ? 30 : 16)} textAnchor="middle" fontSize={10} fontWeight={700} fill="#fff" fontFamily="'DM Sans', sans-serif">
            {data.guest}
          </text>
          {isReserved && data.startTime && data.endTime && (
            <>
              <rect x={x} y={y + h + 22} width={w} height={13} rx={2} fill="rgba(0,0,0,0.45)" />
              <text x={cx} y={y + h + 32} textAnchor="middle" fontSize={9} fill="#7aadff" fontFamily="'DM Sans', sans-serif">
                {data.startTime} - {data.endTime}
              </text>
            </>
          )}
        </>
      )}
    </g>
  );
};

export default BillardTable;
