import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Authorization gate ────────────────────────────────────────────
    // This function exposes privileged actions (creating admins / resetting
    // passwords). To prevent anonymous abuse we require either:
    //   (a) a request signed with a shared bootstrap secret, OR
    //   (b) a JWT belonging to an existing admin user.
    // ──────────────────────────────────────────────────────────────────
    const SETUP_SECRET = Deno.env.get("SETUP_ADMIN_SECRET");
    const providedSecret = req.headers.get("x-setup-admin-secret");
    const authHeader = req.headers.get("Authorization");

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let authorized = false;

    // (a) Bootstrap secret path
    if (SETUP_SECRET && providedSecret && providedSecret === SETUP_SECRET) {
      authorized = true;
    }

    // (b) Existing-admin JWT path
    if (!authorized && authHeader?.startsWith("Bearer ")) {
      const anon = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await anon.auth.getClaims(token);
      if (!claimsError && claimsData?.claims?.sub) {
        const userId = claimsData.claims.sub as string;
        const { data: roleData } = await supabaseService
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        if (roleData) authorized = true;
      }
    }

    if (!authorized) {
      return new Response(
        JSON.stringify({ error: "Nicht autorisiert" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, email, password, role } = await req.json();

    const supabase = supabaseService;

    if (action === "create_admin") {
      if (!email || !password) {
        return new Response(JSON.stringify({ error: "email and password required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create user via admin API
      const { data: userData, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createErr) {
        // If user already exists, that's fine
        if (createErr.message?.includes("already been registered")) {
          return new Response(JSON.stringify({ success: true, message: "User already exists" }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: createErr.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Assign admin role
      if (userData.user) {
        await supabase.from("user_roles").upsert(
          { user_id: userData.user.id, role: role || "admin" },
          { onConflict: "user_id, role" }
        );
      }

      return new Response(JSON.stringify({ success: true, user_id: userData.user?.id }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_password") {
      if (!email || !password) {
        return new Response(JSON.stringify({ error: "email and password required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Find user by email
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const user = users?.find((u: any) => u.email === email);
      if (!user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error: updateErr } = await supabase.auth.admin.updateUserById(user.id, { password });
      if (updateErr) {
        return new Response(JSON.stringify({ error: updateErr.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
