type Level = "info" | "warn" | "error";

interface LogEntry {
  level: Level;
  msg: string;
  meta?: unknown;
  ts: string;
}

const CAP = 100;
const queue: LogEntry[] = [];
let flushing = false;

const TOKEN_RE = /[A-Za-z0-9_-]{24,}/g;

function redact(meta: unknown): unknown {
  if (typeof meta === "string") return meta.replace(TOKEN_RE, "[REDACTED]");
  if (meta && typeof meta === "object") {
    if (Array.isArray(meta)) return meta.map(redact);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(meta)) out[k] = redact(v);
    return out;
  }
  return meta;
}

function flush(): void {
  flushing = true;
  try {
    while (queue.length > 0) {
      const entry = queue.shift() as LogEntry;
      const line = JSON.stringify(entry);
      if (entry.level === "error") console.error(line);
      else if (entry.level === "warn") console.warn(line);
      else console.log(line);
    }
  } finally {
    flushing = false;
  }
}

export function log(level: Level, msg: string, meta?: unknown): void {
  if (queue.length >= CAP) queue.shift();
  queue.push({ level, msg, meta: redact(meta), ts: new Date().toISOString() });
  if (!flushing) setTimeout(flush, 0);
}