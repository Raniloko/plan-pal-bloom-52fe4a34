import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Eye, EyeOff, ShieldCheck, User } from "lucide-react";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("admin-login", {
        body: { username: username.trim(), password },
      });

      if (fnError) {
        let errorMessage = "Ungültige Anmeldedaten.";
        try {
          const ctx = (fnError as any).context;
          if (ctx) {
            const parsed = await ctx.json();
            errorMessage = parsed?.error || errorMessage;
          }
        } catch {}
        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (!data?.success || !data?.session) {
        setError(data?.error || "Ungültige Anmeldedaten.");
        setLoading(false);
        return;
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      if (sessionError) {
        setError("Sitzung konnte nicht erstellt werden.");
        setLoading(false);
        return;
      }

      navigate("/admin");
    } catch {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pt-20 md:pt-24 min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md mx-auto px-4 relative z-10">
        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-10 shadow-2xl shadow-black/40">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-5">
              <ShieldCheck size={32} className="text-primary" />
            </div>
            <h1 className="font-display text-4xl tracking-wide">
              Admin <span className="text-gradient">Panel</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2">Rondo Sportsbar · Verwaltung</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Benutzername</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="admin"
                  className="w-full bg-muted/50 border border-border/50 rounded-xl pl-11 pr-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Passwort</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-muted/50 border border-border/50 rounded-xl pl-11 pr-12 py-3.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
                <p className="text-destructive text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-yellow-500 text-primary-foreground py-3.5 font-bold uppercase tracking-widest rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Anmelden...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Lock size={16} /> Anmelden
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default AdminLogin;
