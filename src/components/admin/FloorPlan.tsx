import { useMemo } from "react";

interface Reservation {
  id: string;
  reservation_date: string;
  reservation_time: string;
  guest_count: number;
  zone: string;
  status: string;
  customer_name: string;
}

interface FloorPlanProps {
  reservations: Reservation[];
  selectedDate: string;
}

const BILLIARD_TABLES = [
  { id: "b1", label: "Tisch 1", x: 60, y: 60 },
  { id: "b2", label: "Tisch 2", x: 200, y: 60 },
  { id: "b3", label: "Tisch 3", x: 340, y: 60 },
  { id: "b4", label: "Tisch 4", x: 480, y: 60 },
  { id: "b5", label: "Tisch 5", x: 60, y: 200 },
  { id: "b6", label: "Tisch 6", x: 200, y: 200 },
  { id: "b7", label: "Tisch 7", x: 340, y: 200 },
  { id: "b8", label: "Tisch 8", x: 480, y: 200 },
];

const DINING_TABLES = [
  { id: "t1", label: "Tisch A", x: 680, y: 60, seats: 4 },
  { id: "t2", label: "Tisch B", x: 680, y: 170, seats: 4 },
  { id: "t3", label: "Tisch C", x: 680, y: 280, seats: 6 },
  { id: "t4", label: "Tisch D", x: 810, y: 60, seats: 4 },
  { id: "t5", label: "Tisch E", x: 810, y: 170, seats: 4 },
  { id: "t6", label: "Tisch F", x: 810, y: 280, seats: 6 },
];

