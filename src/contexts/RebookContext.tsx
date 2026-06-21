import { createContext, useCallback, useContext, useMemo, useRef, useState, ReactNode } from "react";

export interface RebookSession {
  reservationId: string;
  sourceTableId: string;
  sourceTableLabel: string;
  guest?: string;
  time?: string;
}

type CommitFn = (target: { tableId: string; label: string }) => Promise<boolean>;

interface RebookContextValue {
  session: RebookSession | null;
  active: boolean;
  isSource: (tableId: string) => boolean;
  start: (s: RebookSession) => void;
  cancel: () => void;
  commit: (target: { tableId: string; label: string }) => Promise<void>;
  setCommitter: (fn: CommitFn | null) => void;
  /** True for ~400ms after a long-press fires — used to swallow the trailing click. */
  consumeJustStarted: () => boolean;
}

const Ctx = createContext<RebookContextValue | null>(null);

export const RebookProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<RebookSession | null>(null);
  const committerRef = useRef<CommitFn | null>(null);
  const justStartedRef = useRef<number>(0);

  const start = useCallback((s: RebookSession) => {
    justStartedRef.current = Date.now();
    setSession(s);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { (navigator as any).vibrate?.(30); } catch { /* ignore */ }
    }
  }, []);

  const cancel = useCallback(() => setSession(null), []);

  const commit = useCallback(async (target: { tableId: string; label: string }) => {
    if (!session) return;
    if (target.tableId === session.sourceTableId) { setSession(null); return; }
    const fn = committerRef.current;
    if (!fn) { setSession(null); return; }
    const ok = await fn(target);
    if (ok) setSession(null);
    // else: keep mode active so user can pick another table
  }, [session]);

  const setCommitter = useCallback((fn: CommitFn | null) => { committerRef.current = fn; }, []);

  const consumeJustStarted = useCallback(() => {
    const recent = Date.now() - justStartedRef.current < 450;
    if (recent) justStartedRef.current = 0;
    return recent;
  }, []);

  const isSource = useCallback((id: string) => session?.sourceTableId === id, [session]);

  const value = useMemo<RebookContextValue>(() => ({
    session, active: !!session, isSource, start, cancel, commit, setCommitter, consumeJustStarted,
  }), [session, isSource, start, cancel, commit, setCommitter, consumeJustStarted]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useRebook = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRebook must be used inside RebookProvider");
  return v;
};

/** Safe variant for components that may render outside the provider. */
export const useRebookOptional = () => useContext(Ctx);