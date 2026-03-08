import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AREA_TABS } from "./types";

interface Props {
  activeArea: string;
  onAreaChange: (area: string) => void;
}

export const OperationalAreaTabs = ({ activeArea, onAreaChange }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 160, behavior: "smooth" });
  };

  return (
    <div className="flex items-center h-[44px] min-h-[44px] bg-[#1e1e1e]" style={{ borderBottom: "1px solid #2a2a2a" }}>
      {/* Left arrow */}
      <button
        onClick={() => scroll(-1)}
        className="w-8 h-full flex items-center justify-center text-[#666] hover:text-white shrink-0"
        style={{ borderRight: "1px solid #2a2a2a" }}
      >
        <ChevronLeft size={14} />
      </button>

      {/* Scrollable tabs */}
      <div
        ref={scrollRef}
        className="flex-1 flex items-center overflow-x-auto h-full"
        style={{ scrollbarWidth: "none" }}
      >
        {AREA_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onAreaChange(tab.id)}
            className="relative h-full shrink-0 whitespace-nowrap transition-colors"
            style={{
              padding: "0 22px",
              fontSize: 13,
              fontWeight: 600,
              color: activeArea === tab.id ? "#fff" : "#888",
              background: activeArea === tab.id ? "rgba(255,255,255,0.08)" : "transparent",
              borderBottom: activeArea === tab.id ? "2px solid #c9a84c" : "2px solid transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scroll(1)}
        className="w-8 h-full flex items-center justify-center text-[#666] hover:text-white shrink-0"
        style={{ borderLeft: "1px solid #2a2a2a" }}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
};
