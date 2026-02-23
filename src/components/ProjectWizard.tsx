"use client";

import { useState } from "react";
import type { ProjectConfig, BrandKit } from "@/types";
import { PERSONAS } from "@/data/personas";
import { ENERGY_LEVELS, VISUAL_MODES, VIDEO_OBJECTIVE_CATEGORIES } from "@/data/projectOptions";

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
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(config?.persona_id || PERSONAS[0].id);
  const selectedPersona = PERSONAS.find((p) => p.id === selectedPersonaId) ?? PERSONAS[0];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const get = (name: string) =>
      (form.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null)
        ?.value ?? "";
    const personaId = get("persona_id") || PERSONAS[0].id;
    const persona = PERSONAS.find((p) => p.id === personaId)!;
    const newConfig: ProjectConfig = {
      id: config?.id ?? `proj-${Date.now()}`,
      name: get("name") || "Untitled Project",
      video_objective: get("video_objective").trim() || "Demo video for product.",
      target_audience_type: get("target_audience_type"),
      audience_description: get("audience_description"),
      energy_level: Number(get("energy_level")) || 3,
      visual_mode: get("visual_mode") || VISUAL_MODES[0].value,
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
      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* Step 1: What kind of film? */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-300">What kind of film?</h3>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Producer persona</label>
            <select
              name="persona_id"
              value={selectedPersonaId}
              onChange={(e) => setSelectedPersonaId(e.target.value)}
              className="w-full rounded border border-border bg-surface px-3 py-2 text-white focus:border-brand focus:outline-none"
            >
              {PERSONAS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-zinc-500">{selectedPersona.description}</p>
            {selectedPersona.image_url && (
              <img src={selectedPersona.image_url} alt="" className="mt-2 w-full max-w-xs rounded border border-border aspect-video object-cover" />
            )}
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Energy level (1–5)</label>
            <select
              name="energy_level"
              defaultValue={config?.energy_level ?? 3}
              className="w-full rounded border border-border bg-surface px-3 py-2 text-white focus:border-brand focus:outline-none"
            >
              {ENERGY_LEVELS.map(({ level, label }) => (
                <option key={level} value={level}>{level} – {label}</option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-zinc-500">Pacing and motion intensity. Choose what fits your topic and persona:</p>
            <ul className="mt-1 text-xs text-zinc-500 list-disc list-inside space-y-0.5">
              {ENERGY_LEVELS.map(({ level, label, description }) => (
                <li key={level}>
                  <span className="text-zinc-400 font-medium">{level} – {label}:</span> {description}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Step 2: What's it about? */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-300">What’s it about?</h3>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">In a sentence or two, what should this video do?</label>
            <textarea
              name="video_objective"
              rows={3}
              defaultValue={config?.video_objective}
              className="w-full rounded border border-border bg-surface px-3 py-2 text-white placeholder-zinc-500 focus:border-brand focus:outline-none resize-y"
              placeholder="e.g. Get new users to complete their first workflow in the app, or: Show product teams how to set up the dashboard in 60 seconds"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Roughly how many scenes?</label>
            <input
              name="estimated_scene_count"
              type="number"
              min={1}
              max={50}
              defaultValue={config?.estimated_scene_count ?? 10}
              className="w-24 rounded border border-border bg-surface px-3 py-2 text-white focus:border-brand focus:outline-none"
            />
            <p className="mt-1 text-xs text-zinc-500">AI will aim for this; you can add or remove scenes later.</p>
          </div>
        </section>

        {/* More options (collapsible) */}
        <div>
          <button
            type="button"
            onClick={() => setShowMoreOptions((v) => !v)}
            className="text-sm text-zinc-400 hover:text-zinc-300 flex items-center gap-1"
          >
            {showMoreOptions ? "−" : "+"} More options (audience, visual style, characters)
          </button>
          {showMoreOptions && (
            <div className="mt-3 space-y-4 pl-0 border-l-2 border-border pl-3">
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
                  className="w-full rounded border border-border bg-surface px-3 py-2 text-white placeholder-zinc-500 focus:border-brand focus:outline-none resize-y"
                  placeholder="Who they are, what they care about"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Visual mode</label>
                <select
                  name="visual_mode"
                  defaultValue={config?.visual_mode || VISUAL_MODES[0].value}
                  className="w-full rounded border border-border bg-surface px-3 py-2 text-white focus:border-brand focus:outline-none"
                >
                  {VISUAL_MODES.map((v) => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-zinc-500">How much screen vs. person vs. abstract:</p>
                <ul className="mt-1 text-xs text-zinc-500 space-y-0.5">
                  {VISUAL_MODES.map((v) => (
                    <li key={v.value}>
                      <span className="text-zinc-400 font-medium">{v.label}:</span> {v.description}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Reference characters required?</label>
                <select
                  name="reference_characters_required"
                  defaultValue={config?.reference_characters_required ? "yes" : "no"}
                  className="w-full rounded border border-border bg-surface px-3 py-2 text-white focus:border-brand focus:outline-none"
                >
                  <option value="no">No — UI-only or abstract scenes only</option>
                  <option value="yes">Yes — some scenes will show a person (add them in Characters tab)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Objective category (optional)</label>
                <select
                  name="video_objective_category"
                  defaultValue={
                    VIDEO_OBJECTIVE_CATEGORIES.some((c) => c.value === config?.video_objective)
                      ? config?.video_objective
                      : "Other"
                  }
                  className="w-full rounded border border-border bg-surface px-3 py-2 text-white focus:border-brand focus:outline-none"
                >
                  {VIDEO_OBJECTIVE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.value}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-zinc-500">For your reference; the text above is what drives the storyboard.</p>
                <ul className="mt-1 text-xs text-zinc-500 space-y-0.5">
                  {VIDEO_OBJECTIVE_CATEGORIES.map((c) => (
                    <li key={c.value}>
                      <span className="text-zinc-400 font-medium">{c.value}:</span> {c.description}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
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
