import { useEffect, useRef, useState } from "react";

type DropHandler = (reservationId: string, fromUnitId: string) => void;
const handlers = new Map<string, DropHandler>();
const LONG_PRESS_MS = 180;
const MOVE_TOLERANCE_PX = 18;
const AREA_HOVER_EVENT = "table-drag-area-hover";

type DragSession = {
  sourceId: string;
  reservationId: string;
  sourceEl: Element | null;
  startX: number;
  startY: number;
  active: boolean;
  pressed: boolean;
  setTouchDragging?: (dragging: boolean) => void;
  label?: string;
  guest?: string;
  time?: string;
};

let activeSession: DragSession | null = null;
let longPressTimer: number | null = null;
let ghostEl: HTMLDivElement | null = null;

export const registerDropHandler = (id: string, fn: DropHandler) => {
  handlers.set(id, fn);
};
export const unregisterDropHandler = (id: string) => {
  handlers.delete(id);
};

const clearTimer = () => {
  if (longPressTimer !== null) {
    window.clearTimeout(longPressTimer);
    longPressTimer = null;
  }
};

const clearHighlights = () => {
  document
    .querySelectorAll<SVGGElement | HTMLElement>("[data-table-drop-hover='1'], [data-table-drag-tab-hover='1']")
    .forEach((el) => {
      el.removeAttribute("data-table-drop-hover");
      el.removeAttribute("data-table-drag-tab-hover");
    });
};

const removeGhost = () => {
  ghostEl?.remove();
  ghostEl = null;
};

const moveGhost = (x: number, y: number) => {
  if (!ghostEl) return;
  ghostEl.style.transform = `translate3d(${x + 18}px, ${y - 28}px, 0)`;
};

const createGhost = (session: DragSession, x: number, y: number) => {
  removeGhost();
  const el = document.createElement("div");
  el.className = "table-drag-ghost";
  const title = document.createElement("strong");
  title.textContent = session.guest || session.label || "Reservierung";
  el.appendChild(title);
  if (session.time) {
    const time = document.createElement("span");
    time.textContent = session.time;
    el.appendChild(time);
  }
  document.body.appendChild(el);
  ghostEl = el;
  moveGhost(x, y);
};

const emitAreaHover = (area: string) => {
  window.dispatchEvent(new CustomEvent(AREA_HOVER_EVENT, { detail: { area } }));
};

const startDrag = (session: DragSession, x: number, y: number) => {
  if (session.active) return;
  session.active = true;
  session.setTouchDragging?.(true);
  session.sourceEl?.setAttribute("data-table-drag-source", "1");
  document.body.style.overflow = "hidden";
  document.body.classList.add("table-dragging");
  createGhost(session, x, y);
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try { (navigator as any).vibrate?.(25); } catch {}
  }
};

const removeGlobalListeners = () => {
  document.removeEventListener("pointermove", onGlobalMove);
  document.removeEventListener("pointerup", onGlobalUp);
  document.removeEventListener("pointercancel", onGlobalUp);
};

const finishDrag = (e: PointerEvent) => {
  const session = activeSession;
  if (!session) return;
  clearTimer();
  removeGlobalListeners();
  document.body.style.overflow = "";
  document.body.classList.remove("table-dragging");
  clearHighlights();
  session.sourceEl?.removeAttribute("data-table-pressing");
  session.sourceEl?.removeAttribute("data-table-drag-source");
  removeGhost();

  const wasActive = session.active;
  session.pressed = false;
  session.active = false;
  session.setTouchDragging?.(false);
  activeSession = null;
  if (!wasActive) return;

  const swallow = (ev: Event) => { ev.stopPropagation(); ev.preventDefault(); };
  window.addEventListener("click", swallow, { capture: true, once: true });
  setTimeout(() => window.removeEventListener("click", swallow, { capture: true } as any), 400);

  const el = document.elementFromPoint(e.clientX, e.clientY) as Element | null;
  const target = el?.closest("[data-table-id]") as SVGGElement | null;
  const tid = target?.getAttribute("data-table-id");
  if (tid && tid !== session.sourceId) {
    const h = handlers.get(tid);
    if (h) h(session.reservationId, session.sourceId);
  }
};

function onGlobalMove(e: PointerEvent) {
  const session = activeSession;
  if (!session?.pressed) return;
  e.preventDefault();
  if (!session.active) {
    const dx = e.clientX - session.startX;
    const dy = e.clientY - session.startY;
    if (dx * dx + dy * dy > MOVE_TOLERANCE_PX * MOVE_TOLERANCE_PX) clearTimer();
    return;
  }
  moveGhost(e.clientX, e.clientY);
  clearHighlights();

  const el = document.elementFromPoint(e.clientX, e.clientY) as Element | null;
  const areaTab = el?.closest("[data-floor-area-tab]") as HTMLElement | null;
  const area = areaTab?.getAttribute("data-floor-area-tab");
  if (area) {
    areaTab.setAttribute("data-table-drag-tab-hover", "1");
    emitAreaHover(area);
    return;
  }

  const target = el?.closest("[data-table-id]") as SVGGElement | null;
  const tid = target?.getAttribute("data-table-id");
  if (target && tid && tid !== session.sourceId) target.setAttribute("data-table-drop-hover", "1");
}

function onGlobalUp(e: PointerEvent) {
  finishDrag(e);
}

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
  const sourceElRef = useRef<Element | null>(null);

  // Register this table's drop handler so other tables can deliver drops to us.
  useEffect(() => {
    if (onDrop) {
      registerDropHandler(id, (resId, fromUnit) => {
        if (fromUnit !== id) onDrop(resId);
      });
    }
    return () => unregisterDropHandler(id);
  }, [id, onDrop]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!enabled || !reservationId) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (activeSession) return;
    e.preventDefault();
    e.stopPropagation();
    sourceElRef.current = e.currentTarget as Element;
    sourceElRef.current.setAttribute("data-table-pressing", "1");
    try { (e.currentTarget as Element).setPointerCapture?.(e.pointerId); } catch {}
    clearTimer();
    activeSession = {
      sourceId: id,
      reservationId,
      sourceEl: sourceElRef.current,
      startX: e.clientX,
      startY: e.clientY,
      active: false,
      pressed: true,
      setTouchDragging,
      label,
      guest,
      time,
    };
    document.addEventListener("pointermove", onGlobalMove, { passive: false });
    document.addEventListener("pointerup", onGlobalUp);
    document.addEventListener("pointercancel", onGlobalUp);
    longPressTimer = window.setTimeout(() => {
      if (activeSession?.sourceId === id) startDrag(activeSession, activeSession.startX, activeSession.startY);
    }, LONG_PRESS_MS);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!activeSession || activeSession.sourceId !== id || activeSession.active) return;
    const dx = e.clientX - activeSession.startX;
    const dy = e.clientY - activeSession.startY;
    if (dx * dx + dy * dy > MOVE_TOLERANCE_PX * MOVE_TOLERANCE_PX) clearTimer();
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
      if (activeSession?.sourceId !== id) return;
      activeSession.setTouchDragging = undefined;
      if (!activeSession.active) {
        clearTimer();
        removeGlobalListeners();
        activeSession.sourceEl?.removeAttribute("data-table-pressing");
        activeSession = null;
      }
    };
  }, [id]);

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
