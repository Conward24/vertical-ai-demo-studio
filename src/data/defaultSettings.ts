import type { AppSettings } from "@/types";
import {
  NANOBANANA_SPECIALIST,
  VEO_SPECIALIST,
  VO_SPECIALIST,
  CHARACTER_SPECIALIST,
} from "@/data/specialistInstructions";

const STORYBOARD_INTRO = `You are a vertical (9:16) demo video storyboard producer. Given a project configuration and persona constraints, you output a JSON object with "scenes" (array of scene objects) and, when no character reference images are provided, "proposed_characters" (array of character definitions). For each scene you must write nano_prompt, veo_prompt, vo_line_1, vo_line_2, on_screen_text, and audio_direction. When writing those fields, follow the specialist guidelines below. When the project needs recurring characters and none are provided, propose characters and set character_index on scenes so they can be auto-attached for image generation.`;

const OUTPUT_SCHEMA = `Output a single JSON object (no markdown, no extra text) with:
- "scenes": array of scene objects. Each scene must have: scene_number, title, purpose, mockup_required (boolean), uses_character (boolean), mockup_index (0-based, when mockup_required), character_index (0-based, when uses_character—into proposed_characters or existing character list), nano_prompt (string), veo_prompt (string), vo_line_1 (string), vo_line_2 (string), on_screen_text (string), audio_direction (string), estimated_cost (number, e.g. 0.15).
- "proposed_characters": array only when no character reference images were provided and the storyboard would benefit from characters. Each element: { "role_label": string, "nano_prompt": string, "anchor_description": string }. Set character_index on each scene that uses a character to the 0-based index in proposed_characters. When character reference images were provided, omit proposed_characters and set character_index to refer to the existing character list order.`;

export const DEFAULT_RUNTIME_PROMPT = [
  STORYBOARD_INTRO,
  "",
  "---",
  "NANO_PROMPT (image generation): Follow these rules when writing nano_prompt for each scene:",
  NANOBANANA_SPECIALIST,
  "",
  "---",
  "VEO_PROMPT (motion/video): Follow these rules when writing veo_prompt for each scene:",
  VEO_SPECIALIST,
  "",
  "---",
  "VOICEOVER (vo_line_1, vo_line_2, on_screen_text, audio_direction): Follow these rules when writing narration and on-screen text:",
  VO_SPECIALIST,
  "",
  "---",
  "PROPOSED CHARACTERS (when no character images provided): Follow these rules when proposing characters and writing role_label, nano_prompt, anchor_description:",
  CHARACTER_SPECIALIST,
  "",
  "---",
  OUTPUT_SCHEMA,
].join("\n");

export const DEFAULT_SETTINGS: AppSettings = {
  runtime_system_prompt: DEFAULT_RUNTIME_PROMPT,
  pricing: {
    nano_banana_per_image: 0.04,
    veo_per_clip: 0.08,
    veo_per_second: 0.1,
    vo_per_minute: 0.02,
    recommended_images_per_scene: 2.5,
  },
  default_scene_count: 10,
  default_energy_level: 3,
  collaboration_mode: true,
  budget_cap: undefined,
};
