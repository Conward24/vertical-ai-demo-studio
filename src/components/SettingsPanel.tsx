"use client";

import type { AppSettings } from "@/types";
import { DEFAULT_RUNTIME_PROMPT } from "@/data/defaultSettings";

interface SettingsPanelProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export default function SettingsPanel({ settings, onSave }: SettingsPanelProps) {
  const update = (patch: Partial<AppSettings>) => {
    onSave({ ...settings, ...patch });
  };

  return (
    <div className="rounded-lg border border-border bg-surface-raised p-4 space-y-6">
      <h2 className="text-lg font-semibold text-white">Settings</h2>

      <div>
        <label className="block text-sm text-zinc-400 mb-2">Runtime system prompt (Gemini)</label>
        <p className="text-xs text-zinc-500 mb-1">Includes specialist instructions for NanoBanana, Veo, and voiceover. Edit to customize or reset to default.</p>
        <textarea
          value={settings.runtime_system_prompt}
          onChange={(e) => update({ runtime_system_prompt: e.target.value })}
          rows={14}
          className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-zinc-200 font-mono focus:border-brand focus:outline-none resize-y"
        />
        <button
          type="button"
          onClick={() => update({ runtime_system_prompt: DEFAULT_RUNTIME_PROMPT })}
          className="mt-1 text-xs text-zinc-500 hover:text-zinc-400"
        >
          Reset to default
        </button>
      </div>

      <div>
        <h3 className="text-sm font-medium text-zinc-300 mb-2">Pricing assumptions</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">NanoBanana per image ($)</label>
            <input
              type="number"
              step="0.01"
              value={settings.pricing.nano_banana_per_image}
              onChange={(e) =>
                update({
                  pricing: {
                    ...settings.pricing,
                    nano_banana_per_image: Number(e.target.value) || 0,
                  },
                })
              }
              className="w-full rounded border border-border bg-surface px-2 py-1 text-white focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Veo per second ($)</label>
            <input
              type="number"
              step="0.01"
              value={settings.pricing.veo_per_second ?? 0.1}
              onChange={(e) =>
                update({
                  pricing: {
                    ...settings.pricing,
                    veo_per_second: Number(e.target.value) ?? 0.1,
                  },
                })
              }
              className="w-full rounded border border-border bg-surface px-2 py-1 text-white focus:border-brand focus:outline-none"
            />
            <p className="text-[10px] text-zinc-500 mt-0.5">Video cost = duration (s) × this rate</p>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">VO per minute ($)</label>
            <input
              type="number"
              step="0.01"
              value={settings.pricing.vo_per_minute}
              onChange={(e) =>
                update({
                  pricing: {
                    ...settings.pricing,
                    vo_per_minute: Number(e.target.value) || 0,
                  },
                })
              }
              className="w-full rounded border border-border bg-surface px-2 py-1 text-white focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Recommended images per scene</label>
            <input
              type="number"
              step="0.5"
              min={1}
              max={5}
              value={settings.pricing.recommended_images_per_scene}
              onChange={(e) =>
                update({
                  pricing: {
                    ...settings.pricing,
                    recommended_images_per_scene: Number(e.target.value) || 2.5,
                  },
                })
              }
              className="w-full rounded border border-border bg-surface px-2 py-1 text-white focus:border-brand focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Default scene count</label>
          <input
            type="number"
            min={1}
            max={50}
            value={settings.default_scene_count}
            onChange={(e) =>
              update({ default_scene_count: Number(e.target.value) || 10 })
            }
            className="w-24 rounded border border-border bg-surface px-2 py-1 text-white focus:border-brand focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Default energy level (1–5)</label>
          <input
            type="number"
            min={1}
            max={5}
            value={settings.default_energy_level}
            onChange={(e) =>
              update({ default_energy_level: Number(e.target.value) || 3 })
            }
            className="w-24 rounded border border-border bg-surface px-2 py-1 text-white focus:border-brand focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-zinc-500 mb-1">Budget cap ($, optional)</label>
        <input
          type="number"
          step="0.01"
          min={0}
          value={settings.budget_cap ?? ""}
          onChange={(e) =>
            update({
              budget_cap: e.target.value === "" ? undefined : Number(e.target.value),
            })
          }
          placeholder="No cap"
          className="w-32 rounded border border-border bg-surface px-2 py-1 text-white focus:border-brand focus:outline-none"
        />
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={settings.collaboration_mode}
            onChange={(e) => update({ collaboration_mode: e.target.checked })}
            className="rounded border-border"
          />
          Collaboration mode (status + comments)
        </label>
      </div>
    </div>
  );
}
