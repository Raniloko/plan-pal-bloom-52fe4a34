/**
 * Push notifications for staff phones running the Median app (OneSignal).
 * The Median JavaScript bridge is injected into the page only inside the app;
 * in normal browsers these calls do nothing.
 *
 * The external ID must match staffExternalId() in
 * supabase/functions/_shared/staffNotify.ts – the server sends pushes to it.
 */

interface MedianBridge {
  onesignal?: {
    login?: (externalId: string) => unknown;
    logout?: () => unknown;
  };
}

const bridge = (): MedianBridge | undefined =>
  (window as unknown as { median?: MedianBridge }).median;

export const staffExternalId = (userId: string) => `rondo-staff-${userId}`;

/** Links this phone to the logged-in staff member so it receives pushes. */
export const registerStaffDevice = (userId: string) => {
  const run = () => {
    try { void bridge()?.onesignal?.login?.(staffExternalId(userId)); } catch { /* not in app */ }
  };
  if (bridge()) {
    run();
  } else {
    // The bridge can be injected after our code runs; Median calls this hook when ready.
    const w = window as unknown as { median_library_ready?: () => void };
    const previous = w.median_library_ready;
    w.median_library_ready = () => { previous?.(); run(); };
  }
};

/** Stops pushes to this phone after an explicit logout. */
export const unregisterStaffDevice = () => {
  try { void bridge()?.onesignal?.logout?.(); } catch { /* not in app */ }
};
