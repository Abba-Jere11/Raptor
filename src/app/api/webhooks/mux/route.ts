import { NextResponse } from "next/server";
import { applyMuxEvent } from "@/lib/media/mux";
import { verifyMuxSignature } from "@/lib/media/mux-signature";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.MUX_WEBHOOK_SECRET;
  if (!secret) return new NextResponse(null, { status: 404 });
  const body = await request.text();
  const header = request.headers.get("mux-signature") ?? "";
  if (!verifyMuxSignature(body, header, secret)) return new NextResponse(null, { status: 401 });
  let event: unknown;
  try {
    event = JSON.parse(body) as unknown;
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (!event || typeof event !== "object") return new NextResponse(null, { status: 400 });
  await applyMuxEvent(event as { type?: string; data?: { id?: string } });
  return new NextResponse(null, { status: 204 });
}
