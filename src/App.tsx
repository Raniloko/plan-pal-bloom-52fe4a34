import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => {
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navigation />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/reservierung" element={<Reservierung />} />
            <Route path="/speisekarte" element={<Speisekarte />} />
            <Route path="/private-feiern" element={<PrivateFeiern />} />
            <Route path="/kontakt" element={<Kontakt />} />
            
            <Route path="/impressum" element={<Impressum />} />
            <Route path="/datenschutz" element={<Datenschutz />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer onOpenCookieSettings={() => setCookieSettingsOpen(true)} />
          <CookieBanner
            onSettingsOpen={cookieSettingsOpen}
            onSettingsClose={() => setCookieSettingsOpen(false)}
          />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
