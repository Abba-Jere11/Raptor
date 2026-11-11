import { createHmac, timingSafeEqual } from "node:crypto";

const FIVE_MINUTES = 5 * 60 * 1000;

function sameHex(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length || left.length === 0) return false;
  return timingSafeEqual(left, right);
}

/** Mux signs `timestamp.body` with the webhook secret. Reject stale signatures. */
export function verifyMuxSignature(body: string, header: string, secret: string, now = Date.now()): boolean {
  const parts = new Map<string, string>();
  for (const piece of header.split(",")) {
    const eq = piece.indexOf("=");
    if (eq === -1) continue;
    parts.set(piece.slice(0, eq).trim(), piece.slice(eq + 1).trim());
  }
  const t = parts.get("t");
  const v1 = parts.get("v1");
  if (!t || !v1 || !/^\d+$/.test(t)) return false;
  const stamped = Number(t) * 1000;
  if (Math.abs(now - stamped) > FIVE_MINUTES) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
  return sameHex(expected, v1);
}
