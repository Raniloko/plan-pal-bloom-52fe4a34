/**
 * Display names for the restaurant areas in the admin. The database keys are
 * historical: "hauptbereich" is the 140-inch restaurant and "fenster" the
 * 75-inch restaurant – there is no separate "Hauptbereich".
 */
export const AREA_LABELS: Record<string, string> = {
  hauptbereich: "Restaurant 140 Zoll",
  fenster: "Restaurant 75 Zoll",
  salitos: "Salitos Lounge / Outdoor",
  billard: "Billard",
  vip: "VIP-Raum",
  podest: "Podest",
  restaurant: "Restaurant",
};

export const areaLabel = (area: string | null | undefined) =>
  area ? AREA_LABELS[area] ?? area : "";
