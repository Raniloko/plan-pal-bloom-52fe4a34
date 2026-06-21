import { useEffect, useRef } from "react";
import { useRebookOptional } from "@/contexts/RebookContext";
import type { TableStatus } from "./types";

const LONG_PRESS_MS = 450;
const MOVE_TOLERANCE_PX = 18;

/**
 * Long-press to enter the global "rebook mode" for a reserved table.
 * Tap behaviour while a rebook session is active:
 *   - tap on source table        → cancel rebook
 *   - tap on a free target table → commit (assign to that table)
 *   - tap on any other table     → fall through to normal onClick
 * The mode persists across area switches because it lives in RebookContext.
 */
export function useTableDrag(opts: {
  id: string;
  reservationId?: string;
  enabled: boolean;
  /** Legacy: used as fallback when no rebook context is mounted. */
  onDrop?: (reservationId: string) => void;
  label?: string;
  guest?: string;
  time?: string;
  status?: TableStatus;
}) {
  const { id, reservationId, enabled, onDrop, label, guest, time, status } = opts;
  const rebook = useRebookOptional();
  const timerRef = useRef<number | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const longPressFiredRef = useRef(false);
  const sourceElRef = useRef<Element | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!enabled || !reservationId) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    longPressFiredRef.current = false;
    sourceElRef.current = e.currentTarget as Element;
    sourceElRef.current.setAttribute("data-table-pressing", "1");
    startRef.current = { x: e.clientX, y: e.clientY };
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      longPressFiredRef.current = true;
      sourceElRef.current?.removeAttribute("data-table-pressing");
      if (rebook) {
        rebook.start({
          reservationId,
          sourceTableId: id,
          sourceTableLabel: label || id,
          guest,
          time,
        });
      }
    }, LONG_PRESS_MS);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!startRef.current || timerRef.current === null) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (dx * dx + dy * dy > MOVE_TOLERANCE_PX * MOVE_TOLERANCE_PX) {
      clearTimer();
      sourceElRef.current?.removeAttribute("data-table-pressing");
    }
  };

  const onPointerUp = () => {
    clearTimer();
    sourceElRef.current?.removeAttribute("data-table-pressing");
  };

  const onPointerCancel = onPointerUp;

  /** Wrap the table's click so rebook taps take priority. */
  const wrapClick = (origClick: () => void) => (e: React.MouseEvent) => {
    // Swallow the synthetic click that fires right after a successful long-press.
    if (longPressFiredRef.current || rebook?.consumeJustStarted()) {
      longPressFiredRef.current = false;
      e.stopPropagation();
      return;
    }
    if (rebook?.active) {
      e.stopPropagation();
      if (rebook.isSource(id)) { rebook.cancel(); return; }
      if (status === "free") {
        void rebook.commit({ tableId: id, label: label || id });
        return;
      }
      // Tap on another occupied table while rebooking: ignore.
      return;
    }
    origClick();
  };

  const isRebookSource = !!rebook?.isSource(id) && rebook.active;

  return {
    /** Visual indicator: highlight when the source table is selected. */
    touchDragging: isRebookSource,
    isRebookSource,
    wrapClick,
    pointerProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
    /** Legacy HTML5-drop fallback (mouse only, same area). */
    legacyDrop: onDrop,
  };
}
