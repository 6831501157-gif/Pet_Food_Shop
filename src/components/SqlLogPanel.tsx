"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useDraggablePosition } from "@/hooks/useDraggablePosition";
import { sqlLog, type SqlLogEntry, type SqlStatement } from "@/lib/sql-log";

/** Floating bottom-right panel listing the SQL each button press sent to MySQL */
export function SqlLogPanel() {
  const entries = useSyncExternalStore(sqlLog.subscribe, sqlLog.getSnapshot, sqlLog.getServerSnapshot);
  const [collapsed, setCollapsed] = useState(false);
  const { ref, position, handleProps } = useDraggablePosition<HTMLElement>("sql-log-position");
  const listRef = useRef<HTMLOListElement>(null);
  const highlightedId = useNewestHighlight(entries, listRef);

  return (
    // z-40 keeps it under modals (z-50) so it can never cover a dialog's buttons;
    // it stays readable through the dimmed backdrop. Bottom-right until dragged.
    <aside
      ref={ref}
      style={position ? { left: position.x, top: position.y } : undefined}
      className={`fixed z-40 w-[min(34rem,calc(100vw-2rem))] overflow-hidden rounded-xl bg-stone-950 text-stone-200 shadow-2xl ring-1 ring-stone-800 print:hidden ${
        position ? "" : "bottom-4 right-4"
      }`}
    >
      <header
        {...handleProps}
        title="ลากเพื่อย้าย · ดับเบิลคลิกเพื่อกลับมุมขวาล่าง"
        className="flex cursor-grab touch-none select-none items-center justify-between px-3 py-2 text-xs font-semibold tracking-wide text-stone-400 active:cursor-grabbing"
      >
        <span>
          <span aria-hidden className="mr-1.5 text-stone-600">⠿</span>
          SQL LOG{entries.length > 0 && ` (${entries.length})`}
        </span>
        <div className="flex gap-3">
          {entries.length > 0 && (
            <button onClick={sqlLog.clear} className="hover:text-white">
              ล้าง
            </button>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-expanded={!collapsed}
            className="hover:text-white"
          >
            {collapsed ? "ขยาย ▴" : "ย่อ ▾"}
          </button>
        </div>
      </header>

      {!collapsed && (
        <ol
          ref={listRef}
          className="max-h-[45vh] overflow-y-auto border-t border-stone-800 font-mono text-xs leading-relaxed"
        >
          {entries.length === 0 ? (
            <li className="px-3 py-6 text-center font-sans text-stone-500">
              กดปุ่มในหน้าเว็บ แล้วคำสั่ง SQL ที่ส่งเข้าฐานข้อมูลจะขึ้นที่นี่
            </li>
          ) : (
            entries.map((entry) => (
              <LogEntry key={entry.id} entry={entry} highlighted={entry.id === highlightedId} />
            ))
          )}
        </ol>
      )}
    </aside>
  );
}

const HIGHLIGHT_MS = 1500;

/**
 * When a new entry arrives: scroll the list back to it (newest is on top) and
 * return its id for a short highlight, so the latest press is always in view.
 */
function useNewestHighlight(
  entries: SqlLogEntry[],
  listRef: React.RefObject<HTMLOListElement | null>
) {
  const newestId = entries[0]?.id;
  const [highlightedId, setHighlightedId] = useState<number | undefined>();

  useEffect(() => {
    if (newestId === undefined) return;
    listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setHighlightedId(newestId);
    const timer = setTimeout(() => setHighlightedId(undefined), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [newestId, listRef]);

  return highlightedId;
}

function LogEntry({ entry, highlighted }: { entry: SqlLogEntry; highlighted: boolean }) {
  return (
    <li
      className={`space-y-1 border-b border-stone-800 px-3 py-2.5 transition-colors duration-1000 last:border-b-0 ${
        highlighted ? "bg-amber-400/15" : ""
      }`}
    >
      <p className="font-sans">
        <span className="text-stone-500">{entry.time.toLocaleTimeString("th-TH")}</span>{" "}
        <span className="font-medium text-amber-400">{entry.action}</span>
      </p>

      {entry.statements.map((statement, i) => (
        <Statement key={i} statement={statement} />
      ))}

      {entry.statements.length === 0 && entry.error && (
        <p className="font-sans text-stone-400">
          ไม่ได้ส่งคำสั่ง SQL — ข้อมูลไม่ผ่านการตรวจก่อนถึงฐานข้อมูล
        </p>
      )}

      {entry.error && <p className="font-sans text-red-400">⚠ {entry.error}</p>}
    </li>
  );
}

function Statement({ statement }: { statement: SqlStatement }) {
  const isRollback = statement.sql.startsWith("ROLLBACK");
  return (
    <div className="break-words">
      <span className={isRollback ? "font-semibold text-red-400" : ""}>
        {isRollback ? statement.sql : <HighlightedSql sql={statement.sql} />};
      </span>{" "}
      <span className={statement.ok && !isRollback ? "text-emerald-400" : "text-red-400"}>
        {statement.ok ? "✓" : "✗"} {statement.result}
      </span>
    </div>
  );
}

// Quoted strings, numbers, and upper-case SQL keywords (our queries write keywords in caps)
const SQL_TOKEN =
  /('(?:[^'\\]|\\.)*')|\b(\d+(?:\.\d+)?)\b|\b(SELECT|INSERT|INTO|VALUES|UPDATE|SET|DELETE|FROM|WHERE|IN|FOR|JOIN|LEFT|ON|AND|OR|AS|ORDER|GROUP|BY|LIMIT|START|TRANSACTION|COMMIT|GREATEST|NOW|COUNT|NULL)\b/g;

function HighlightedSql({ sql }: { sql: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of sql.matchAll(SQL_TOKEN)) {
    const [text, str, num] = match;
    parts.push(sql.slice(last, match.index));
    const color = str ? "text-green-300" : num ? "text-pink-300" : "font-semibold text-sky-400";
    parts.push(
      <span key={match.index} className={color}>
        {text}
      </span>
    );
    last = match.index + text.length;
  }
  parts.push(sql.slice(last));
  return <>{parts}</>;
}
