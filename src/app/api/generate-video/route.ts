import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const DEFAULT_NEGATIVE_PROMPT =
  "luxury interiors, high-end apartments, staged lifestyle photography, studio lighting, cinematic spectacle, dramatic camera moves, fast cuts, beauty filters, airbrushed skin, glam photography, posed acting, smiling at camera, influencer-style behavior, stock footage, commercial polish, brand-film aesthetics, hospital or clinic settings, medical equipment, scrubs, corporate offices, productivity imagery, exaggerated emotion, fantasy lighting, advertising aesthetics, UI interaction, screen scrolling, tapping, highlighting, animated interfaces";

export async function POST(request: NextRequest) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "REPLICATE_API_TOKEN is not set" },
      { status: 503 }
    );
  }

  let body: { image_url: string; prompt: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { image_url, prompt } = body;
  if (!image_url?.trim() || !prompt?.trim()) {
    return NextResponse.json(
      { error: "image_url and prompt are required" },
      { status: 400 }
    );
  }

  try {
    const replicate = new Replicate({ auth: token });
    const output = await replicate.run("google/veo-3-fast", {
      input: {
        image: image_url.trim(),
        prompt: prompt.trim(),
        resolution: "720p",
        aspect_ratio: "9:16",
        duration: 8,
        negative_prompt: DEFAULT_NEGATIVE_PROMPT,
      },
    });
    const url = getOutputUrl(output);
    if (!url) {
      return NextResponse.json(
        { error: "No video URL in model output" },
        { status: 502 }
      );
    }
    return NextResponse.json({ url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Video generation failed", details: message },
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
