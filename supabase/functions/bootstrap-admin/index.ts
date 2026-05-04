import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Einmalige Bootstrap-Funktion: legt rondosport@gmail.com mit Passwort "Admin" an
// (oder aktualisiert das Passwort) und weist die admin-Rolle zu.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const EMAIL = "rondosport@gmail.com";
  const PASSWORD = "Admin";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existing = users?.find((u: any) => u.email === EMAIL);

    let userId: string | undefined;
    if (existing) {
      const { error } = await supabase.auth.admin.updateUserById(existing.id, {
        password: PASSWORD,
        email_confirm: true,
      });
      if (error) throw error;
      userId = existing.id;
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
      });
      if (error) throw error;
      userId = data.user?.id;
    }

    if (userId) {
      await supabase.from("user_roles").upsert(
        { user_id: userId, role: "admin" },
        { onConflict: "user_id, role" },
      );
    }

    return new Response(
      JSON.stringify({ success: true, email: EMAIL, user_id: userId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});