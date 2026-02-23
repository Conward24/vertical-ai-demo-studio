import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export async function POST(request: NextRequest) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "REPLICATE_API_TOKEN is not set" },
      { status: 503 }
    );
  }

  let body: { prompt: string; reference_image_url?: string; reference_image_urls?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { prompt, reference_image_url, reference_image_urls } = body;
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json(
      { error: "prompt (string) is required" },
      { status: 400 }
    );
  }

  const allRefs: string[] = [];
  if (reference_image_urls && Array.isArray(reference_image_urls)) {
    allRefs.push(...reference_image_urls.filter((u) => typeof u === "string" && u.trim().startsWith("http")));
  }
  if (reference_image_url && typeof reference_image_url === "string" && reference_image_url.trim().startsWith("http")) {
    allRefs.push(reference_image_url.trim());
  }
  // Replicate can't fetch localhost URLs — only use refs that are publicly reachable
  const refUrls = allRefs.filter((u) => {
    try {
      const host = new URL(u).hostname;
      return host !== "localhost" && host !== "127.0.0.1";
    } catch {
      return false;
    }
  });
  const skippedReference = allRefs.length > 0 && refUrls.length === 0;

  try {
    const replicate = new Replicate({ auth: token });
    const input: Record<string, unknown> = {
      prompt: prompt.trim(),
      aspect_ratio: "9:16",
      resolution: "2K",
      output_format: "png",
      safety_filter_level: "block_only_high",
    };
    if (refUrls.length > 0) {
      input.image_input = refUrls;
    }

    const output = await replicate.run("google/nano-banana-pro", { input });

    const url = getOutputUrl(output);
    if (!url) {
      return NextResponse.json(
        { error: "No image URL in model output" },
        { status: 502 }
      );
    }
    return NextResponse.json({ url, skipped_reference: skippedReference });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Image generation failed", details: message },
      { status: 502 }
    );
  }
}

function getOutputUrl(output: unknown): string | null {
  if (typeof output === "string" && output.startsWith("http")) return output;
  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    if (typeof first === "string" && first.startsWith("http")) return first;
    if (first && typeof first === "object" && "url" in first && typeof (first as { url: unknown }).url === "function") {
      return (first as { url: () => string }).url();
    }
  }
  if (output && typeof output === "object" && "url" in output && typeof (output as { url: unknown }).url === "function") {
    return (output as { url: () => string }).url();
  }
  return null;
}
