import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import { withReplicateRetry } from "@/lib/replicateRetry";
import {
  NANOBANANA_SPECIALIST,
  VEO_SPECIALIST,
  VO_SPECIALIST,
} from "@/data/specialistInstructions";

export interface GenerateSceneFromDescriptionBody {
  description: string;
  projectConfig: {
    video_objective: string;
    target_audience_type: string;
    audience_description: string;
    visual_mode: string;
  };
  persona: {
    name: string;
    voice_tone: string;
    lighting_style: string;
    framing_rules: string;
    rhythm: string;
  };
  /** Optional: the scene immediately before this one (for continuity / style). */
  previousScene?: { title?: string; purpose?: string; nano_prompt?: string };
  /** Optional: next scene number to use (1-based). */
  nextSceneNumber?: number;
}

const SYSTEM_PROMPT = `You generate a single scene for a vertical (9:16) demo video. Given a short description from the user and project/persona context, output exactly one scene as JSON with these rules:

When writing nano_prompt, follow: ${NANOBANANA_SPECIALIST}

When writing veo_prompt, follow: ${VEO_SPECIALIST}

When writing vo_line_1, vo_line_2, on_screen_text, audio_direction, follow: ${VO_SPECIALIST}

Output a single JSON object (no array, no markdown) with these keys only: title, purpose, mockup_required (boolean), uses_character (boolean), nano_prompt (string), veo_prompt (string), vo_line_1 (string), vo_line_2 (string), on_screen_text (string), audio_direction (string), estimated_cost (number, e.g. 0.15). Do not include scene_number. Return only the JSON object.`;

export async function POST(request: NextRequest) {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    return NextResponse.json(
      { error: "REPLICATE_API_TOKEN is not set. Add it in .env.local." },
      { status: 503 }
    );
  }

  let body: GenerateSceneFromDescriptionBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { description, projectConfig, persona, previousScene, nextSceneNumber } = body;
  if (!description || typeof description !== "string" || !description.trim()) {
    return NextResponse.json(
      { error: "description (non-empty string) is required" },
      { status: 400 }
    );
  }

  const userPrompt = `Generate one scene for a vertical demo video.

User's description of the scene:
${description.trim()}

Project context:
- Video objective: ${projectConfig?.video_objective ?? "Demo video"}
- Target audience: ${projectConfig?.target_audience_type ?? "General"}
- Audience: ${projectConfig?.audience_description ?? ""}
- Visual mode: ${projectConfig?.visual_mode ?? "UI-heavy with occasional B-roll"}

Producer persona: ${persona?.name ?? "Default"}
- Voice tone: ${persona?.voice_tone ?? "Calm, clear"}
- Lighting: ${persona?.lighting_style ?? "Natural"}
- Framing: ${persona?.framing_rules ?? "Centered, clean"}
- Rhythm: ${persona?.rhythm ?? "Moderate"}

${previousScene ? `Previous scene (for visual/narrative continuity): Title: "${previousScene.title ?? ""}". Purpose: ${previousScene.purpose ?? ""}. Use similar style/lighting in nano_prompt if appropriate.` : ""}

Output a single JSON object with keys: title, purpose, mockup_required, uses_character, nano_prompt, veo_prompt, vo_line_1, vo_line_2, on_screen_text, audio_direction, estimated_cost. No other text.`;

  try {
    const replicate = new Replicate({ auth: apiToken });
    const fullPrompt = `${SYSTEM_PROMPT}\n\n---\n\n${userPrompt}`;
    const output = await withReplicateRetry(() =>
      replicate.run("google/gemini-2.5-flash", {
        input: {
          prompt: fullPrompt,
          system_instruction: "You output only a single JSON object for one scene. No markdown, no array, no explanation.",
          max_output_tokens: 2048,
        },
      })
    );

    const raw = Array.isArray(output) ? output.join("") : String(output ?? "");
    if (!raw.trim()) {
      return NextResponse.json(
        { error: "Empty response from model" },
        { status: 502 }
      );
    }
    let jsonStr = raw.trim();
    const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) jsonStr = match[1].trim();
    const scene = JSON.parse(jsonStr) as Record<string, unknown>;

    const sceneNumber = typeof nextSceneNumber === "number" && nextSceneNumber >= 1 ? nextSceneNumber : 1;
    const normalized = {
      scene_number: sceneNumber,
      title: String(scene.title ?? "New scene"),
      purpose: String(scene.purpose ?? ""),
      mockup_required: Boolean(scene.mockup_required),
      uses_character: Boolean(scene.uses_character),
      nano_prompt: String(scene.nano_prompt ?? ""),
      veo_prompt: String(scene.veo_prompt ?? ""),
      vo_line_1: String(scene.vo_line_1 ?? ""),
      vo_line_2: String(scene.vo_line_2 ?? ""),
      on_screen_text: String(scene.on_screen_text ?? ""),
      audio_direction: String(scene.audio_direction ?? ""),
      estimated_cost: Number(scene.estimated_cost) || 0.15,
      status: "Draft",
      comment: "",
      version: 1,
      video_duration_seconds: 8,
    };

    return NextResponse.json({ scene: normalized });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Scene generation failed", details: message },
      { status: 502 }
    );
  }
}
