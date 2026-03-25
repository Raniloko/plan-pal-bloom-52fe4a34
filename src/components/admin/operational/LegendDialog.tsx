import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HelpCircle, CheckCheck, Check, Clock, X, AlertTriangle, Star, Crown, UserCheck, CalendarCheck, CalendarX, Mail, MailCheck, Phone, MousePointerClick } from "lucide-react";

const LEGEND_ITEMS = [
  { icon: <div className="w-5 h-5 rounded-full bg-[#3a7bd5] flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>, label: "Reservierungsinfo", desc: "Bestätigte Reservierung" },
  { icon: <div className="w-5 h-5 rounded-full bg-[#1e8a38] flex items-center justify-center"><CheckCheck className="w-3 h-3 text-white" /></div>, label: "Eingecheckt / Platziert", desc: "Gast ist anwesend" },
  { icon: <div className="w-5 h-5 rounded-full bg-[#d4d4dc] flex items-center justify-center"><UserCheck className="w-3 h-3 text-gray-700" /></div>, label: "Gast Info", desc: "Gast-Details verfügbar" },
  { icon: <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center"><Clock className="w-3 h-3 text-white" /></div>, label: "Ausstehend", desc: "Reservierung noch nicht bestätigt" },
  { icon: <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center"><X className="w-3 h-3 text-white" /></div>, label: "Stornierung", desc: "Reservierung wurde storniert" },
  { icon: <div className="w-5 h-5 rounded-full bg-red-800 flex items-center justify-center"><AlertTriangle className="w-3 h-3 text-white" /></div>, label: "Überfällig", desc: "Gast nicht zum vereinbarten Zeitpunkt erschienen" },
  { icon: <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center"><Star className="w-3 h-3 text-white" /></div>, label: "Special / Event", desc: "Besonderer Anlass oder Event-Buchung" },
  { icon: <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center"><Crown className="w-3 h-3 text-white" /></div>, label: "VIP", desc: "VIP-Gast mit Sonderbehandlung" },
  { icon: <div className="w-5 h-5 rounded-full bg-blue-400 flex items-center justify-center"><CalendarCheck className="w-3 h-3 text-white" /></div>, label: "Online Reservierung", desc: "Über die Website gebucht" },
  { icon: <div className="w-5 h-5 rounded-full bg-orange-600 flex items-center justify-center text-[8px] font-bold text-white">OB</div>, label: "Überbuchung", desc: "Tisch ist möglicherweise überbucht" },
  { icon: <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center"><CalendarX className="w-3 h-3 text-white" /></div>, label: "Walk-in", desc: "Gast ohne Reservierung platziert" },
];

const LEGEND_ACTIONS = [
  { icon: <MailCheck className="w-4 h-4 text-green-400" />, label: "Reservierungsbestätigung abgeschickt" },
  { icon: <Mail className="w-4 h-4 text-amber-400" />, label: "Reservierungsbestätigung ausstehend" },
  { icon: <Phone className="w-4 h-4 text-blue-400" />, label: "Erinnerung erfordert Telefon oder E-Mail" },
  { icon: <MousePointerClick className="w-4 h-4 text-gray-400" />, label: "Doppelklick auf Listeneintrag öffnet Details" },
];

export const LegendDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
          style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Übersicht
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md" style={{ background: "#fff", color: "#222" }}>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Übersichtsverzeichnis</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {LEGEND_ITEMS.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              {item.icon}
              <div>
                <div className="text-sm font-semibold">{item.label}</div>
                <div className="text-xs text-gray-500">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t mt-4 pt-3 space-y-2.5">
          {LEGEND_ACTIONS.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              {item.icon}
              <span className="text-xs text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
