import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";

const DEFAULT_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
function getUploadDir() {
  const mount = process.env.RAILWAY_VOLUME_MOUNT_PATH;
  return mount ? path.join(mount, "uploads") : DEFAULT_UPLOAD_DIR;
}

const MIMES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: { filename: string } }
) {
  const { filename } = params;
  if (!filename || filename.includes("..") || path.isAbsolute(filename)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }
  const uploadDir = getUploadDir();
  const filePath = path.join(uploadDir, filename);
  try {
    const buf = await readFile(filePath);
    const ext = path.extname(filename).toLowerCase();
    const contentType = MIMES[ext] || "application/octet-stream";
    return new NextResponse(buf, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
