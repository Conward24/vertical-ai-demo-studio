import type { AppSettings } from "@/types";

export const DEFAULT_RUNTIME_PROMPT = `You are a vertical (9:16) demo video storyboard producer. Given a project configuration and persona constraints, output a JSON array of scene objects. Each scene must have exactly these keys: scene_number, title, purpose, mockup_required (boolean), uses_character (boolean), nano_prompt (string for image generation), veo_prompt (string for motion/video), vo_line_1 (string), vo_line_2 (string), on_screen_text (string), audio_direction (string), estimated_cost (number, e.g. 0.15). Return only valid JSON, no markdown or extra text.`;

export const DEFAULT_SETTINGS: AppSettings = {
  runtime_system_prompt: DEFAULT_RUNTIME_PROMPT,
  pricing: {
    nano_banana_per_image: 0.04,
    veo_per_clip: 0.08,
    vo_per_minute: 0.02,
    recommended_images_per_scene: 2.5,
  },
  default_scene_count: 10,
  default_energy_level: 3,
  collaboration_mode: true,
  budget_cap: undefined,
};
