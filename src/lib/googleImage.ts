/**
 * Call Google's Gemini API (NanoBanana Pro / Gemini 3 Pro Image) to generate an image.
 * Returns a data URL (data:image/png;base64,...) so the frontend can use it like any other image URL.
 * Used as fallback when Replicate is overloaded.
 */

const GEMINI_IMAGE_MODEL = "gemini-2.0-flash-preview-image-generation";
const GEMINI_IMAGE_MODEL_ALT = "gemini-3-pro-image-preview";

export interface GoogleImageOptions {
  prompt: string;
  /** Optional reference image URLs (public). Fetched and sent as inline data. */
  referenceImageUrls?: string[];
  aspectRatio?: "9:16" | "1:1" | "16:9" | "3:4" | "4:3" | "4:5" | "5:4" | "3:2" | "2:3" | "21:9";
  /** e.g. "2K" or "4K" */
  imageSize?: string;
}

async function fetchAsBase64(url: string): Promise<{ mimeType: string; data: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const mimeType = res.headers.get("content-type")?.split(";")[0]?.trim() || "image/png";
  return { mimeType, data: base64 };
}

/**
 * Generate an image using Google's Gemini API. Returns a data URL.
 */
export async function generateImageWithGoogle(
  apiKey: string,
  options: GoogleImageOptions
): Promise<string> {
  const { prompt, referenceImageUrls = [], aspectRatio = "9:16", imageSize = "2K" } = options;

  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

  if (referenceImageUrls.length > 0) {
    for (const url of referenceImageUrls.slice(0, 14)) {
      try {
        const { mimeType, data } = await fetchAsBase64(url);
        parts.push({ inlineData: { mimeType, data } });
      } catch {
        // Skip refs we can't fetch
      }
    }
  }

  parts.push({
    text: `Generate an image with this description. Output only the image, no extra text.\n\n${prompt.trim()}`,
  });

  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"],
      responseMimeType: "image/png",
      imageConfig: {
        aspectRatio,
        imageSize,
      },
    },
  };

  // Try available image models in order
  const modelsToTry = [GEMINI_IMAGE_MODEL_ALT, GEMINI_IMAGE_MODEL];
  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        const msg = (data.error?.message ?? res.statusText) as string;
        throw new Error(msg || `Google API ${res.status}`);
      }

      const candidate = data.candidates?.[0];
      const content = candidate?.content?.parts;
      if (!Array.isArray(content)) {
        throw new Error("No content in Google response");
      }

      for (const part of content) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || "image/png";
          return `data:${mime};base64,${part.inlineData.data}`;
        }
      }

      throw new Error("No image data in Google response");
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      const msg = lastError.message;
      if (msg.includes("404") || msg.includes("not found") || msg.includes("not supported")) {
        continue;
      }
      throw lastError;
    }
  }

  throw lastError ?? new Error("Google image generation failed");
}
