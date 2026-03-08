export type TableStatus = "free" | "reserved" | "present" | "blocked";

export type FloorArea = "all" | "hauptbereich" | "fenster" | "billard" | "vip" | "podest";

export interface TableData {
  id: string;
  title: string;
  status: TableStatus;
  guest?: string;
  startTime?: string;
  endTime?: string;
  pax?: number;
  reservationId?: string;
  area?: FloorArea;
  /** Timestamp when status last changed – used for pulse animation */
  statusChangedAt?: number;
}

export interface FloorPlanProps {
  tables: Record<string, TableData>;
  onTableClick?: (tableId: string, data: TableData) => void;
  activeArea?: FloorArea;
  showLabels?: boolean;
  zoom?: number;
  colorMode?: "status" | "timeSlot";
}

export const STATUS_FILLS = {
  free:     { fill: "#d4d4dc", opacity: 0.88, numColor: "#222", chairOpacity: 0.52 },
  reserved: { fill: "#3a7bd5", opacity: 0.92, numColor: "#fff", chairOpacity: 0.55 },
  present:  { fill: "#1e8a38", opacity: 0.95, numColor: "#fff", chairOpacity: 0.6  },
  blocked:  { fill: "#cc2222", opacity: 0.5,  numColor: "#fff", chairOpacity: 0.3  },
} as const;

// Time-slot based color fills
export const TIME_SLOT_FILLS: Record<string, { fill: string; numColor: string }> = {
  morning:   { fill: "#f59e0b", numColor: "#fff" },  // 10-14
  afternoon: { fill: "#3b82f6", numColor: "#fff" },  // 14-18
  evening:   { fill: "#8b5cf6", numColor: "#fff" },  // 18-22
  night:     { fill: "#ec4899", numColor: "#fff" },   // 22+
};

export const getTimeSlot = (time?: string): string => {
  if (!time) return "morning";
  const h = parseInt(time.split(":")[0], 10);
  if (h < 14) return "morning";
  if (h < 18) return "afternoon";
  if (h < 22) return "evening";
  return "night";
};

// All current SVG tables belong to "hauptbereich" (Restaurant 140Zoll area)
export const TABLE_AREA_MAP: Record<string, FloorArea> = {
  t10: "hauptbereich",
  t30: "hauptbereich",
  t50: "hauptbereich",
  t52: "hauptbereich",
  t53: "hauptbereich",
  t54: "hauptbereich",
  t59: "hauptbereich",
  t60: "hauptbereich",
  t61: "hauptbereich",
  t62: "hauptbereich",
  t63: "hauptbereich",
  t64: "hauptbereich",
  t65: "hauptbereich",
  t66: "hauptbereich",
  t67: "hauptbereich",
  b1: "hauptbereich",
  b2: "hauptbereich",
  b3: "hauptbereich",
};
