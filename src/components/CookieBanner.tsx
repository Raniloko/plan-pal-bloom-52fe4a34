import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Link } from "react-router-dom";

interface CookieConsent {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

interface CookieBannerProps {
  onSettingsOpen?: boolean;
  onSettingsClose?: () => void;
}

const STORAGE_KEY = "rondo_cookie_consent";
const EXPIRY_KEY = "rondo_cookie_expiry";
const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000;

const getStoredConsent = (): CookieConsent | null => {
  try {
    const expiry = localStorage.getItem(EXPIRY_KEY);
    if (expiry && Date.now() > parseInt(expiry)) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(EXPIRY_KEY);
      return null;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const CookieBanner = ({ onSettingsOpen, onSettingsClose }: CookieBannerProps) => {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsent] = useState<CookieConsent>({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (onSettingsOpen) {
      setShowSettings(true);
    }
  }, [onSettingsOpen]);

  const saveConsent = (c: CookieConsent) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    localStorage.setItem(EXPIRY_KEY, String(Date.now() + TWELVE_MONTHS_MS));
    setVisible(false);
    setShowSettings(false);
    onSettingsClose?.();
  };

  const handleAcceptAll = () => {
    saveConsent({ necessary: true, functional: true, analytics: true, marketing: true });
  };

  const handleRejectAll = () => {
    saveConsent({ necessary: true, functional: false, analytics: false, marketing: false });
  };

  const handleSaveSettings = () => {
    saveConsent(consent);
  };

  // Settings Modal
  if (showSettings) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
        <div className="bg-card border border-border rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-2xl">Cookie-Einstellungen</h3>
            <button onClick={() => { setShowSettings(false); onSettingsClose?.(); }} className="text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Necessary */}
            <label className="flex items-start gap-3 p-3 bg-muted rounded-md">
              <input type="checkbox" checked disabled className="mt-1 accent-primary" />
              <div>
                <p className="font-semibold text-sm">Notwendige Cookies</p>
                <p className="text-xs text-muted-foreground">Erforderlich für die Funktionalität der Website</p>
              </div>
            </label>

            {/* Functional */}
            <label className="flex items-start gap-3 p-3 bg-muted rounded-md cursor-pointer">
              <input
                type="checkbox"
                checked={consent.functional}
                onChange={(e) => setConsent({ ...consent, functional: e.target.checked })}
                className="mt-1 accent-primary"
              />
              <div>
                <p className="font-semibold text-sm">Funktionale Cookies</p>
                <p className="text-xs text-muted-foreground">Ermöglichen erweiterte Funktionen wie Sprache, Präferenzen</p>
              </div>
            </label>

            {/* Analytics */}
            <label className="flex items-start gap-3 p-3 bg-muted rounded-md cursor-pointer">
              <input
                type="checkbox"
                checked={consent.analytics}
                onChange={(e) => setConsent({ ...consent, analytics: e.target.checked })}
                className="mt-1 accent-primary"
              />
              <div>
                <p className="font-semibold text-sm">Analytics & Performance</p>
                <p className="text-xs text-muted-foreground">Helfen uns, die Website zu verbessern</p>
              </div>
            </label>

            {/* Marketing */}
            <label className="flex items-start gap-3 p-3 bg-muted rounded-md cursor-pointer">
              <input
                type="checkbox"
                checked={consent.marketing}
                onChange={(e) => setConsent({ ...consent, marketing: e.target.checked })}
                className="mt-1 accent-primary"
              />
              <div>
                <p className="font-semibold text-sm">Marketing & Werbung</p>
                <p className="text-xs text-muted-foreground">Für personalisierte Ads und Marketing</p>
              </div>
            </label>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            <a href="https://www.rondo-sportsbar.de/datenschutz/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Mehr erfahren in der Datenschutzerklärung</a>
          </p>

          <div className="grid grid-cols-3 gap-2 mt-6">
            <button onClick={handleRejectAll} className="border border-border text-foreground px-3 py-2.5 text-sm font-medium rounded-md hover:bg-secondary transition-colors">
              Alles ablehnen
            </button>
            <button onClick={handleSaveSettings} className="bg-primary text-primary-foreground px-3 py-2.5 text-sm font-medium rounded-md hover:bg-primary/90 transition-colors">
              Speichern
            </button>
            <button onClick={handleAcceptAll} className="border border-primary text-primary px-3 py-2.5 text-sm font-medium rounded-md hover:bg-primary hover:text-primary-foreground transition-colors">
              Alle akzeptieren
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[99] bg-card border-t border-border p-4 md:p-6">
      <div className="container mx-auto max-w-4xl">
        <h4 className="font-display text-xl mb-2">Wir verwenden Cookies</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Wir verwenden Cookies, um dir das beste Erlebnis auf unserer Website zu bieten. Einige Cookies sind notwendig für die Funktionalität, andere helfen uns, deine Erfahrung zu verbessern.{" "}
          <a href="https://www.rondo-sportsbar.de/datenschutz/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Mehr erfahren</a>
        </p>
        <div className="grid grid-cols-3 gap-2 max-w-md">
          <button onClick={handleRejectAll} className="border border-border text-foreground px-3 py-2.5 text-sm font-medium rounded-md hover:bg-secondary transition-colors">
            Alles ablehnen
          </button>
          <button onClick={() => setShowSettings(true)} className="bg-secondary text-secondary-foreground px-3 py-2.5 text-sm font-medium rounded-md hover:bg-secondary/80 transition-colors">
            Einstellungen
          </button>
          <button onClick={handleAcceptAll} className="bg-primary text-primary-foreground px-3 py-2.5 text-sm font-medium rounded-md hover:bg-primary/90 transition-colors">
            Alle akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
