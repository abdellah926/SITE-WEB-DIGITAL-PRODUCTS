import path from "node:path";
import { readFile } from "node:fs/promises";
import { log } from "@/lib/log";

const ROOT = process.env.PRIVATE_FILES_DIR ?? path.join(process.cwd(), "private");

export function resolvePrivatePath(fileKey: string): string | null {
  const clean = fileKey.replace(/^\/+/, "").split("/").filter((p) => p !== "" && p !== ".").join("/");
  if (clean.split("/").includes("..")) {
    log("warn", "private file path traversal blocked");
    return null;
  }
  const rootResolved = path.resolve(ROOT);
  const full = path.resolve(rootResolved, clean);
  if (!full.startsWith(rootResolved + path.sep)) {
    log("warn", "private file path escapes root");
    return null;
  }
  return full;
}

export async function readPrivateFile(fileKey: string): Promise<Uint8Array | null> {
  const full = resolvePrivatePath(fileKey);
  if (!full) return null;
  try {
    const buf = await readFile(full);
    return new Uint8Array(buf);
  } catch {
    log("error", "private file missing", full);
    return null;
  }
}