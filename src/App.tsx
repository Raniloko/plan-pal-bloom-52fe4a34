import { useState } from "react";
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
import Datenschutz from "./pages/Datenschutz";
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

const AppContent = () => {
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(false);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/backstage");
  const isReservierung = location.pathname.startsWith("/reservierung");

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
        <Route path="/datenschutz" element={<Datenschutz />} />
        <Route path="/reservierung/aendern" element={<ReservierungAendern />} />
        <Route path="/reservierung/stornieren" element={<ReservierungStornieren />} />
        <Route path="/backstage/login" element={<AdminLogin />} />
        <Route path="/backstage" element={<ProtectedRoute><OperationalView /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isAdmin && <Footer onOpenCookieSettings={() => setCookieSettingsOpen(true)} />}
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
