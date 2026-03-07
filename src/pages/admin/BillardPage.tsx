import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import UnitCard from "@/components/admin/UnitCard";
import UnitDetailPanel from "@/components/admin/UnitDetailPanel";

const BillardPage = () => {
  const [units, setUnits] = useState<any[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);

  const fetchUnits = async () => {
    const { data } = await supabase.from("units").select("*").eq("area", "billard").order("position_index");
    setUnits(data || []);
  };

  useEffect(() => {
    fetchUnits();
    const channel = supabase.channel("billard-units")
      .on("postgres_changes", { event: "*", schema: "public", table: "units" }, () => fetchUnits())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const freeCount = units.filter(u => u.status === "free").length;
  const occupiedCount = units.filter(u => u.status === "occupied").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="font-display text-3xl tracking-wider">🎱 Billard – 8 Tische</h2>
        <div className="flex items-center gap-3 glass-card rounded-lg px-3 py-1.5">
          <span className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-success" />{freeCount} Frei</span>
          <span className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-destructive" />{occupiedCount} Belegt</span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-stagger">
        {units.map((unit) => <UnitCard key={unit.id} unit={unit} onClick={() => setSelectedUnit(unit)} />)}
      </div>
      <UnitDetailPanel unit={selectedUnit} open={!!selectedUnit} onClose={() => setSelectedUnit(null)} onStatusChange={fetchUnits} />
    </div>
  );
};

export default BillardPage;
