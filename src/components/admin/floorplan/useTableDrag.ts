import { useEffect, useRef, useState } from "react";

type DropHandler = (reservationId: string, fromUnitId: string) => void;
const handlers = new Map<string, DropHandler>();

export const registerDropHandler = (id: string, fn: DropHandler) => {
  handlers.set(id, fn);
};
export const unregisterDropHandler = (id: string) => {
  handlers.delete(id);
};

/**
 * Long-press / touch-drag support for floor-plan tables.
 * On touch devices HTML5 drag-and-drop does not fire — we implement a
 * pointer-based fallback: press & hold ~280ms on a reserved table, then
 * drag the finger to another table to re-book.
 *
 * Returns handlers/state. The target table is found via `data-table-id`
 * attribute and its registered drop handler is invoked.
 */
export function useTableDrag(opts: {
  id: string;
  reservationId?: string;
  enabled: boolean;
  onDrop?: (reservationId: string) => void;
}) {
  const { id, reservationId, enabled, onDrop } = opts;
  const [touchDragging, setTouchDragging] = useState(false);
  const longPressRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  // Register this table's drop handler so other tables can deliver drops to us.
  useEffect(() => {
    if (onDrop) {
      registerDropHandler(id, (resId, fromUnit) => {
        if (fromUnit !== id) onDrop(resId);
      });
    }
    return () => unregisterDropHandler(id);
  }, [id, onDrop]);

  const clearTimer = () => {
    if (longPressRef.current !== null) {
      window.clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  const clearHighlights = () => {
    document
      .querySelectorAll<SVGGElement>("[data-table-drop-hover='1']")
      .forEach((el) => el.removeAttribute("data-table-drop-hover"));
  };

  const onGlobalMove = (e: PointerEvent) => {
    if (!activeRef.current) return;
    e.preventDefault();
    clearHighlights();
    const el = document.elementFromPoint(e.clientX, e.clientY) as Element | null;
    const target = el?.closest("[data-table-id]") as SVGGElement | null;
    const tid = target?.getAttribute("data-table-id");
    if (target && tid && tid !== id) target.setAttribute("data-table-drop-hover", "1");
  };

  const onGlobalUp = (e: PointerEvent) => {
    document.removeEventListener("pointermove", onGlobalMove);
    document.removeEventListener("pointerup", onGlobalUp);
    document.removeEventListener("pointercancel", onGlobalUp);
    document.body.style.overflow = "";
    clearHighlights();
    const wasActive = activeRef.current;
    activeRef.current = false;
    setTouchDragging(false);
    if (!wasActive || !reservationId) return;
    const el = document.elementFromPoint(e.clientX, e.clientY) as Element | null;
    const target = el?.closest("[data-table-id]") as SVGGElement | null;
    const tid = target?.getAttribute("data-table-id");
    if (tid && tid !== id) {
      const h = handlers.get(tid);
      if (h) h(reservationId, id);
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!enabled || !reservationId) return;
    if (e.pointerType !== "touch" && e.pointerType !== "pen") return;
    startRef.current = { x: e.clientX, y: e.clientY };
    clearTimer();
    longPressRef.current = window.setTimeout(() => {
      activeRef.current = true;
      setTouchDragging(true);
      document.body.style.overflow = "hidden";
      document.addEventListener("pointermove", onGlobalMove, { passive: false });
      document.addEventListener("pointerup", onGlobalUp);
      document.addEventListener("pointercancel", onGlobalUp);
      // Haptic hint if available
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { (navigator as any).vibrate?.(15); } catch {}
      }
    }, 280);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (activeRef.current || !startRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (dx * dx + dy * dy > 100) clearTimer(); // moved before long-press fired -> cancel
  };

  const onPointerUp = () => {
    clearTimer();
    startRef.current = null;
  };

  const onPointerCancel = () => {
    clearTimer();
    startRef.current = null;
  };

  useEffect(() => {
    return () => {
      clearTimer();
      document.removeEventListener("pointermove", onGlobalMove);
      document.removeEventListener("pointerup", onGlobalUp);
      document.removeEventListener("pointercancel", onGlobalUp);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    touchDragging,
    pointerProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
  };
}
