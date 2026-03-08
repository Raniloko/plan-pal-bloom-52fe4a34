import { useRef } from "react";
import { ChevronLeft, ChevronRight, Settings } from "lucide-react";

const AREA_TABS = [
  { id: "billard", label: "1. Billiard Tisch" },
  { id: "salitos", label: "2. Salitos Lounge / Outdoor" },
  { id: "rest140", label: "3. Restaurant 140Zoll" },
  { id: "rest75", label: "4. Restaurant 75 Zoll / Sport" },
  { id: "vip", label: "5. VIP Raum / Sport" },
];

interface Props {
  activeArea: string;
  onAreaChange: (area: string) => void;
}

export const OperationalAreaTabs = ({ activeArea, onAreaChange }: Props) => {
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
            <button key={tab.id} onClick={() => onAreaChange(tab.id)} style={{
              padding: "6px 18px", height: 34, fontSize: 13, fontWeight: 600,
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

      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "0 12px 0 8px",
        borderLeft: "1px solid #333",
        height: 30, marginLeft: 4,
        flexShrink: 0,
      }}>
        <Settings size={14} style={{ color: "#888" }} />
        <span style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap", fontWeight: 500 }}>Ansicht ändern</span>
      </div>
    </div>
  );
};
