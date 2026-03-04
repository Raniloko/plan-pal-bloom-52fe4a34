import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, setup_key, username } = await req.json();

    // Simple setup key to prevent unauthorized access
    if (setup_key !== "rondo-admin-setup-2024") {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!email || !password || password.length < 8) {
      return new Response(
        JSON.stringify({ error: "E-Mail und Passwort (min. 8 Zeichen) erforderlich." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if admin already exists
    const { data: existingRoles } = await supabase
      .from("user_roles")
      .select("id")
      .eq("role", "admin")
      .limit(1);

    if (existingRoles && existingRoles.length > 0) {
      return new Response(
        JSON.stringify({ error: "Ein Admin existiert bereits." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user via admin API
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Assign admin role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({ user_id: userData.user.id, role: "admin", username: (username || "admin").trim().toLowerCase().replace(/[^a-z0-9_\-\.]/g, "") });

    if (roleError) {
      return new Response(
        JSON.stringify({ error: roleError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Admin-Account erstellt." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Unerwarteter Fehler." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