const FloorPlan = ({ reservations, selectedDate }: FloorPlanProps) => {
  const activeReservations = useMemo(
    () =>
      reservations.filter(
        (r) => r.reservation_date === selectedDate && r.status !== "cancelled"
      ),
    [reservations, selectedDate]
  );

  const billardReservations = activeReservations.filter((r) => r.zone === "billard");
  const vipReservations = activeReservations.filter((r) => r.zone === "vip");
  const hauptbereichReservations = activeReservations.filter(
    (r) => r.zone === "hauptbereich" || r.zone === "fenster" || r.zone === "podest"
  );

  const billardOccupied = billardReservations.length;
  const vipOccupied = vipReservations.length > 0;

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl">
          Raumplan <span className="text-primary">{selectedDate}</span>
        </h2>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-green-500/30 border border-green-500" /> Frei
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-primary/30 border border-primary" /> Reserviert
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox="0 0 960 440" className="w-full min-w-[600px] h-auto">
          {/* Background */}
          <rect x="0" y="0" width="960" height="440" rx="8" fill="hsl(0 0% 6%)" />

          {/* Billard Area */}
          <rect x="20" y="20" width="600" height="280" rx="6" fill="none" stroke="hsl(0 0% 25%)" strokeWidth="1.5" strokeDasharray="6 3" />
          <text x="320" y="310" textAnchor="middle" fill="hsl(0 0% 50%)" fontSize="13" fontFamily="Inter">
            BILLARD AREA
          </text>

          {BILLIARD_TABLES.map((table, i) => {
            const isOccupied = i < billardOccupied;
            const res = isOccupied ? billardReservations[i] : null;
            return (
              <g key={table.id}>
                <rect
                  x={table.x}
                  y={table.y}
                  width="110"
                  height="55"
                  rx="4"
                  fill={isOccupied ? "hsl(51 100% 50% / 0.15)" : "hsl(120 50% 40% / 0.1)"}
                  stroke={isOccupied ? "hsl(51 100% 50%)" : "hsl(120 50% 40%)"}
                  strokeWidth="1.5"
                />
                {/* Green felt */}
                <rect
                  x={table.x + 8}
                  y={table.y + 8}
                  width="94"
                  height="39"
                  rx="2"
                  fill={isOccupied ? "hsl(51 100% 50% / 0.08)" : "hsl(140 40% 25% / 0.4)"}
                />
                <text x={table.x + 55} y={table.y + 24} textAnchor="middle" fill="hsl(0 0% 80%)" fontSize="10" fontFamily="Inter">
                  {table.label}
                </text>
                {res && (
                  <text x={table.x + 55} y={table.y + 40} textAnchor="middle" fill="hsl(51 100% 50%)" fontSize="9" fontFamily="Inter">
                    {res.customer_name.split(" ")[0]}
                  </text>
                )}
              </g>
            );
          })}

          {/* Dining / Hauptbereich */}
          <rect x="640" y="20" width="220" height="300" rx="6" fill="none" stroke="hsl(0 0% 25%)" strokeWidth="1.5" strokeDasharray="6 3" />
          <text x="750" y="340" textAnchor="middle" fill="hsl(0 0% 50%)" fontSize="13" fontFamily="Inter">
            HAUPTBEREICH
          </text>

          {DINING_TABLES.map((table, i) => {
            const res = hauptbereichReservations[i] || null;
            const isOccupied = !!res;
            return (
              <g key={table.id}>
                <circle
                  cx={table.x + 45}
                  cy={table.y + 40}
                  r="35"
                  fill={isOccupied ? "hsl(51 100% 50% / 0.15)" : "hsl(120 50% 40% / 0.1)"}
                  stroke={isOccupied ? "hsl(51 100% 50%)" : "hsl(120 50% 40%)"}
                  strokeWidth="1.5"
                />
                <text x={table.x + 45} y={table.y + 36} textAnchor="middle" fill="hsl(0 0% 80%)" fontSize="10" fontFamily="Inter">
                  {table.label}
                </text>
                <text x={table.x + 45} y={table.y + 50} textAnchor="middle" fill="hsl(0 0% 50%)" fontSize="9" fontFamily="Inter">
                  {table.seats} Plätze
                </text>
                {res && (
                  <text x={table.x + 45} y={table.y + 64} textAnchor="middle" fill="hsl(51 100% 50%)" fontSize="9" fontFamily="Inter" fontWeight="600">
                    {res.customer_name.split(" ")[0]}
                  </text>
                )}
              </g>
            );
          })}

          {/* VIP Room */}
          <rect x="20" y="340" width="280" height="80" rx="6"
            fill={vipOccupied ? "hsl(51 100% 50% / 0.12)" : "hsl(120 50% 40% / 0.08)"}
            stroke={vipOccupied ? "hsl(51 100% 50%)" : "hsl(120 50% 40%)"}
            strokeWidth="1.5"
          />
          <text x="160" y="375" textAnchor="middle" fill="hsl(0 0% 80%)" fontSize="14" fontFamily="Bebas Neue" letterSpacing="2">
            VIP RAUM
          </text>
          {vipOccupied && (
            <text x="160" y="400" textAnchor="middle" fill="hsl(51 100% 50%)" fontSize="11" fontFamily="Inter">
              {vipReservations.map((r) => r.customer_name.split(" ")[0]).join(", ")}
            </text>
          )}

          {/* Podest */}
          <rect x="340" y="340" width="280" height="80" rx="6"
            fill={activeReservations.some((r) => r.zone === "podest") ? "hsl(51 100% 50% / 0.12)" : "hsl(120 50% 40% / 0.08)"}
            stroke={activeReservations.some((r) => r.zone === "podest") ? "hsl(51 100% 50%)" : "hsl(120 50% 40%)"}
            strokeWidth="1.5"
          />
          <text x="480" y="375" textAnchor="middle" fill="hsl(0 0% 80%)" fontSize="14" fontFamily="Bebas Neue" letterSpacing="2">
            PODEST (33 GÄSTE)
          </text>
          {activeReservations.filter((r) => r.zone === "podest").map((r, i) => (
            <text key={r.id} x="480" y={400 + i * 14} textAnchor="middle" fill="hsl(51 100% 50%)" fontSize="11" fontFamily="Inter">
              {r.customer_name.split(" ")[0]} ({r.guest_count} Gäste)
            </text>
          ))}

          {/* 140 Zoll Screen indicator */}
          <rect x="660" y="370" width="180" height="40" rx="4" fill="hsl(0 0% 12%)" stroke="hsl(0 0% 30%)" strokeWidth="1" />
          <text x="750" y="395" textAnchor="middle" fill="hsl(0 0% 50%)" fontSize="11" fontFamily="Inter">
            🖥 140-Zoll Screen
          </text>
        </svg>
      </div>
    </div>
  );
};

export default FloorPlan;
