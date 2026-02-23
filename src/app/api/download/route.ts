import { NextRequest, NextResponse } from "next/server";

/**
 * Proxies a file from a URL and returns it with Content-Disposition so the
 * browser downloads it. Use for Replicate image/video URLs (avoids CORS).
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  const filename = request.nextUrl.searchParams.get("filename") ?? "download";

  if (!url || !url.startsWith("http")) {
    return NextResponse.json({ error: "Missing or invalid url" }, { status: 400 });
  }

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${res.status}` },
        { status: 502 }
      );
    }
    const contentType = res.headers.get("content-type") ?? "application/octet-stream";
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${sanitizeFilename(filename)}"`,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Download failed", details: message },
      { status: 502 }
    );
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200) || "download";
}
