import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

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

  const { systemPrompt, projectConfig, persona, brandMetadata } = body;
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

Output a JSON array of scene objects. Each object must have exactly: scene_number, title, purpose, mockup_required (boolean), uses_character (boolean), nano_prompt (string), veo_prompt (string), vo_line_1 (string), vo_line_2 (string), on_screen_text (string), audio_direction (string), estimated_cost (number). Return only the JSON array, no other text or markdown.`;

  try {
    const replicate = new Replicate({ auth: apiToken });
    const fullPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;

    const output = await replicate.run("google/gemini-2.5-flash", {
      input: {
        prompt: fullPrompt,
        system_instruction: "You are a vertical demo video storyboard producer. Respond only with valid JSON.",
        max_output_tokens: 8192,
      },
    });

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
    const scenes = JSON.parse(jsonStr);
    if (!Array.isArray(scenes)) {
      return NextResponse.json(
        { error: "Response was not a JSON array" },
        { status: 502 }
      );
    }
    const normalized = scenes.map((s: Record<string, unknown>, i: number) => ({
      scene_number: typeof s.scene_number === "number" ? s.scene_number : i + 1,
      title: String(s.title ?? `Scene ${i + 1}`),
      purpose: String(s.purpose ?? ""),
      mockup_required: Boolean(s.mockup_required),
      uses_character: Boolean(s.uses_character),
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
    }));
    return NextResponse.json({ scenes: normalized });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Generation failed", details: message },
      { status: 502 }
    );
  }
}
