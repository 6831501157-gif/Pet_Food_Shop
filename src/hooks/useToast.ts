"use client";

import { useEffect, useState } from "react";

export type ToastMessage = { text: string; error?: boolean };

/** A message that clears itself after `durationMs` */
export function useToast(durationMs = 3000) {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), durationMs);
    return () => clearTimeout(timer);
  }, [toast, durationMs]);

  return { toast, showToast: setToast };
}
