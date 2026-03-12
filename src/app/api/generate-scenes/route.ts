import { NextRequest, NextResponse } from "next/server";
import { jsonrepair } from "jsonrepair";
import Replicate from "replicate";
import { withReplicateRetry } from "@/lib/replicateRetry";

function isPublicUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname !== "localhost" && u.hostname !== "127.0.0.1";
  } catch {
    return false;
  }
}

/**
 * Find the "scenes" array substring in text (the first key named "scenes" value).
 * Returns the slice from the opening [ to the matching ], or null.
 */
function findScenesArraySubstring(text: string): string | null {
  const keyPattern = /"scenes"\s*:/;
  const match = keyPattern.exec(text);
  if (!match) return null;
  let i = match.index + match[0].length;
  while (i < text.length && /[\s\n\r\t]/.test(text[i])) i++;
  if (i >= text.length || text[i] !== "[") return null;
  const arrayStart = i;
  i++;
  let depth = 1; // we're inside the opening [
  let inString = false;
  let escapeNext = false;
  while (i < text.length) {
    const ch = text[i];
    if (escapeNext) {
      escapeNext = false;
      i++;
      continue;
    }
    if (inString) {
      if (ch === "\\") escapeNext = true;
      else if (ch === '"') inString = false;
      i++;
      continue;
    }
    if (ch === '"') {
      inString = true;
      i++;
      continue;
    }
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) return text.slice(arrayStart, i + 1);
    }
    i++;
  }
  return null;
}

/** Remove trailing commas before } or ] only when outside double-quoted strings. */
function removeTrailingCommasOutsideStrings(json: string): string {
  let out = "";
  let i = 0;
  let inString = false;
  let escapeNext = false;
  while (i < json.length) {
    const ch = json[i];
    if (escapeNext) {
      out += ch;
      escapeNext = false;
      i++;
      continue;
    }
    if (inString) {
      out += ch;
      if (ch === "\\") escapeNext = true;
      else if (ch === '"') inString = false;
      i++;
      continue;
    }
    if (ch === '"') {
      out += ch;
      inString = true;
      i++;
      continue;
    }
    // Outside string: remove comma when followed by optional whitespace and then } or ]
    if (ch === ",") {
      let j = i + 1;
      while (j < json.length && /[\s\n\r]/.test(json[j])) j++;
      if (j < json.length && (json[j] === "}" || json[j] === "]")) {
        out += json.slice(i + 1, j); // skip comma, keep whitespace
        i = j;
        continue;
      }
    }
    out += ch;
    i++;
  }
  return out;
}

export interface GenerateScenesBody {
  systemPrompt: string;
  projectConfig: {
    video_objective: string;
    target_audience_type: string;
    audience_description: string;
    energy_level: number;
    visual_mode: string;
    estimated_scene_count: number;
    reference_characters_required: boolean;
  };
  persona: {
    name: string;
    motion_intensity: number;
    lighting_style: string;
    ui_dominance: number;
    rhythm: string;
    voice_tone: string;
    framing_rules: string;
    color_behavior: string;
  };
  brandMetadata?: Record<string, unknown>;
  /** Public mockup image URLs. Gemini will see these and assign mockup_index per scene (0-based). Max 10 total with characterImageUrls. */
  mockupImageUrls?: string[];
  /** Public character reference image URLs. Same order as characterIds. Gemini assigns character_index per scene. */
  characterImageUrls?: string[];
  /** Character IDs in same order as characterImageUrls, so frontend can set scene.character_id from characterIds[character_index]. */
  characterIds?: string[];
}

