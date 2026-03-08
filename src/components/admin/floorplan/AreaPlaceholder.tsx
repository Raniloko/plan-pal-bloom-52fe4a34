import { Monitor } from "lucide-react";

interface AreaPlaceholderProps {
  title: string;
  desc: string;
  icon?: React.ReactNode;
  img?: string;
}

const AreaPlaceholder = ({ title, desc, icon, img }: AreaPlaceholderProps) => {
  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#111111", fontFamily: "'DM Sans', sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      {img && (
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${img})`,
          backgroundSize: "cover", backgroundPosition: "center",
          opacity: 0.15, filter: "blur(2px)",
        }} />
      )}

      <div style={{
        position: "relative", zIndex: 1, textAlign: "center",
        padding: 40, maxWidth: 500,
      }}>
        <div style={{
          marginBottom: 16, display: "flex", justifyContent: "center",
          filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))",
          color: "#555",
        }}>
          {icon || <Monitor size={56} />}
        </div>
        <h2 style={{
          fontSize: 28, fontWeight: 700, color: "#fff",
          marginBottom: 8, letterSpacing: "-0.02em",
        }}>
          {title}
        </h2>
        <p style={{
          fontSize: 15, color: "#999", lineHeight: 1.6,
          marginBottom: 24,
        }}>
          {desc}
        </p>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "10px 20px", borderRadius: 10,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#888", fontSize: 13, fontWeight: 500,
        }}>
          Grundriss wird erstellt
        </div>
      </div>
    </div>
  );
};

export default AreaPlaceholder;
