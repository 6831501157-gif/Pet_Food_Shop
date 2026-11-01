"use client";

import { useEffect } from "react";

type ModalProps = {
  onClose: () => void;
  children: React.ReactNode;
  size?: "sm" | "lg";
  /** Close when clicking the dark backdrop (Escape always closes) */
  dismissOnBackdrop?: boolean;
  /** Print only the modal content, without the backdrop */
  printable?: boolean;
};

const SIZE_CLASS = { sm: "max-w-sm", lg: "max-w-lg" };

export function Modal({
  onClose,
  children,
  size = "lg",
  dismissOnBackdrop = true,
  printable = false,
}: ModalProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 ${
        printable ? "print:static print:bg-white print:p-0" : ""
      }`}
      onMouseDown={(e) => dismissOnBackdrop && e.target === e.currentTarget && onClose()}
    >
      <div
        className={`w-full ${SIZE_CLASS[size]} rounded-xl bg-white p-6 shadow-xl ${
          printable ? "print:shadow-none" : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
}