export async function POST(request: NextRequest) {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    return NextResponse.json(
      { error: "REPLICATE_API_TOKEN is not set. Add it in .env.local." },
      { status: 503 }
    );
  }

  let body: GenerateScenesBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { systemPrompt, projectConfig, persona, brandMetadata, mockupImageUrls = [], characterImageUrls = [] } = body;
  const mockupUrls = (mockupImageUrls as string[]).filter((u) => typeof u === "string" && isPublicUrl(u.trim()));
  const characterUrls = (characterImageUrls as string[]).filter((u) => typeof u === "string" && isPublicUrl(u.trim()));
  const images = [...mockupUrls, ...characterUrls].slice(0, 10);
  const numMockups = mockupUrls.length;
  const numCharacters = characterUrls.length;

  let imageContext = "";
  if (images.length > 0) {
    const parts: string[] = [`You are receiving ${images.length} image(s) with this request. Look at them.`];
    if (numMockups > 0) {
      parts.push(
        `Images 0 to ${numMockups - 1} (0-based) are MOCKUP screens or device frames. For every scene with mockup_required true, you must set mockup_index (0-based) to the mockup that best fits that scene. The app will auto-attach that mockup to the scene—no manual step.`
      );
    }
    if (numCharacters > 0) {
      parts.push(
        `Images ${numMockups} to ${numMockups + numCharacters - 1} (0-based) are CHARACTER reference photos. Set character_index (0-based number) on each scene where uses_character is true.`
      );
    }
    parts.push("Infer everything from the images; no text descriptions needed.");
    imageContext = "\n\n" + parts.join("\n");
  }

  const userPrompt = `Generate a storyboard for a vertical (9:16) demo video with these parameters:

Project:
- Video objective: ${projectConfig.video_objective}
- Target audience: ${projectConfig.target_audience_type}
- Audience description: ${projectConfig.audience_description}
- Energy level (1-5): ${projectConfig.energy_level}
- Visual mode: ${projectConfig.visual_mode}
- Number of scenes: ${projectConfig.estimated_scene_count}
- Reference characters required: ${projectConfig.reference_characters_required}

Producer persona: ${persona.name}
- Motion intensity (1-5): ${persona.motion_intensity}
- Lighting: ${persona.lighting_style}
- UI dominance (0-5): ${persona.ui_dominance}
- Rhythm: ${persona.rhythm}
- Voice tone: ${persona.voice_tone}
- Framing: ${persona.framing_rules}
- Color: ${persona.color_behavior}

${brandMetadata && Object.keys(brandMetadata).length > 0 ? `Brand: ${JSON.stringify(brandMetadata)}` : ""}
${imageContext}

Output exactly one valid JSON object (no markdown, no code fences, no trailing commas). Produce exactly ${projectConfig.estimated_scene_count} scenes.
- "scenes": array of ${projectConfig.estimated_scene_count} scene objects. Each scene must have ALL of: scene_number, title, purpose, mockup_required (boolean), uses_character (boolean), mockup_index (0-based when mockup_required), character_index (0-based when uses_character), nano_prompt (string), veo_prompt (string), vo_line_1 (string), vo_line_2 (string), on_screen_text (string), audio_direction (string), estimated_cost (number). Do not omit veo_prompt or voiceover fields.
${numCharacters === 0 ? '- "proposed_characters": array of character definitions when the storyboard needs recurring characters. Each item: { "role_label": string, "nano_prompt": string, "anchor_description": string }. Set character_index on scenes that use a character to the index in this array (0-based).' : "Do not include proposed_characters (character reference images were provided); set character_index on scenes to the 0-based index in that provided list."}`;

  try {
    const replicate = new Replicate({ auth: apiToken });
    const fullPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;

    const input: Record<string, unknown> = {
      prompt: fullPrompt,
      system_instruction: "You are a vertical demo video storyboard producer. Output ONLY a single valid JSON object—no markdown, no code fences (no ```), no trailing commas, no text before or after. Produce exactly the number of scenes requested. Every scene object must include: scene_number, title, purpose, mockup_required, uses_character, mockup_index (if mockup_required), character_index (if uses_character), nano_prompt, veo_prompt, vo_line_1, vo_line_2, on_screen_text, audio_direction, estimated_cost.",
      max_output_tokens: 8192,
    };
    if (images.length > 0) {
      input.images = images;
    }

    let raw: string;
    try {
      const output = await withReplicateRetry(() =>
        replicate.run("google/gemini-2.5-flash", { input })
      );
      raw = Array.isArray(output) ? output.join("") : String(output ?? "");
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e ?? "");
      // If Gemini fails because some /api/uploads/* URLs are 404 (stale uploads on Railway),
      // retry once without any images so storyboard generation still works.
      if (images.length > 0 && message.includes("/api/uploads/") && message.includes("404")) {
        const inputNoImages: Record<string, unknown> = { ...input };
        delete inputNoImages.images;
        const output = await withReplicateRetry(() =>
          replicate.run("google/gemini-2.5-flash", { input: inputNoImages })
        );
        raw = Array.isArray(output) ? output.join("") : String(output ?? "");
      } else {
        throw e;
      }
    }

    if (!raw.trim()) {
      return NextResponse.json(
        { error: "Empty response from model" },
        { status: 502 }
      );
    }
    let jsonStr = raw.trim();
    // Gemini may return prose + fenced JSON or just raw JSON. Try, in order:
    // 1) First fenced block (```json ... ```) contents
    // 2) First {...} block in the string
    // 3) Raw string as-is
    const fenceMatch = jsonStr.match(/```[a-zA-Z]*\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    } else {
      const firstBrace = jsonStr.indexOf("{");
      const lastBrace = jsonStr.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = jsonStr.slice(firstBrace, lastBrace + 1).trim();
      }
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      try {
        const repaired = jsonrepair(jsonStr);
        parsed = JSON.parse(repaired);
      } catch (e1) {
        const relaxed = removeTrailingCommasOutsideStrings(jsonStr);
        try {
          parsed = JSON.parse(relaxed);
        } catch (e2) {
          // Last resort: extract only the "scenes" array (not proposed_characters), then parse each object.
          const text = relaxed || jsonStr;
          let arrayBody: string;
          const scenesArrayStr = findScenesArraySubstring(text);
          if (scenesArrayStr) {
            arrayBody = scenesArrayStr.slice(1, -1);
          } else {
            const firstBracket = text.indexOf("[");
            const lastBracket = text.lastIndexOf("]");
            if (firstBracket === -1 || lastBracket === -1 || lastBracket <= firstBracket) throw e2;
            arrayBody = text.slice(firstBracket + 1, lastBracket);
          }
        const items: Record<string, unknown>[] = [];
        let depth = 0;
        let current = "";
        let inDoubleQuote = false;
        let escapeNext = false;
        for (let i = 0; i < arrayBody.length; i++) {
          const ch = arrayBody[i];
          if (escapeNext) {
            if (depth > 0) current += ch;
            escapeNext = false;
            continue;
          }
          if (inDoubleQuote) {
            if (depth > 0) current += ch;
            if (ch === "\\") escapeNext = true;
            else if (ch === '"') inDoubleQuote = false;
            continue;
          }
          if (ch === '"') {
            inDoubleQuote = true;
            if (depth > 0) current += ch;
            continue;
          }
          if (ch === "{") depth++;
          if (depth > 0) current += ch;
          if (ch === "}") {
            depth--;
            if (depth === 0) {
              try {
                const objStr = removeTrailingCommasOutsideStrings(current);
                const obj = JSON.parse(objStr) as Record<string, unknown>;
                items.push(obj);
              } catch {
                // skip malformed object
              }
              current = "";
            }
          }
        }
        if (!items.length) {
          throw e2;
        }
        parsed = { scenes: items };
      }
    }
    }

    let scenesArray: Record<string, unknown>[];
    let proposedCharacters: { role_label: string; nano_prompt: string; anchor_description: string }[] = [];

    if (Array.isArray(parsed)) {
      scenesArray = parsed;
    } else if (parsed && typeof parsed === "object" && "scenes" in parsed && Array.isArray((parsed as { scenes: unknown }).scenes)) {
      scenesArray = (parsed as { scenes: Record<string, unknown>[] }).scenes;
      const rawProposed = (parsed as { proposed_characters?: unknown }).proposed_characters;
      if (Array.isArray(rawProposed)) {
        proposedCharacters = rawProposed
          .filter((p): p is Record<string, unknown> => p != null && typeof p === "object")
          .map((p) => ({
            role_label: String(p.role_label ?? ""),
            nano_prompt: String(p.nano_prompt ?? ""),
            anchor_description: String(p.anchor_description ?? ""),
          }));
      }
    } else {
      return NextResponse.json(
        { error: "Response was not a JSON object with 'scenes' array or a JSON array" },
        { status: 502 }
      );
    }

    const requested = Math.max(1, Number(projectConfig.estimated_scene_count) || 10);
    if (requested >= 5 && scenesArray.length < Math.min(5, Math.ceil(requested * 0.4))) {
      return NextResponse.json(
        {
          error: "Generation failed",
          details: `Model returned ${scenesArray.length} scenes but ${requested} were requested. Please try Generate scenes again.`,
        },
        { status: 502 }
      );
    }

    const normalized = scenesArray.map((s: Record<string, unknown>, i: number) => ({
      scene_number: typeof s.scene_number === "number" ? s.scene_number : i + 1,
      title: String(s.title ?? `Scene ${i + 1}`),
      purpose: String(s.purpose ?? ""),
      mockup_required: Boolean(s.mockup_required),
      uses_character: Boolean(s.uses_character),
      mockup_index: typeof s.mockup_index === "number" ? s.mockup_index : undefined,
      character_index: typeof s.character_index === "number" ? s.character_index : undefined,
      nano_prompt: String(s.nano_prompt ?? ""),
      veo_prompt: String(s.veo_prompt ?? ""),
      vo_line_1: String(s.vo_line_1 ?? ""),
      vo_line_2: String(s.vo_line_2 ?? ""),
      on_screen_text: String(s.on_screen_text ?? ""),
      audio_direction: String(s.audio_direction ?? ""),
      estimated_cost: Number(s.estimated_cost) || 0.15,
      status: "Draft",
      comment: "",
      version: 1,
      video_duration_seconds: 8,
    }));

    return NextResponse.json({
      scenes: normalized,
      mockupImageUrls: mockupUrls,
      characterIds: body.characterIds ?? [],
      proposedCharacters: proposedCharacters.length > 0 ? proposedCharacters : undefined,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Generation failed", details: message },
      { status: 502 }
    );
  }
}
