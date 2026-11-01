// In-browser store for the SQL log panel. Lives in module memory, so it survives
// moving between pages but is cleared by a page refresh.

/** One statement exactly as it was sent to MySQL, with its outcome */
export type SqlStatement = { sql: string; ok: boolean; result: string };

/** Everything one button press sent to the database */
export type SqlLogEntry = {
  id: number;
  time: Date;
  action: string;
  statements: SqlStatement[];
  /** The API's error message when the request failed */
  error?: string;
};

const MAX_ENTRIES = 50;
const NO_ENTRIES: SqlLogEntry[] = [];

let entries: SqlLogEntry[] = NO_ENTRIES;
let nextId = 1;
const listeners = new Set<() => void>();

function setEntries(next: SqlLogEntry[]) {
  entries = next;
  listeners.forEach((notify) => notify());
}

export const sqlLog = {
  add(action: string, statements: SqlStatement[], error?: string) {
    const entry = { id: nextId++, time: new Date(), action, statements, error };
    setEntries([entry, ...entries].slice(0, MAX_ENTRIES)); // newest first
  },
  clear: () => setEntries(NO_ENTRIES),

  // For useSyncExternalStore
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => entries,
  getServerSnapshot: () => NO_ENTRIES,
};
