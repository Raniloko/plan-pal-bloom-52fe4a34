export type TableStatus = "free" | "reserved" | "present" | "blocked";

export type FloorArea = "billard" | "salitos" | "rest140" | "rest75" | "vip" | "all";

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
}

export interface FloorPlanProps {
  tables: Record<string, TableData>;
  onTableClick?: (tableId: string, data: TableData) => void;
  activeArea?: FloorArea;
  showLabels?: boolean;
}

export const STATUS_FILLS = {
  free:     { fill: "#d4d4dc", opacity: 0.88, numColor: "#222", chairOpacity: 0.52 },
  reserved: { fill: "#3a7bd5", opacity: 0.92, numColor: "#fff", chairOpacity: 0.55 },
  present:  { fill: "#1e8a38", opacity: 0.95, numColor: "#fff", chairOpacity: 0.6  },
  blocked:  { fill: "#cc2222", opacity: 0.5,  numColor: "#fff", chairOpacity: 0.3  },
} as const;

// Map table IDs to floor areas
export const TABLE_AREA_MAP: Record<string, FloorArea> = {
  t10: "salitos",
  t30: "salitos",
  t50: "rest140",
  t52: "rest140",
  t53: "rest140",
  t54: "rest140",
  t59: "rest75",
  t60: "rest75",
  t61: "rest75",
  t62: "rest75",
  t63: "rest75",
  t64: "rest75",
  t65: "rest75",
  t66: "rest75",
  t67: "rest75",
  b1: "billard",
  b2: "billard",
  b3: "billard",
};
