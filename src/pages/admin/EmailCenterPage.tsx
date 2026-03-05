import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RotateCcw } from "lucide-react";

const EmailCenterPage = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [activePreview, setActivePreview] = useState<"confirmation" | "cancellation">("confirmation");

  useEffect(() => {
    supabase.from("email_logs").select("*").order("sent_at", { ascending: false }).limit(100)
      .then(({ data }) => setLogs(data || []));
  }, []);

  const statusBadge = (status: string) =>
    status === "sent" || status === "delivered"
      ? <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-success/20 text-success">Zugestellt</span>
      : <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-primary/20 text-primary">Fehlgeschlagen</span>;

  return (
    <div className="space-y-6">
      <h2 className="font-display text-3xl tracking-wider">📧 E-Mail Center</h2>

      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex gap-3 mb-4">
          <button onClick={() => setActivePreview("confirmation")} className={`px-4 py-2 text-xs rounded-lg transition-all ${activePreview === "confirmation" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"}`}>Bestätigungsmail</button>
          <button onClick={() => setActivePreview("cancellation")} className={`px-4 py-2 text-xs rounded-lg transition-all ${activePreview === "cancellation" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"}`}>Stornierungsmail</button>
        </div>
        <div className="bg-white rounded-lg p-6 text-black">
          {activePreview === "confirmation" ? (
            <div>
              <div className="bg-[#e81f1f] text-white p-4 rounded-t-lg text-center font-bold text-lg">✅ Reservierungsbestätigung</div>
              <div className="border border-gray-200 p-4 space-y-2">
                <p className="font-semibold">Ihre Reservierung ist bestätigt!</p>
                <div className="bg-gray-50 rounded p-3 text-sm space-y-1">
                  <p><strong>Name:</strong> Max Mustermann</p>
                  <p><strong>Bereich:</strong> Billard – Tisch 3</p>
                  <p><strong>Datum:</strong> 15. März 2026</p>
                  <p><strong>Uhrzeit:</strong> 18:00 Uhr</p>
                  <p><strong>Personen:</strong> 4</p>
                </div>
                <div className="text-center mt-4">
                  <span className="inline-block bg-[#e81f1f] text-white px-6 py-2 rounded font-semibold text-sm">Reservierung stornieren</span>
                </div>
              </div>
              <div className="text-center text-xs text-gray-400 mt-3">Rondo Sportsbar · Otto-Hahn-Str. 18 · 63456 Hanau</div>
            </div>
          ) : (
            <div>
              <div className="bg-gray-800 text-white p-4 rounded-t-lg text-center font-bold text-lg">❌ Stornierungsbestätigung</div>
              <div className="border border-gray-200 p-4 space-y-2">
                <p className="font-semibold">Ihre Reservierung wurde storniert.</p>
                <div className="bg-gray-50 rounded p-3 text-sm"><p>Details zur stornierten Buchung...</p></div>
                <div className="text-center mt-4">
                  <span className="inline-block bg-[#e81f1f] text-white px-6 py-2 rounded font-semibold text-sm">Jetzt neu reservieren</span>
                </div>
              </div>
              <div className="text-center text-xs text-gray-400 mt-3">Rondo Sportsbar · Otto-Hahn-Str. 18 · 63456 Hanau</div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border"><h3 className="font-display text-lg tracking-wider">Gesendete E-Mails</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/20 text-muted-foreground text-xs">
              <th className="text-left py-3 px-4">Empfänger</th><th className="text-left py-3 px-4">Typ</th>
              <th className="text-left py-3 px-4">Datum</th><th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Aktion</th>
            </tr></thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Keine E-Mails gesendet.</td></tr>
              ) : logs.map((log: any) => (
                <tr key={log.id} className="border-b border-border/50 hover:bg-muted/10">
                  <td className="py-3 px-4"><div className="font-medium">{log.recipient_name || "–"}</div><div className="text-[10px] text-muted-foreground">{log.recipient_email}</div></td>
                  <td className="py-3 px-4 capitalize">{log.email_type === "confirmation" ? "Bestätigung" : "Stornierung"}</td>
                  <td className="py-3 px-4 text-muted-foreground">{new Date(log.sent_at).toLocaleString("de-DE")}</td>
                  <td className="py-3 px-4">{statusBadge(log.status)}</td>
                  <td className="py-3 px-4"><button className="p-1.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground"><RotateCcw size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmailCenterPage;
