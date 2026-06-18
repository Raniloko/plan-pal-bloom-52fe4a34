import { useEffect, useRef, useState } from "react";

type DropHandler = (reservationId: string, fromUnitId: string) => void;
const handlers = new Map<string, DropHandler>();
const LONG_PRESS_MS = 180;
const MOVE_TOLERANCE_PX = 18;

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
  label?: string;
  guest?: string;
  time?: string;
}) {
  const { id, reservationId, enabled, onDrop, label, guest, time } = opts;
  const [touchDragging, setTouchDragging] = useState(false);
  const longPressRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const pressedRef = useRef(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const sourceElRef = useRef<Element | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);

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

  const removeGhost = () => {
    ghostRef.current?.remove();
    ghostRef.current = null;
  };

  const moveGhost = (x: number, y: number) => {
    if (!ghostRef.current) return;
    ghostRef.current.style.transform = `translate3d(${x + 18}px, ${y - 28}px, 0)`;
  };

  const createGhost = (x: number, y: number) => {
    removeGhost();
    const el = document.createElement("div");
    el.className = "table-drag-ghost";
    el.innerHTML = `<strong>${guest || label || "Reservierung"}</strong>${time ? `<span>${time}</span>` : ""}`;
    document.body.appendChild(el);
    ghostRef.current = el;
    moveGhost(x, y);
  };

  const startDrag = (x: number, y: number) => {
    if (activeRef.current || !reservationId) return;
    activeRef.current = true;
    setTouchDragging(true);
    sourceElRef.current?.setAttribute("data-table-drag-source", "1");
    document.body.style.overflow = "hidden";
    document.body.classList.add("table-dragging");
    createGhost(x, y);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { (navigator as any).vibrate?.(25); } catch {}
    }
  };

  const onGlobalMove = (e: PointerEvent) => {
    if (!pressedRef.current) return;
    e.preventDefault();
    if (!activeRef.current) {
      const start = startRef.current;
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (dx * dx + dy * dy > MOVE_TOLERANCE_PX * MOVE_TOLERANCE_PX) clearTimer();
      return;
    }
    moveGhost(e.clientX, e.clientY);
    clearHighlights();
    const el = document.elementFromPoint(e.clientX, e.clientY) as Element | null;
    const target = el?.closest("[data-table-id]") as SVGGElement | null;
    const tid = target?.getAttribute("data-table-id");
    if (target && tid && tid !== id) target.setAttribute("data-table-drop-hover", "1");
  };

  const onGlobalUp = (e: PointerEvent) => {
    clearTimer();
    document.removeEventListener("pointermove", onGlobalMove);
    document.removeEventListener("pointerup", onGlobalUp);
    document.removeEventListener("pointercancel", onGlobalUp);
    document.body.style.overflow = "";
    document.body.classList.remove("table-dragging");
    clearHighlights();
    sourceElRef.current?.removeAttribute("data-table-pressing");
    sourceElRef.current?.removeAttribute("data-table-drag-source");
    removeGhost();
    const wasActive = activeRef.current;
    pressedRef.current = false;
    activeRef.current = false;
    startRef.current = null;
    setTouchDragging(false);
    if (!wasActive || !reservationId) return;
    // Swallow the synthetic click that follows a pointerup so the table panel
    // doesn't open after a drag-and-drop.
    const swallow = (ev: Event) => { ev.stopPropagation(); ev.preventDefault(); };
    window.addEventListener("click", swallow, { capture: true, once: true });
    setTimeout(() => window.removeEventListener("click", swallow, { capture: true } as any), 400);
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
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    pressedRef.current = true;
    startRef.current = { x: e.clientX, y: e.clientY };
    sourceElRef.current = e.currentTarget as Element;
    sourceElRef.current.setAttribute("data-table-pressing", "1");
    try { (e.currentTarget as Element).setPointerCapture?.(e.pointerId); } catch {}
    clearTimer();
    document.addEventListener("pointermove", onGlobalMove, { passive: false });
    document.addEventListener("pointerup", onGlobalUp);
    document.addEventListener("pointercancel", onGlobalUp);
    longPressRef.current = window.setTimeout(() => {
      startDrag(e.clientX, e.clientY);
    }, LONG_PRESS_MS);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (activeRef.current || !startRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    // Allow small finger jitter (~14px) before we treat it as a scroll/cancel
    if (dx * dx + dy * dy > 200) clearTimer();
  };

  const onPointerUp = () => {
    // Cleanup is handled by the document-level pointerup so the drop target
    // can still be detected even if the pointer is no longer over the source.
  };

  const onPointerCancel = () => {
    clearTimer();
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
