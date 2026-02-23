"use client";

import { useState, useEffect, useCallback } from "react";
import type { Project, ProjectConfig, Scene, AppSettings } from "@/types";
import { PERSONAS } from "@/data/personas";
import { loadProject, saveProject, loadSettings, saveSettings, loadSampleProject } from "@/lib/storage";
import { updateSceneCosts } from "@/lib/costEngine";
import ProjectWizard from "@/components/ProjectWizard";
import PersonaSelector from "@/components/PersonaSelector";
import CharacterStudio from "@/components/CharacterStudio";
import Storyboard from "@/components/Storyboard";
import BudgetDashboard from "@/components/BudgetDashboard";
import SettingsPanel from "@/components/SettingsPanel";
import ExportImport from "@/components/ExportImport";

type Tab = "project" | "storyboard" | "characters" | "budget" | "settings";

function emptyProject(): Project {
  const persona = PERSONAS[0];
  return {
    config: {
      id: `proj-${Date.now()}`,
      name: "Untitled Project",
      video_objective: "",
      target_audience_type: "",
      audience_description: "",
      energy_level: 3,
      visual_mode: "UI-heavy with occasional B-roll",
      estimated_scene_count: 10,
      brand_kit: {},
      reference_characters_required: false,
      persona_id: persona.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    persona,
    characters: [],
    scenes: [],
    project_notes: "",
  };
}

export default function Home() {
  const [project, setProject] = useState<Project | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("storyboard");
  const [showWizard, setShowWizard] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    const p = loadProject();
    const s = loadSettings();
    if (p) setProject(p);
    else setProject(loadSampleProject());
    setSettings(s);
  }, []);

  const persistProject = useCallback((p: Project) => {
    setProject(p);
    saveProject(p);
  }, []);

  const updateConfig = useCallback(
    (config: ProjectConfig) => {
      if (!project) return;
      const persona = PERSONAS.find((p) => p.id === config.persona_id) ?? project.persona;
      persistProject({
        ...project,
        config,
        persona,
      });
      setShowWizard(false);
    },
    [project, persistProject]
  );

  const updateScenes = useCallback(
    (scenes: Scene[]) => {
      if (!project) return;
      const pricing = settings?.pricing;
      const imgPerScene = pricing?.recommended_images_per_scene ?? 2.5;
      const withCosts = pricing
        ? updateSceneCosts(scenes, pricing, imgPerScene)
        : scenes;
      persistProject({ ...project, scenes: withCosts });
    },
    [project, settings, persistProject]
  );

  const handleGenerateScenes = useCallback(async () => {
    if (!project || !settings) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-scenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: settings.runtime_system_prompt,
          projectConfig: {
            video_objective: project.config.video_objective,
            target_audience_type: project.config.target_audience_type,
            audience_description: project.config.audience_description,
            energy_level: project.config.energy_level,
            visual_mode: project.config.visual_mode,
            estimated_scene_count: project.config.estimated_scene_count,
            reference_characters_required: project.config.reference_characters_required,
          },
          persona: {
            name: project.persona.name,
            motion_intensity: project.persona.motion_intensity,
            lighting_style: project.persona.lighting_style,
            ui_dominance: project.persona.ui_dominance,
            rhythm: project.persona.rhythm,
            voice_tone: project.persona.voice_tone,
            framing_rules: project.persona.framing_rules,
            color_behavior: project.persona.color_behavior,
          },
          brandMetadata: project.config.brand_kit,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      const scenes: Scene[] = data.scenes ?? [];
      updateScenes(scenes.length ? scenes : project.scenes);
      setGenerateError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to generate scenes";
      setGenerateError(msg);
      setTimeout(() => setGenerateError(""), 8000);
    } finally {
      setGenerating(false);
    }
  }, [project, settings, updateScenes]);

  const loadSample = useCallback(() => {
    persistProject(loadSampleProject());
    setShowWizard(false);
  }, [persistProject]);

  if (!project || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-500">
        Loading…
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "project", label: "Project" },
    { id: "storyboard", label: "Storyboard" },
    { id: "characters", label: "Characters" },
    { id: "budget", label: "Budget" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-surface-raised px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Vertical AI Demo Studio</h1>
        <div className="flex items-center gap-2">
          <ExportImport project={project} onProjectReplace={persistProject} />
          <button
            type="button"
            onClick={() => {
              persistProject(emptyProject());
              setShowWizard(true);
              setActiveTab("project");
            }}
            className="rounded border border-border px-3 py-1.5 text-sm text-zinc-400 hover:bg-surface"
          >
            New project
          </button>
          <button
            type="button"
            onClick={loadSample}
            className="rounded border border-border px-3 py-1.5 text-sm text-zinc-400 hover:bg-surface"
          >
            Load sample
          </button>
        </div>
      </header>

      <nav className="border-b border-border px-4 flex gap-1">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-sm font-medium rounded-t ${activeTab === id ? "bg-surface-raised text-white border border-border border-b-0 -mb-px" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            {label}
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-auto p-4">
        {activeTab === "project" && (
          <div className="max-w-2xl">
            {showWizard ? (
              <ProjectWizard
                config={project.config}
                onSave={updateConfig}
                onCancel={() => setShowWizard(false)}
              />
            ) : (
              <div className="rounded-lg border border-border bg-surface-raised p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{project.config.name}</h2>
                    <p className="text-sm text-zinc-500">{project.config.video_objective} · {project.config.estimated_scene_count} scenes</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowWizard(true)}
                    className="rounded border border-border px-3 py-1.5 text-sm text-zinc-400 hover:bg-surface"
                  >
                    Edit
                  </button>
                </div>
                <PersonaSelector
                  selectedId={project.config.persona_id}
                  onSelect={(persona) =>
                    persistProject({ ...project, persona })
                  }
                />
                <div className="mt-4">
                  <label className="block text-sm text-zinc-400 mb-1">Project notes</label>
                  <textarea
                    value={project.project_notes}
                    onChange={(e) =>
                      persistProject({ ...project, project_notes: e.target.value })
                    }
                    rows={3}
                    className="w-full rounded border border-border bg-surface px-3 py-2 text-zinc-300 focus:border-brand focus:outline-none resize-none"
                    placeholder="Team notes…"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "storyboard" && (
          <div className="h-[calc(100vh-12rem)]">
            <p className="mb-2 text-sm text-zinc-500">
              Use <strong className="text-zinc-400">Load sample</strong> to start from an example, or <strong className="text-zinc-400">New project</strong> then set up the project in the Project tab. Click <strong className="text-zinc-400">Generate scenes</strong> to have AI create a full storyboard (requires REPLICATE_API_TOKEN in .env.local).
            </p>
            {generateError && (
              <div className="mb-3 rounded border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {generateError}
                {generateError.includes("REPLICATE_API_TOKEN") && (
                  <span className="block mt-1 text-xs">Add REPLICATE_API_TOKEN to .env.local in the project root, then restart the dev server (npm run dev).</span>
                )}
              </div>
            )}
            <Storyboard
              scenes={project.scenes ?? []}
              characters={project.characters}
              onScenesChange={updateScenes}
              onGenerate={handleGenerateScenes}
              generating={generating}
            />
          </div>
        )}

        {activeTab === "characters" && (
          <div className="max-w-2xl">
            <CharacterStudio
              characters={project.characters}
              onCharactersChange={(characters) =>
                persistProject({ ...project, characters })
              }
            />
          </div>
        )}

        {activeTab === "budget" && (
          <div className="max-w-2xl">
            <BudgetDashboard
              scenes={project.scenes}
              pricing={settings.pricing}
              imagesPerScene={settings.pricing.recommended_images_per_scene}
              budgetCap={settings.budget_cap}
              onScenesUpdate={updateScenes}
            />
          </div>
        )}

        {activeTab === "settings" && (
          <div className="max-w-2xl">
            <SettingsPanel
              settings={settings}
              onSave={(s) => {
                setSettings(s);
                saveSettings(s);
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
}
