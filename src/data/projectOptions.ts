/**
 * Options for the project wizard with labels and descriptions for clarity.
 */

export const ENERGY_LEVELS = [
  { level: 1, label: "Documentary stillness", description: "Minimal motion, long holds, observational. Best for sensitive or serious topics." },
  { level: 2, label: "Observational explainer", description: "Calm, clear pacing. Light motion and B-roll. Good for education and trust-building." },
  { level: 3, label: "Premium product demo", description: "Polished, deliberate. Balanced motion and clarity. Default for most product videos." },
  { level: 4, label: "Kinetic SaaS demo", description: "Faster cuts, more dynamic. Energetic but still professional." },
  { level: 5, label: "High-energy motion-forward", description: "Fast-paced, attention-grabbing. Use sparingly; avoid for healthcare or sensitive contexts." },
] as const;

export const VISUAL_MODES = [
  { value: "UI-heavy with occasional B-roll", label: "UI-heavy with occasional B-roll", description: "Mostly screen or interface; cut away to shots of people or product a few times." },
  { value: "Talking head + B-roll", label: "Talking head + B-roll", description: "Person on camera with supporting footage. Classic explainer or testimonial style." },
  { value: "Full UI/screen capture", label: "Full UI/screen capture", description: "Entire video is screen recording. No live-action footage." },
  { value: "Mixed (person + UI)", label: "Mixed (person + UI)", description: "Alternates between someone on camera and interface. Balanced presence and product." },
  { value: "Abstract/visual only", label: "Abstract/visual only", description: "No UI or talking head. Graphics, motion, or mood visuals only." },
] as const;

export const VIDEO_OBJECTIVE_CATEGORIES = [
  { value: "Product onboarding", description: "Get new users started with your product." },
  { value: "Feature explainer", description: "Show how a specific feature works." },
  { value: "Brand story", description: "Convey your mission, values, or origin." },
  { value: "Testimonial", description: "Customer or user sharing their experience." },
  { value: "Tutorial", description: "Step-by-step how-to or walkthrough." },
  { value: "Launch announcement", description: "Introduce something new to the world." },
  { value: "Other", description: "Something else—describe in your own words above." },
] as const;
