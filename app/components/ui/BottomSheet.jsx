"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { t } from "../../../lib/i18n";

const EXPAND_PX = 40;
const CLOSE_PX = 90;

/**
 * draggable: opens at half height; drag the handle up for full height, down
 * to shrink or close. Nested sheets must be rendered as siblings.
 */
export default function BottomSheet({
  title,
  onClose,
  children,
  className = "",
  draggable = false,
  aside = null,
  layer = 80,
  focusTrap = false,
}) {
  const [expanded, setExpanded] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startRef = useRef(null);
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!focusTrap) return undefined;
    const previousFocus = document.activeElement;
    closeButtonRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll(
        "button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex='-1'])",
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus?.();
    };
  }, [focusTrap, onClose]);

  const onPointerDown = (event) => {
    if (!draggable || event.target.closest("button")) return;
    startRef.current = event.clientY;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onPointerMove = (event) => {
    if (startRef.current == null) return;
    setDragY(event.clientY - startRef.current);
  };
  const onPointerUp = () => {
    if (startRef.current == null) return;
    startRef.current = null;
    if (dragY < -EXPAND_PX) setExpanded(true);
    else if (dragY > CLOSE_PX) {
      if (expanded) setExpanded(false);
      else onClose();
    } else if (dragY > EXPAND_PX && expanded) {
      setExpanded(false);
    }
    setDragY(0);
  };

  const height = draggable ? (expanded ? "92dvh" : "55dvh") : undefined;

  return (
    <div className="fixed inset-0 flex items-end justify-center bg-black/45" style={{ zIndex: layer }} onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={dialogRef}
        onClick={(event) => event.stopPropagation()}
        className={`bloom-pop w-full max-w-md overflow-y-auto overflow-x-hidden overscroll-contain rounded-t-[28px] bb-bg-FFF7FB px-4 pt-2 ${draggable ? "" : "max-h-[88dvh]"} ${className}`}
        style={{
          paddingBottom: "max(20px, env(safe-area-inset-bottom))",
          height,
          translate: dragY ? `0 ${Math.max(dragY, expanded ? 0 : -EXPAND_PX * 2)}px` : undefined,
          transition: startRef.current == null ? "height 0.25s ease, translate 0.2s ease" : "none",
        }}
      >
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={`-mx-4 px-4 pb-1 pt-1 ${draggable ? "cursor-grab touch-none" : ""}`}
        >
          {draggable ? (
            <button type="button" aria-label={expanded ? t("Багасгах", "Collapse") : t("Томруулах", "Expand")} onClick={() => setExpanded((value) => !value)} className="mx-auto mb-2 block h-1.5 w-10 rounded-full bg-slate-200" />
          ) : (
            <span className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-slate-200" />
          )}
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="min-w-0 truncate text-lg font-black text-slate-800">{title}</h2>
            <div className="flex shrink-0 items-center gap-2">
              {aside}
              <button ref={closeButtonRef} type="button" onClick={onClose} aria-label={t("Хаах", "Close")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-slate-100 bg-white text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        {children}
      </section>
    </div>
  );
}
