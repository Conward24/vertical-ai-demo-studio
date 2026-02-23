export type SceneStatus = "Draft" | "In Review" | "Approved" | "Locked";

export interface Persona {
  id: string;
  name: string;
  description: string;
  /** Optional preview image URL for wizard (e.g. mood / style reference). */
  image_url?: string;
  motion_intensity: number;
  lighting_style: string;
  ui_dominance: number;
  rhythm: string;
  voice_tone: string;
  framing_rules: string;
  color_behavior: string;
}

export interface Scene {
  scene_number: number;
  title: string;
  purpose: string;
  mockup_required: boolean;
  uses_character: boolean;
  /** When uses_character is true, which character's reference to use (id from project.characters). */
  character_id?: string;
  nano_prompt: string;
  veo_prompt: string;
  vo_line_1: string;
  vo_line_2: string;
  on_screen_text: string;
  audio_direction: string;
  estimated_cost: number;
  status: SceneStatus;
  comment: string;
  version: number;
  /** URL from Replicate after generating image (NanoBanana). May expire. */
  generated_image_url?: string;
  /** URL from Replicate after generating video (Veo). May expire. */
  generated_video_url?: string;
  /** User-uploaded mockup image for this scene (e.g. /uploads/...). Used as starting frame for video if set. */
  attached_mockup_url?: string;
}

export interface ReferenceCharacter {
  id: string;
  role_label: string;
  nano_prompt: string;
  anchor_description: string;
  approved: boolean;
  /** User-uploaded reference image for NanoBanana (e.g. /uploads/...). */
  reference_image_url?: string;
}

/** Project-level mockup image for storyboard generation. No description required – Gemini infers from image. */
export interface ProjectMockup {
  id: string;
  /** Public URL (e.g. /uploads/... or Replicate). Must be reachable by Replicate when generating scenes. */
  image_url: string;
}

export interface BrandKit {
  logo_url?: string;
  font_primary?: string;
  font_secondary?: string;
  palette?: string[];
}

export interface ProjectConfig {
  id: string;
  name: string;
  video_objective: string;
  target_audience_type: string;
  audience_description: string;
  energy_level: number;
  visual_mode: string;
  estimated_scene_count: number;
  brand_kit: BrandKit;
  reference_characters_required: boolean;
  persona_id: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  config: ProjectConfig;
  persona: Persona;
  characters: ReferenceCharacter[];
  /** Mockup images for the film. Gemini sees these when generating scenes and assigns them by visual content. */
  mockups: ProjectMockup[];
  scenes: Scene[];
  project_notes: string;
}

export interface PricingAssumptions {
  nano_banana_per_image: number;
  veo_per_clip: number;
  vo_per_minute: number;
  recommended_images_per_scene: number;
}

export interface AppSettings {
  runtime_system_prompt: string;
  pricing: PricingAssumptions;
  default_scene_count: number;
  default_energy_level: number;
  collaboration_mode: boolean;
  budget_cap?: number;
}
