import { createHash } from "crypto";

export function normalizeAccessCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function hashAccessCode(value: string) {
  return createHash("sha256").update(normalizeAccessCode(value)).digest("hex");
}
