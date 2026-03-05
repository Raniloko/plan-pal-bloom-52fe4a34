import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  trend?: string;
}

const StatCard = ({ title, value, icon: Icon, color, bgColor, trend }: StatCardProps) => (
  <div className="bg-card border border-border rounded-xl p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{title}</p>
        <p className="text-3xl font-display tracking-wider mt-1">{value}</p>
        {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
      </div>
      <div className={`p-2.5 rounded-lg ${bgColor}`}>
        <Icon size={20} className={color} />
      </div>
    </div>
  </div>
);

export default StatCard;
