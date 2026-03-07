import { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  trend?: string;
  glowColor?: string;
}

const StatCard = ({ title, value, icon: Icon, color, bgColor, trend, glowColor }: StatCardProps) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value === 0) { setDisplayValue(0); return; }
    const duration = 600;
    const steps = 20;
    const increment = value / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= value) { setDisplayValue(value); clearInterval(interval); }
      else setDisplayValue(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(interval);
  }, [value]);

  return (
    <div className={`glass-card glass-card-hover rounded-xl p-5 relative overflow-hidden`}
      style={{ borderTopColor: glowColor || 'transparent', borderTopWidth: '2px' }}>
      {/* Subtle glow */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        background: `radial-gradient(ellipse at 50% 0%, ${glowColor || 'rgba(201,168,76,0.5)'} 0%, transparent 70%)`
      }} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{title}</p>
          <p className="text-3xl font-display tracking-wider mt-1 animate-count-up">{displayValue}</p>
          {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${bgColor}`}>
          <Icon size={20} className={color} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
