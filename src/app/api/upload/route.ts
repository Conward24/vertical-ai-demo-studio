import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const DEFAULT_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
function getUploadDir() {
  const mount = process.env.RAILWAY_VOLUME_MOUNT_PATH;
  return mount ? path.join(mount, "uploads") : DEFAULT_UPLOAD_DIR;
}
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided. Use form field 'file'." },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Allowed types: JPEG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 10MB)" },
        { status: 400 }
      );
    }
    const rawExt = path.extname(file.name) || (file.type === "image/png" ? ".png" : ".jpg");
    const ext = rawExt.toLowerCase();
    const name = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const uploadDir = getUploadDir();
    await mkdir(uploadDir, { recursive: true });
    const bytes = await file.arrayBuffer();
    const outPath = path.join(uploadDir, name);
    await writeFile(outPath, Buffer.from(bytes));
    const url = `/api/uploads/${name}`;
    return NextResponse.json({ url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
