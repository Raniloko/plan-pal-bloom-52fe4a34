import { TableData } from "./types";

interface Props {
  id: string;
  data: TableData;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: { angle: number; cx: number; cy: number };
  onClick?: () => void;
}

const BALLS_TEMPLATE = [
  { dx: -45, dy: -23, r: 7, color: "#f0f0f0", op: 0.75 },
  { dx: -15, dy: -8,  r: 6, color: "#cc2222", op: 0.8 },
  { dx: -65, dy: 7,   r: 6, color: "#f5c842", op: 0.75 },
  { dx: 25,  dy: -18, r: 6, color: "#1a4adc", op: 0.75 },
  { dx: 45,  dy: 22,  r: 6, color: "#f0f0f0", op: 0.55 },
  { dx: -35, dy: 32,  r: 5, color: "#cc2222", op: 0.6 },
  { dx: 15,  dy: 12,  r: 5, color: "#f5c842", op: 0.6 },
];

const BillardTable = ({ id, data, x, y, w, h, rotation, onClick }: Props) => {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const isReserved = data.status === "reserved";
  const isPresent = data.status === "present";
  const strokeColor = isReserved ? "#3a6adb" : isPresent ? "#1e8a38" : "#7a4e1a";
  const strokeW = isReserved || isPresent ? 4 : 5;

  const pockets = [
    [x - 1, y - 1], [x + w + 1, y - 1],
    [x - 1, y + h + 2], [x + w + 1, y + h + 2],
    [x - 1, cy], [x + w + 1, cy],
  ];

  const transform = rotation ? `rotate(${rotation.angle}, ${rotation.cx}, ${rotation.cy})` : undefined;

  return (
    <g onClick={onClick} style={{ cursor: "pointer" }} transform={transform}
       className="transition-all hover:brightness-[1.15]">
      {/* Outer */}
      <rect x={x} y={y} width={w} height={h} rx={6} fill="#1c6e2a" stroke={strokeColor} strokeWidth={strokeW} />
      {/* Inner felt */}
      <rect x={x + 5} y={y + 5} width={w - 10} height={h - 10} rx={4} fill="#1e7830" opacity={0.6} />
      {isReserved && <rect x={x + 5} y={y + 5} width={w - 10} height={h - 10} rx={4} fill="rgba(58,106,219,0.06)" />}
      {/* Pockets */}
      {pockets.map(([px, py], i) => (
        <circle key={i} cx={px} cy={py} r={7} fill="#0a0a0a" />
      ))}
      {/* Center line */}
      <line x1={cx} y1={y + 5} x2={cx} y2={y + h - 5} stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} />
      {/* Balls */}
      {BALLS_TEMPLATE.map((b, i) => (
        <circle key={i} cx={cx + b.dx} cy={cy + b.dy} r={b.r} fill={b.color} opacity={b.op} />
      ))}
      {/* Glow */}
      <ellipse cx={cx} cy={cy} rx={30} ry={18} fill="rgba(255,200,80,0.06)" />
      {/* Label */}
      <text x={cx} y={y - 8} textAnchor="middle" fill="rgba(255,255,255,0.1)" fontSize={10}
            fontFamily="'DM Sans', sans-serif">{data.title.toUpperCase()}</text>

      {/* Name tag for reserved */}
      {isReserved && data.guest && (
        <>
          <rect x={x} y={y + h + 5} width={w} height={16} rx={3} fill="#3a7bd5" />
          <text x={cx} y={y + h + 16} textAnchor="middle" fill="#fff" fontSize={10} fontWeight="bold"
                fontFamily="'DM Sans', sans-serif">{data.guest}</text>
          {data.startTime && data.endTime && (
            <>
              <rect x={x} y={y + h + 22} width={w} height={13} rx={3} fill="rgba(0,0,0,0.45)" />
              <text x={cx} y={y + h + 32} textAnchor="middle" fill="#7aadff" fontSize={9} fontWeight="bold"
                    fontFamily="'DM Sans', sans-serif">{data.startTime} - {data.endTime}</text>
            </>
          )}
        </>
      )}

      {/* Name tag for present */}
      {isPresent && data.guest && (
        <>
          {data.startTime && (
            <>
              <rect x={cx - 23} y={y - 24} width={46} height={13} rx={3} fill="rgba(0,0,0,0.6)" />
              <text x={cx} y={y - 14} textAnchor="middle" fill="#5de88a" fontSize={9} fontWeight="bold"
                    fontFamily="'DM Sans', sans-serif">{data.startTime}</text>
            </>
          )}
          <rect x={x} y={y + h + 5} width={w} height={16} rx={3} fill="#1e8a38" />
          <text x={cx} y={y + h + 16} textAnchor="middle" fill="#fff" fontSize={10} fontWeight="bold"
                fontFamily="'DM Sans', sans-serif">{data.pax} | {data.guest}</text>
        </>
      )}
    </g>
  );
};

export default BillardTable;
