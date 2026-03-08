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
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./components/admin/AdminLayout";
import DashboardHome from "./pages/admin/DashboardHome";
import BillardPage from "./pages/admin/BillardPage";
import KickerPage from "./pages/admin/KickerPage";
import DartPage from "./pages/admin/DartPage";
import RestaurantPage from "./pages/admin/RestaurantPage";
import VipEventsPage from "./pages/admin/VipEventsPage";
import ReservationsPage from "./pages/admin/ReservationsPage";
import CalendarPage from "./pages/admin/CalendarPage";
import EmailCenterPage from "./pages/admin/EmailCenterPage";
import ActivityLogPage from "./pages/admin/ActivityLogPage";
import WaitlistPage from "./pages/admin/WaitlistPage";
import AnalyticsPage from "./pages/admin/AnalyticsPage";
import SettingsPage from "./pages/admin/SettingsPage";
import OperationalView from "./pages/admin/OperationalView";
import Impressum from "./pages/Impressum";
import Datenschutz from "./pages/Datenschutz";
import NotFound from "./pages/NotFound";
import Jobs from "./pages/Jobs";

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
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="reservierungen" element={<ReservationsPage />} />
          <Route path="kalender" element={<CalendarPage />} />
          <Route path="auslastung" element={<AnalyticsPage />} />
          <Route path="billard" element={<BillardPage />} />
          <Route path="kicker" element={<KickerPage />} />
          <Route path="dart" element={<DartPage />} />
          <Route path="restaurant" element={<RestaurantPage />} />
          <Route path="vip" element={<VipEventsPage />} />
          <Route path="email" element={<EmailCenterPage />} />
          <Route path="aktivitaet" element={<ActivityLogPage />} />
          <Route path="warteliste" element={<WaitlistPage />} />
          <Route path="einstellungen" element={<SettingsPage />} />
        </Route>
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/datenschutz" element={<Datenschutz />} />
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
