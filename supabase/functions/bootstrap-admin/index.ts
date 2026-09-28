import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const { email, password } = await req.json();
  if (email !== "rondosport@gmail.com") return new Response("forbidden", { status: 403 });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let userId: string | undefined;
  const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
  if (data?.user) userId = data.user.id;
  else {
    const { data: list } = await sb.auth.admin.listUsers();
    const u = list.users.find((x) => x.email === email);
    if (!u) return new Response(JSON.stringify({ error: error?.message }), { status: 500 });
    userId = u.id;
    await sb.auth.admin.updateUserById(u.id, { password, email_confirm: true });
  }
  const { error: rErr } = await sb.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
  return new Response(JSON.stringify({ ok: !rErr, rErr: rErr?.message }));
});
