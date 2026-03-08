export interface ReservationRow {
  id: string;
  time: string;
  guests: number;
  name: string;
  table: string;
  status: "ob" | "double-check" | "check" | "check-pause" | "none";
  highlighted: boolean;
  zone: string;
  customer_email: string;
  customer_phone: string;
  unit_id: string | null;
  occasion: string;
  message: string | null;
}

export interface PanelData {
  tableId?: string;
  tableLabel: string;
  guest?: string;
  startTime?: string;
  endTime?: string;
  pax?: number;
  reservationId?: string;
  status: "free" | "reserved" | "present" | "blocked";
  unitId?: string;
  unitNotes?: string;
}

export type PanelMode = "view" | "edit" | "book";

export const AREA_TABS = [
  { id: "billard", label: "1. Billard Tisch" },
  { id: "salitos", label: "2. Salitos Lounge / Outdoor" },
  { id: "rest140", label: "3. Restaurant 140 Zoll" },
  { id: "rest75", label: "4. Restaurant 75 Zoll / Sport" },
  { id: "vip", label: "5. VIP Raum / Sport" },
];
