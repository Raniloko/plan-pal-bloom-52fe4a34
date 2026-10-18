import { supabase } from "@/integrations/supabase/client";
import { announceChange } from "./adminSync";

type InvokeOptions = NonNullable<Parameters<typeof supabase.functions.invoke>[1]>;

/** Actions that only read data and therefore don't need to notify other devices. */
const READ_ONLY_ACTIONS = new Set([
  "check_admin", "list_sessions", "fetch_dashboard", "fetch_stats_range",
  "get_available_units", "get_settings", "fetch_activity_log", "fetch_notifications",
  "check_login_attempts",
]);

/**
 * Calls the admin-actions edge function. Successful write actions are
 * announced to the other admin devices so they refresh right away.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const invokeAdmin = async <T = any>(options: InvokeOptions) => {
  const res = await supabase.functions.invoke<T>("admin-actions", options);
  const action = (options.body as { action?: string } | undefined)?.action;
  const failed = res.error || (res.data as { error?: unknown } | null)?.error;
  if (!failed && action && !READ_ONLY_ACTIONS.has(action)) void announceChange();
  return res;
};
