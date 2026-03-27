import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const AdminLoading = () => (
  <div style={{
    position: "fixed", inset: 0, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", background: "#0a0a0a",
    fontFamily: "'DM Sans', sans-serif",
  }}>
    <img src="/images/rondo-logo.png" alt="Rondo" style={{
      height: 48, filter: "brightness(0) invert(1)", opacity: 0.8,
      animation: "pulse 2s ease-in-out infinite",
    }} />
    <span style={{ fontSize: 13, color: "#555", marginTop: 16 }}>Wird geladen...</span>
    <style>{`@keyframes pulse { 0%,100% { opacity: 0.8 } 50% { opacity: 0.4 } }`}</style>
  </div>
);

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <AdminLoading />;
  if (!user) return <Navigate to="/backstage/login" replace />;

  return <>{children}</>;
};
