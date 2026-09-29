import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import Reservierung from "./pages/Reservierung";
import Impressum from "./pages/Impressum";
import NotFound from "./pages/NotFound";
import ReservierungAendern from "./pages/ReservierungAendern";
import ReservierungStornieren from "./pages/ReservierungStornieren";
import OperationalView from "./pages/admin/OperationalView";
import AdminLogin from "./pages/admin/AdminLogin";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { SessionWarningModal } from "@/components/admin/SessionWarningModal";

const queryClient = new QueryClient();

const SUPPRESS_COOKIE_KEY = "rondo_suppress_cookie_banner";
const OFFICIAL_PRIVACY_URL = "https://www.rondo-sportsbar.de/datenschutz/";

const OfficialPrivacyRedirect = () => {
  useEffect(() => {
    window.location.replace(OFFICIAL_PRIVACY_URL);
  }, []);

  return null;
};

const AppContent = () => {
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(false);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/backstage");
  const isReservierung = location.pathname.startsWith("/reservierung");
  // Embed mode: the reservation page is shown inside an iframe on the
  // WordPress site (rondo-sportsbar.de) with ?embed=1 — hide our own
  // navigation/footer so it blends into the host page.
  const isEmbed =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("embed") === "1";

  // Report the document height to the parent page so the iframe on the
  // WordPress site can resize itself to fit the current booking step.
  useEffect(() => {
    if (!isEmbed) return;
    const PARENT_ORIGINS = [
      "https://rondo-sportsbar.de",
      "https://www.rondo-sportsbar.de",
    ];
    const send = () => {
      const height = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      PARENT_ORIGINS.forEach((origin) => {
        try { window.parent.postMessage({ type: "rondo:height", height }, origin); } catch { /* ignore */ }
      });
    };
    const ro = new ResizeObserver(send);
    ro.observe(document.body);
    window.addEventListener("load", send);
    send();
    return () => {
      ro.disconnect();
      window.removeEventListener("load", send);
    };
  }, [isEmbed]);

  // Swap the PWA manifest + theme so the admin area installs as its own app
  // ("Rondo Admin") on Android/iOS, separate from the public reservation app.
  useEffect(() => {
    const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const appleTitle = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-title"]');
    if (isAdmin) {
      manifestLink?.setAttribute("href", "/admin-manifest.webmanifest");
      themeMeta?.setAttribute("content", "#0d0d0d");
      appleTitle?.setAttribute("content", "Rondo Admin");
    } else {
      manifestLink?.setAttribute("href", "/manifest.webmanifest");
      themeMeta?.setAttribute("content", "#ffda00");
      appleTitle?.setAttribute("content", "Rondo");
    }
  }, [isAdmin]);

  // Once a user lands on the change/cancel flow (typically via email link),
  // suppress the cookie banner for the rest of the session — even if they
  // navigate to other public pages afterwards.
  if (typeof window !== "undefined") {
    if (
      location.pathname.startsWith("/reservierung/aendern") ||
      location.pathname.startsWith("/reservierung/stornieren")
    ) {
      try { sessionStorage.setItem(SUPPRESS_COOKIE_KEY, "1"); } catch {}
    }
  }
  const suppressCookie =
    typeof window !== "undefined" &&
    (() => { try { return sessionStorage.getItem(SUPPRESS_COOKIE_KEY) === "1"; } catch { return false; } })();

  return (
    <>
      {!isAdmin && <Navigation />}
      <Routes>
        <Route path="/" element={<Navigate to="/reservierung" replace />} />
        <Route path="/reservierung" element={<Reservierung />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/datenschutz" element={<OfficialPrivacyRedirect />} />
        <Route path="/reservierung/aendern" element={<ReservierungAendern />} />
        <Route path="/reservierung/stornieren" element={<ReservierungStornieren />} />
        <Route path="/backstage/login" element={<AdminLogin />} />
        <Route path="/backstage" element={<ProtectedRoute><OperationalView /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isAdmin && <Footer />}
      {!isAdmin && !isReservierung && !suppressCookie && (
        <CookieBanner
          onSettingsOpen={cookieSettingsOpen}
          onSettingsClose={() => setCookieSettingsOpen(false)}
        />
      )}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
          <SessionWarningModal />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
