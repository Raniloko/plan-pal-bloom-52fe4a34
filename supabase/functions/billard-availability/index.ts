import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function isValidTime(t: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(t)) return false;
  const [h, m] = t.split(":").map(Number);
  return h >= 0 && h <= 23 && [0, 15, 30, 45].includes(m);
}

function isValidDate(d: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(d);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get("date") || "";
    const time = url.searchParams.get("time") || "";
    if (!isValidDate(date) || !isValidTime(time)) {
      return new Response(JSON.stringify({ error: "Invalid date/time" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Settings duration (capped at 120 for billard)
    const { data: settingsData } = await supabase
      .from("settings").select("value").eq("key", "reservation_duration").single();
    const durMin = Math.min(settingsData?.value ? Number(settingsData.value) : 120, 120);

    const [h, m] = time.split(":").map(Number);
    const start = h * 60 + m;
    const end = start + durMin;

    const { data: units } = await supabase
      .from("units").select("id, name, status, position_index").eq("area", "billard");
    const { data: reservations } = await supabase
      .from("reservations")
      .select("unit_id, reservation_time")
      .eq("reservation_date", date)
      .eq("zone", "billard")
      .not("status", "in", '("cancelled","checked_out")');
    const { data: dayBlocks } = await supabase
      .from("unit_blocks")
      .select("unit_id")
      .lte("start_date", date)
      .gte("end_date", date);

    const blockedIds = new Set((dayBlocks || []).map((b: any) => b.unit_id));

    const busy = new Set<string>();
    for (const r of reservations || []) {
      if (!r.unit_id) continue;
      const [rh, rm] = (r.reservation_time as string).split(":").map(Number);
      const rStart = rh * 60 + rm;
      const rEnd = rStart + durMin;
      if (start < rEnd && end > rStart) busy.add(r.unit_id as string);
    }

    const sorted = (units || []).slice().sort((a: any, b: any) => {
      const an = parseInt(String(a.name).replace(/\D/g, ""), 10);
      const bn = parseInt(String(b.name).replace(/\D/g, ""), 10);
      if (!isNaN(an) && !isNaN(bn)) return an - bn;
      return String(a.name).localeCompare(String(b.name));
    });

    const result = sorted.map((u: any) => ({
      id: u.id,
      name: u.name,
      blocked: blockedIds.has(u.id),
      available: !blockedIds.has(u.id) && !busy.has(u.id),
    }));

    return new Response(JSON.stringify({ tables: result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});