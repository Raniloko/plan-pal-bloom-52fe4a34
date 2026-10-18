import { afterEach, describe, expect, it, vi } from "vitest";
import { notifyStaff } from "../../supabase/functions/_shared/staffNotify";

const reservation = { id: "test-booking", customer_name: "Test", reservation_date: "2026-10-19", reservation_time: "18:00", guest_count: 2, zone: "hauptbereich" };
const database = () => ({ from: vi.fn((table: string) => table === "user_roles"
  ? { select: () => ({ eq: async () => ({ data: [{ user_id: "test-admin" }], error: null }) }) }
  : { insert: async () => ({ error: null }) }) });

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("staff push delivery", () => {
  it("targets the same external ID as the staff device registration", async () => {
    vi.stubGlobal("Deno", { env: { get: () => "test-config" } });
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "push-id" })));
    vi.stubGlobal("fetch", fetcher);
    vi.spyOn(console, "info").mockImplementation(() => {});
    await notifyStaff(database(), "new", reservation);
    const payload = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(payload.include_aliases.external_id).toEqual(["rondo-staff-test-admin"]);
    expect(payload.target_channel).toBe("push");
  });

  it("does not report delivery acceptance when OneSignal returns no notification ID", async () => {
    vi.stubGlobal("Deno", { env: { get: () => "test-config" } });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ errors: ["No subscribers"] }))));
    const accepted = vi.spyOn(console, "info").mockImplementation(() => {});
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    await notifyStaff(database(), "new", reservation);
    expect(accepted).not.toHaveBeenCalled();
    expect(warning).toHaveBeenCalledOnce();
  });

  it("keeps reservations successful when the provider rejects a push and never logs its response body", async () => {
    vi.stubGlobal("Deno", { env: { get: () => "test-config" } });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "provider-private-content" }), { status: 401 })));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(notifyStaff(database(), "new", reservation)).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledWith("OneSignal push rejected:", 401);
    expect(JSON.stringify(log.mock.calls)).not.toContain("provider-private-content");
  });
});