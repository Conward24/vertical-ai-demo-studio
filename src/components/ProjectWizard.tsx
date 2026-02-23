"use client";

import type { ProjectConfig, BrandKit } from "@/types";
import { PERSONAS } from "@/data/personas";

const VIDEO_OBJECTIVES = [
  "Product onboarding",
  "Feature explainer",
  "Brand story",
  "Testimonial",
  "Tutorial",
  "Launch announcement",
  "Other",
];

const VISUAL_MODES = [
  "UI-heavy with occasional B-roll",
  "Talking head + B-roll",
  "Full UI/screen capture",
  "Mixed (person + UI)",
  "Abstract/visual only",
];

interface ProjectWizardProps {
  config: Partial<ProjectConfig> | null;
  onSave: (config: ProjectConfig) => void;
  onCancel?: () => void;
}

export default function ProjectWizard({
  config,
  onSave,
  onCancel,
}: ProjectWizardProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const get = (name: string) =>
      (form.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLSelectElement | null)
        ?.value ?? "";
    const personaId = get("persona_id") || PERSONAS[0].id;
    const persona = PERSONAS.find((p) => p.id === personaId)!;
    const newConfig: ProjectConfig = {
      id: config?.id ?? `proj-${Date.now()}`,
      name: get("name") || "Untitled Project",
      video_objective: get("video_objective"),
      target_audience_type: get("target_audience_type"),
      audience_description: get("audience_description"),
      energy_level: Number(get("energy_level")) || 3,
      visual_mode: get("visual_mode") || VISUAL_MODES[0],
      estimated_scene_count: Number(get("estimated_scene_count")) || 10,
      brand_kit: (config?.brand_kit as BrandKit) ?? {},
      reference_characters_required: get("reference_characters_required") === "yes",
      persona_id: personaId,
      created_at: config?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    onSave(newConfig);
  };

  return (
    <div className="rounded-lg border border-border bg-surface-raised p-6">
      <h2 className="text-lg font-semibold text-white mb-4">New Project</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Project name</label>
          <input
            name="name"
            type="text"
            defaultValue={config?.name}
            className="w-full rounded border border-border bg-surface px-3 py-2 text-white placeholder-zinc-500 focus:border-brand focus:outline-none"
            placeholder="My Demo Video"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Video objective</label>
          <select
            name="video_objective"
            defaultValue={config?.video_objective || VIDEO_OBJECTIVES[0]}
            className="w-full rounded border border-border bg-surface px-3 py-2 text-white focus:border-brand focus:outline-none"
          >
            {VIDEO_OBJECTIVES.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Target audience type</label>
          <input
            name="target_audience_type"
            type="text"
            defaultValue={config?.target_audience_type}
            className="w-full rounded border border-border bg-surface px-3 py-2 text-white placeholder-zinc-500 focus:border-brand focus:outline-none"
            placeholder="e.g. Product teams, CTOs"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Audience description</label>
          <textarea
            name="audience_description"
            rows={2}
            defaultValue={config?.audience_description}
            className="w-full rounded border border-border bg-surface px-3 py-2 text-white placeholder-zinc-500 focus:border-brand focus:outline-none"
            placeholder="Who they are, what they care about"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Energy level (1–5)</label>
          <input
            name="energy_level"
            type="number"
            min={1}
            max={5}
            defaultValue={config?.energy_level ?? 3}
            className="w-full rounded border border-border bg-surface px-3 py-2 text-white focus:border-brand focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Visual mode</label>
          <select
            name="visual_mode"
            defaultValue={config?.visual_mode || VISUAL_MODES[0]}
            className="w-full rounded border border-border bg-surface px-3 py-2 text-white focus:border-brand focus:outline-none"
          >
            {VISUAL_MODES.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Estimated scene count</label>
          <input
            name="estimated_scene_count"
            type="number"
            min={1}
            max={50}
            defaultValue={config?.estimated_scene_count ?? 10}
            className="w-full rounded border border-border bg-surface px-3 py-2 text-white focus:border-brand focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Reference characters required?</label>
          <select
            name="reference_characters_required"
            defaultValue={config?.reference_characters_required ? "yes" : "no"}
            className="w-full rounded border border-border bg-surface px-3 py-2 text-white focus:border-brand focus:outline-none"
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Producer persona</label>
          <select
            name="persona_id"
            defaultValue={config?.persona_id || PERSONAS[0].id}
            className="w-full rounded border border-border bg-surface px-3 py-2 text-white focus:border-brand focus:outline-none"
          >
            {PERSONAS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Save project
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded border border-border px-4 py-2 text-sm text-zinc-400 hover:bg-surface-raised"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
