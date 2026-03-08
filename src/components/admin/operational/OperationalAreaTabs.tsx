import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Settings, Eye, EyeOff, ZoomIn, ZoomOut, Palette, LayoutGrid } from "lucide-react";
import type { FloorArea } from "@/components/admin/floorplan/types";

const AREA_TABS: { id: FloorArea; label: string; emoji: string }[] = [
  { id: "all", label: "Alle Bereiche", emoji: "🏠" },
  { id: "hauptbereich", label: "Restaurant 140 Zoll", emoji: "📺" },
  { id: "fenster", label: "Restaurant 75 Zoll", emoji: "🪟" },
  { id: "billard", label: "Billard / Kicker / Dart", emoji: "🎱" },
  { id: "vip", label: "VIP-Raum", emoji: "⭐" },
  { id: "podest", label: "Podest", emoji: "🔺" },
];

export type ColorMode = "status" | "timeSlot";

interface Props {
  activeArea: FloorArea;
  onAreaChange: (area: FloorArea) => void;
  showLabels?: boolean;
  onToggleLabels?: () => void;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  colorMode?: ColorMode;
  onColorModeChange?: (mode: ColorMode) => void;
}

export const OperationalAreaTabs = ({
  activeArea, onAreaChange, showLabels = true, onToggleLabels,
  zoom = 1, onZoomChange, colorMode = "status", onColorModeChange,
}: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
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
            <button key={tab.id} onClick={() => onAreaChange(tab.id)} style={{
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
              <span style={{ fontSize: 14 }}>{tab.emoji}</span>
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

      {/* Ansicht ändern button */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "0 12px 0 8px",
            borderLeft: "1px solid #333",
            height: 30, marginLeft: 4,
            background: "transparent", border: "none", cursor: "pointer",
          }}
        >
          <Settings size={14} style={{ color: menuOpen ? "#fff" : "#888", transition: "color 0.15s" }} />
          <span style={{ fontSize: 12, color: menuOpen ? "#fff" : "#888", whiteSpace: "nowrap", fontWeight: 500, transition: "color 0.15s" }}>Ansicht ändern</span>
        </button>

        {/* Dropdown menu */}
        {menuOpen && (
          <>
            <div onClick={() => setMenuOpen(false)} style={{
              position: "fixed", inset: 0, zIndex: 90,
            }} />
            <div style={{
              position: "absolute", top: 42, right: 0, zIndex: 100,
              width: 240, background: "#1a1a1a", border: "1px solid #333",
              borderRadius: 10, overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {/* Labels section */}
              <div style={{ padding: "8px 12px", borderBottom: "1px solid #2a2a2a" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.05em" }}>Labels</span>
              </div>
              <button
                onClick={() => { onToggleLabels?.(); setMenuOpen(false); }}
                style={menuItemStyle}
                onMouseEnter={e => (e.currentTarget.style.background = "#252525")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                {showLabels ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>{showLabels ? "Labels ausblenden" : "Labels einblenden"}</span>
              </button>

              {/* Zoom section */}
              <div style={{ padding: "8px 12px", borderBottom: "1px solid #2a2a2a", borderTop: "1px solid #2a2a2a" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.05em" }}>Zoom</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}>
                <button
                  onClick={() => onZoomChange?.(Math.max(0.5, zoom - 0.1))}
                  style={zoomBtnStyle}
                  onMouseEnter={e => (e.currentTarget.style.background = "#333")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#252525")}
                >
                  <ZoomOut size={14} />
                </button>
                <div style={{
                  flex: 1, height: 4, background: "#333", borderRadius: 2, position: "relative",
                }}>
                  <div style={{
                    position: "absolute", left: 0, top: 0, height: "100%",
                    width: `${((zoom - 0.5) / 1.5) * 100}%`,
                    background: "linear-gradient(90deg, #3a7bd5, #6aa3f0)",
                    borderRadius: 2, transition: "width 0.15s ease",
                  }} />
                </div>
                <button
                  onClick={() => onZoomChange?.(Math.min(2, zoom + 0.1))}
                  style={zoomBtnStyle}
                  onMouseEnter={e => (e.currentTarget.style.background = "#333")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#252525")}
                >
                  <ZoomIn size={14} />
                </button>
                <span style={{ fontSize: 11, color: "#888", minWidth: 36, textAlign: "right" }}>
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              {/* Color scheme section */}
              <div style={{ padding: "8px 12px", borderBottom: "1px solid #2a2a2a", borderTop: "1px solid #2a2a2a" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.05em" }}>Farbschema</span>
              </div>
              <button
                onClick={() => { onColorModeChange?.("status"); setMenuOpen(false); }}
                style={{ ...menuItemStyle, color: colorMode === "status" ? "#fff" : "#999" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#252525")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <LayoutGrid size={14} />
                <span>Nach Status</span>
                {colorMode === "status" && <span style={{ marginLeft: "auto", fontSize: 11, color: "#3a7bd5" }}>✓</span>}
              </button>
              <button
                onClick={() => { onColorModeChange?.("timeSlot"); setMenuOpen(false); }}
                style={{ ...menuItemStyle, color: colorMode === "timeSlot" ? "#fff" : "#999" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#252525")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <Palette size={14} />
                <span>Nach Zeitslot</span>
                {colorMode === "timeSlot" && <span style={{ marginLeft: "auto", fontSize: 11, color: "#3a7bd5" }}>✓</span>}
              </button>

              {/* Time slot legend when active */}
              {colorMode === "timeSlot" && (
                <div style={{ padding: "6px 12px 10px", borderTop: "1px solid #2a2a2a" }}>
                  {[
                    { label: "10–14 Uhr", color: "#f59e0b" },
                    { label: "14–18 Uhr", color: "#3b82f6" },
                    { label: "18–22 Uhr", color: "#8b5cf6" },
                    { label: "22+ Uhr", color: "#ec4899" },
                  ].map(s => (
                    <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color }} />
                      <span style={{ fontSize: 11, color: "#888" }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const menuItemStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10, width: "100%",
  padding: "10px 12px", background: "transparent", border: "none",
  cursor: "pointer", color: "#ccc", fontSize: 13,
  transition: "background 0.1s",
};

const zoomBtnStyle: React.CSSProperties = {
  width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
  background: "#252525", border: "1px solid #333", borderRadius: 6,
  color: "#ccc", cursor: "pointer", transition: "background 0.1s",
};
