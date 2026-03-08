import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import Index from "./pages/Index";
import Reservierung from "./pages/Reservierung";
import Speisekarte from "./pages/Speisekarte";
import PrivateFeiern from "./pages/PrivateFeiern";
import Kontakt from "./pages/Kontakt";
import Impressum from "./pages/Impressum";
import Datenschutz from "./pages/Datenschutz";
import NotFound from "./pages/NotFound";
import Jobs from "./pages/Jobs";
import OperationalView from "./pages/admin/OperationalView";

const queryClient = new QueryClient();

const AppContent = () => {
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(false);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <>
      {!isAdmin && <Navigation />}
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/reservierung" element={<Reservierung />} />
        <Route path="/speisekarte" element={<Speisekarte />} />
        <Route path="/private-feiern" element={<PrivateFeiern />} />
        <Route path="/kontakt" element={<Kontakt />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/datenschutz" element={<Datenschutz />} />
        <Route path="/admin" element={<OperationalView />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isAdmin && <Footer onOpenCookieSettings={() => setCookieSettingsOpen(true)} />}
      {!isAdmin && (
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
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
