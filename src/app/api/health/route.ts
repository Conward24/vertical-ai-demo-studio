import { NextResponse } from "next/server";

/** Lightweight health check for Railway/load balancers. GET /api/health → 200. */
export async function GET() {
  return NextResponse.json({ ok: true });
}
