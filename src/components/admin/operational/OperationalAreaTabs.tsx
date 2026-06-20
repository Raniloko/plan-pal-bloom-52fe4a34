import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { FloorArea } from "@/components/admin/floorplan/types";

const AREA_TABS: { id: FloorArea; label: string }[] = [
  { id: "hauptbereich", label: "Restaurant 140 Zoll" },
  { id: "fenster", label: "Restaurant 75 Zoll" },
  { id: "salitos", label: "Salitos Lounge / Outdoor" },
  { id: "billard", label: "Billard" },
  { id: "vip", label: "VIP-Raum" },
];

export type ColorMode = "status" | "timeSlot";
export type ViewMode = "floorplan" | "list";

interface Props {
  activeArea: FloorArea;
  onAreaChange: (area: FloorArea) => void;
  showLabels?: boolean;
  onToggleLabels?: () => void;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  colorMode?: ColorMode;
  onColorModeChange?: (mode: ColorMode) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

export const OperationalAreaTabs = ({
  activeArea, onAreaChange,
}: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => scrollRef.current?.scrollBy({ left: dir * 160, behavior: "smooth" });

  return (
    <div style={{
      display: "flex", alignItems: "center", height: 48, minHeight: 48,
      background: "linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)",
      borderBottom: "1px solid #333",
      fontFamily: "'DM Sans', sans-serif",
      padding: "0 4px",
      gap: 2,
      position: "relative",
    }}>
      <button onClick={() => scroll(-1)} style={{
        width: 28, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
        color: "#888", background: "transparent", border: "none", cursor: "pointer",
        flexShrink: 0,
      }}><ChevronLeft size={14} /></button>

      <div ref={scrollRef} style={{
        flex: 1, display: "flex", alignItems: "center", height: "100%",
        overflowX: "auto", scrollbarWidth: "none",
        gap: 4, padding: "0 4px",
      }}>
        {AREA_TABS.map(tab => {
          const active = activeArea === tab.id;
          return (
            <button key={tab.id} data-floor-area-tab={tab.id} onClick={() => onAreaChange(tab.id)} style={{
              padding: "6px 16px", height: 34, fontSize: 13, fontWeight: 600,
              whiteSpace: "nowrap", cursor: "pointer",
              borderRadius: 8,
              border: active ? "1px solid rgba(255,255,255,0.15)" : "1px solid transparent",
              color: active ? "#fff" : "#999",
              background: active
                ? "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)"
                : "transparent",
              boxShadow: active ? "0 1px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)" : "none",
              transition: "all 0.15s ease",
              letterSpacing: "0.01em",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {tab.label}
            </button>
          );
        })}
      </div>

      <button onClick={() => scroll(1)} style={{
        width: 28, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
        color: "#888", background: "transparent", border: "none", cursor: "pointer",
        flexShrink: 0,
      }}><ChevronRight size={14} /></button>
    </div>
  );
};
