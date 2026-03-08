export type TableStatus = "free" | "reserved" | "present" | "blocked";

export interface TableData {
  id: string;
  title: string;
  status: TableStatus;
  guest?: string;
  startTime?: string;
  endTime?: string;
  pax?: number;
  reservationId?: string;
}

export interface FloorPlanProps {
  tables: Record<string, TableData>;
  onTableClick?: (tableId: string, data: TableData) => void;
}

export const STATUS_FILLS = {
  free:     { fill: "#d4d4dc", opacity: 0.88, numColor: "#222", chairOpacity: 0.52 },
  reserved: { fill: "#3a7bd5", opacity: 0.92, numColor: "#fff", chairOpacity: 0.55 },
  present:  { fill: "#1e8a38", opacity: 0.95, numColor: "#fff", chairOpacity: 0.6  },
  blocked:  { fill: "#cc2222", opacity: 0.5,  numColor: "#fff", chairOpacity: 0.3  },
} as const;
