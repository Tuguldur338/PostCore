"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "@/components/icons";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  describedBy?: string;
  children: ReactNode;
  className?: string;
  showClose?: boolean;
  closeLabel?: string;
};

const focusableSelector =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  labelledBy,
  describedBy,
  children,
  className = "",
  showClose = true,
  closeLabel = "Close dialog",
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    panel?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panel) return;

      const items = Array.from(
        panel.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => element.offsetParent !== null);
      if (items.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="dialog-backdrop absolute inset-0"
        onClick={() => onCloseRef.current()}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        style={{ outline: "none" }}
        className={`dialog-panel relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-line bg-surface text-ink shadow-[var(--shadow-lg)] outline-none sm:max-h-[90dvh] sm:rounded-[1.75rem] ${className}`}
      >
        {showClose ? (
          <button
            type="button"
            onClick={onClose}
            className="icon-btn absolute right-3 top-3 z-20 border-line bg-surface/90 backdrop-blur"
            aria-label={closeLabel}
          >
            <X size={18} />
          </button>
        ) : null}
        {children}
      </div>
    </div>,
    document.body,
  );
}
