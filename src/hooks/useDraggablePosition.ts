"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };

function readSaved(storageKey: string): Point | null {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    return typeof saved?.x === "number" && typeof saved?.y === "number" ? saved : null;
  } catch {
    return null;
  }
}

function save(storageKey: string, point: Point | null) {
  try {
    if (point) localStorage.setItem(storageKey, JSON.stringify(point));
    else localStorage.removeItem(storageKey);
  } catch {
    // Storage blocked (private window etc.): position just won't be remembered
  }
}

/**
 * Lets a fixed-position element be dragged by a handle and kept inside the window.
 * `position` is null until the user drags it, meaning "use the default CSS spot".
 * Double-clicking the handle goes back to the default. The position is remembered
 * in localStorage under `storageKey`.
 */
export function useDraggablePosition<T extends HTMLElement>(storageKey: string) {
  const ref = useRef<T>(null);
  const [position, setPosition] = useState<Point | null>(null);
  const grabOffset = useRef<Point | null>(null);

  // Keep the whole element on screen
  const clamp = useCallback((p: Point): Point => {
    const el = ref.current;
    if (!el) return p;
    const { width, height } = el.getBoundingClientRect();
    return {
      x: Math.min(Math.max(0, p.x), Math.max(0, window.innerWidth - width)),
      y: Math.min(Math.max(0, p.y), Math.max(0, window.innerHeight - height)),
    };
  }, []);

  // Read the saved spot after mount so server and client render the same HTML
  useEffect(() => {
    const saved = readSaved(storageKey);
    if (saved) setPosition(clamp(saved));
  }, [storageKey, clamp]);

  // Re-clamp when the window shrinks or the element grows (new log lines, expand)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reclamp = () =>
      setPosition((p) => {
        if (!p) return p;
        const next = clamp(p);
        return next.x === p.x && next.y === p.y ? p : next;
      });
    const observer = new ResizeObserver(reclamp);
    observer.observe(el);
    window.addEventListener("resize", reclamp);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", reclamp);
    };
  }, [clamp]);

  const pointFromEvent = (e: React.PointerEvent, offset: Point) =>
    clamp({ x: e.clientX - offset.x, y: e.clientY - offset.y });

  const handleProps = {
    onPointerDown(e: React.PointerEvent<HTMLElement>) {
      // Left button only, and let buttons inside the handle work normally
      if (e.button !== 0 || (e.target as Element).closest("button") || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      grabOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove(e: React.PointerEvent<HTMLElement>) {
      if (grabOffset.current) setPosition(pointFromEvent(e, grabOffset.current));
    },
    onPointerUp(e: React.PointerEvent<HTMLElement>) {
      if (!grabOffset.current) return;
      const point = pointFromEvent(e, grabOffset.current);
      grabOffset.current = null;
      setPosition(point);
      save(storageKey, point);
    },
    onDoubleClick(e: React.MouseEvent<HTMLElement>) {
      if ((e.target as Element).closest("button")) return;
      setPosition(null);
      save(storageKey, null);
    },
  };

  return { ref, position, handleProps };
}
