"use client";

import { useCallback, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import type { Scene, ReferenceCharacter, ProjectMockup, Project } from "@/types";
import { autoSequence } from "@/lib/autoSequence";
import SceneCard from "./SceneCard";

const SCENE_TYPE = "scene";

function DraggableSceneCard({
  scene,
  index,
  totalScenes,
  referenceImageUrl,
  characters,
  mockups,
  onUpdate,
  onMove,
  onImageGenerated,
  onVideoGenerated,
  onGenerateImagesFromIndex,
  onDelete,
}: {
  scene: Scene;
  index: number;
  totalScenes: number;
  referenceImageUrl?: string | null;
  characters: ReferenceCharacter[];
  mockups: ProjectMockup[];
  onUpdate: (scene: Scene) => void;
  onMove: (from: number, to: number) => void;
  onImageGenerated?: () => void;
  onVideoGenerated?: (durationSeconds?: number) => void;
  onGenerateImagesFromIndex?: (index: number) => void;
  onDelete?: (index: number) => void;
}) {
  const [{ isDragging }, ref] = useDrag({
    type: SCENE_TYPE,
    item: { index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [{ isOver }, dropRef] = useDrop({
    accept: SCENE_TYPE,
    drop: (item: { index: number }) => {
      if (item.index !== index) onMove(item.index, index);
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });

  return (
    <div
      ref={(node) => {
        ref(node);
        dropRef(node);
      }}
      className={isOver ? "ring-2 ring-brand rounded-lg" : ""}
    >
      <SceneCard
        scene={scene}
        sceneIndex={index}
        totalScenes={totalScenes}
        onUpdate={onUpdate}
        onDelete={onDelete}
        referenceImageUrl={referenceImageUrl}
        characters={characters}
        mockups={mockups}
        onImageGenerated={onImageGenerated}
        onVideoGenerated={onVideoGenerated}
        onGenerateImagesFromIndex={onGenerateImagesFromIndex}
        isDragging={isDragging}
        dragHandleProps={{}}
      />
    </div>
  );
}

function StoryboardInner({
  project,
  scenes: scenesProp,
  characters = [],
  mockups = [],
  onScenesChange,
  onGenerate,
  onImageGenerated,
  onVideoGenerated,
  generating,
  onGenerateAllImages,
  generatingAllImages,
}: {
  project: Project | null;
  scenes: Scene[];
  characters?: ReferenceCharacter[];
  mockups?: ProjectMockup[];
  onScenesChange: (scenes: Scene[] | ((prev: Scene[]) => Scene[])) => void;
  onGenerate: () => void;
  onImageGenerated?: () => void;
  onVideoGenerated?: (durationSeconds?: number) => void;
  generating: boolean;
  onGenerateAllImages?: (useContinuity: boolean, startIndex?: number) => void;
  generatingAllImages?: boolean;
}) {
  const scenes = Array.isArray(scenesProp) ? scenesProp : [];
  const [showAddFromDescription, setShowAddFromDescription] = useState(false);
  const [addDescriptionText, setAddDescriptionText] = useState("");
  const [addDescriptionInsertAfter, setAddDescriptionInsertAfter] = useState(scenes.length);
  const [addDescriptionSubmitting, setAddDescriptionSubmitting] = useState(false);
  const [addDescriptionError, setAddDescriptionError] = useState<string | null>(null);
  const [useContinuity, setUseContinuity] = useState(false);
  const firstRefImageUrl = characters.find((c) => c.reference_image_url)?.reference_image_url ?? null;

  const getReferenceImageUrl = useCallback(
    (scene: Scene): string | null => {
      if (!scene.uses_character) return null;
      if (scene.character_id) {
        const c = characters.find((ch) => ch.id === scene.character_id);
        return c?.reference_image_url ?? null;
      }
      return firstRefImageUrl;
    },
    [characters, firstRefImageUrl]
  );

  const moveScene = useCallback(
    (from: number, to: number) => {
      const next = [...scenes];
      const [removed] = next.splice(from, 1);
      next.splice(to, 0, removed);
      next.forEach((s, i) => (s.scene_number = i + 1));
      onScenesChange(next);
    },
    [scenes, onScenesChange]
  );

  const updateScene = useCallback(
    (updated: Scene) => {
      onScenesChange((prev) =>
        prev.map((s) =>
          s.scene_number === updated.scene_number ? updated : s
        )
      );
    },
    [onScenesChange]
  );

  const runAutoSequence = useCallback(() => {
    const next = autoSequence(scenes);
    onScenesChange(next);
  }, [scenes, onScenesChange]);

  const deleteSceneAt = useCallback(
    (index: number) => {
      if (scenes.length <= 1) return;
      const next = scenes.filter((_, i) => i !== index).map((s, i) => ({
        ...s,
        scene_number: i + 1,
      }));
      onScenesChange(next);
    },
    [scenes, onScenesChange]
  );

  const addScene = useCallback(() => {
    const nextNum = scenes.length + 1;
    onScenesChange([
      ...scenes,
      {
        scene_number: nextNum,
        title: `Scene ${nextNum}`,
        purpose: "",
        mockup_required: false,
        uses_character: false,
        nano_prompt: "",
        veo_prompt: "",
        vo_line_1: "",
        vo_line_2: "",
        on_screen_text: "",
        audio_direction: "",
        estimated_cost: 0,
        status: "Draft",
        comment: "",
        version: 1,
        character_id: undefined,
        video_duration_seconds: 8,
      },
    ]);
  }, [scenes, onScenesChange]);

  const handleAddFromDescription = useCallback(async () => {
    if (!addDescriptionText.trim() || !project) return;
    setAddDescriptionError(null);
    setAddDescriptionSubmitting(true);
    try {
      const insertIndex = Math.min(addDescriptionInsertAfter, scenes.length);
      const previousScene = insertIndex > 0 ? scenes[insertIndex - 1] : undefined;
      const res = await fetch("/api/generate-scene-from-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: addDescriptionText.trim(),
          projectConfig: {
            video_objective: project.config.video_objective,
            target_audience_type: project.config.target_audience_type,
            audience_description: project.config.audience_description,
            visual_mode: project.config.visual_mode,
          },
          persona: {
            name: project.persona.name,
            voice_tone: project.persona.voice_tone,
            lighting_style: project.persona.lighting_style,
            framing_rules: project.persona.framing_rules,
            rhythm: project.persona.rhythm,
          },
          previousScene: previousScene
            ? { title: previousScene.title, purpose: previousScene.purpose, nano_prompt: previousScene.nano_prompt }
            : undefined,
          nextSceneNumber: insertIndex + 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || "Failed to generate scene");
      const newScene = data.scene as Scene;
      const next = [...scenes];
      next.splice(insertIndex, 0, newScene);
      next.forEach((s, i) => (s.scene_number = i + 1));
      onScenesChange(next);
      setShowAddFromDescription(false);
      setAddDescriptionText("");
      setAddDescriptionInsertAfter(scenes.length + 1);
    } catch (e) {
      setAddDescriptionError(e instanceof Error ? e.message : "Failed");
    } finally {
      setAddDescriptionSubmitting(false);
    }
  }, [addDescriptionText, addDescriptionInsertAfter, scenes, project, onScenesChange]);

  const handleGenerateImagesFromIndex = useCallback(
    (index: number) => {
      onGenerateAllImages?.(useContinuity, index);
    },
    [onGenerateAllImages, useContinuity]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-white">Storyboard</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={addScene}
            className="rounded border border-border bg-surface-raised px-3 py-1.5 text-sm text-zinc-300 hover:bg-surface"
          >
            Add scene
          </button>
          <button
            type="button"
            onClick={() => setShowAddFromDescription(true)}
            className="rounded border border-border bg-surface-raised px-3 py-1.5 text-sm text-zinc-300 hover:bg-surface"
          >
            Add from description
          </button>
          <button
            type="button"
            onClick={runAutoSequence}
            disabled={scenes.length < 2}
            className="rounded border border-border bg-surface-raised px-3 py-1.5 text-sm text-zinc-300 hover:bg-surface disabled:opacity-50"
          >
            Auto sequence
          </button>
          {onGenerateAllImages && (
            <>
              <label className="flex items-center gap-1.5 text-xs text-zinc-400">
                <input
                  type="checkbox"
                  checked={useContinuity}
                  onChange={(e) => setUseContinuity(e.target.checked)}
                  className="rounded border-border"
                />
                Continuity
              </label>
              <button
                type="button"
                onClick={() => onGenerateAllImages(useContinuity, 0)}
                disabled={generatingAllImages || scenes.length === 0}
                className="rounded border border-brand bg-brand/20 px-3 py-1.5 text-sm text-white hover:bg-brand/30 disabled:opacity-50"
              >
                {generatingAllImages ? "Generating…" : "Generate all images"}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onGenerate}
            disabled={generating}
            className="rounded bg-brand px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {generating ? "Generating…" : "Generate scenes"}
          </button>
        </div>
      </div>

      {showAddFromDescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="rounded-lg border border-border bg-surface-raised p-4 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-2">Add scene from description</h3>
            <p className="text-xs text-zinc-500 mb-2">Describe the scene; the AI will generate title, prompts, and VO.</p>
            <textarea
              value={addDescriptionText}
              onChange={(e) => setAddDescriptionText(e.target.value)}
              placeholder="e.g. Transition card: Member Experience — Support between visits. Warm gradient, lotus watermark."
              rows={3}
              className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-brand focus:outline-none resize-y mb-3"
            />
            <div className="mb-3">
              <label className="block text-xs text-zinc-500 mb-1">Insert after</label>
              <select
                value={addDescriptionInsertAfter}
                onChange={(e) => setAddDescriptionInsertAfter(Number(e.target.value))}
                className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
              >
                <option value={0}>At start (before Scene 1)</option>
                {scenes.map((_, i) => (
                  <option key={i} value={i + 1}>After Scene {i + 1}</option>
                ))}
                <option value={scenes.length}>At end</option>
              </select>
            </div>
            {addDescriptionError && <p className="text-xs text-red-400 mb-2">{addDescriptionError}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddFromDescription}
                disabled={addDescriptionSubmitting || !addDescriptionText.trim() || !project}
                className="rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-50"
              >
                {addDescriptionSubmitting ? "Generating…" : "Add scene"}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddFromDescription(false); setAddDescriptionError(null); }}
                className="rounded border border-border px-4 py-2 text-sm text-zinc-400 hover:bg-surface"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-x-auto overflow-y-auto pb-4 scrollbar-thin">
        <div className="flex gap-4 min-w-min p-2">
          {scenes.map((scene, i) => (
            <DraggableSceneCard
              key={`${scene.scene_number}-${i}`}
              scene={scene}
              index={i}
              totalScenes={scenes.length}
              referenceImageUrl={getReferenceImageUrl(scene)}
              characters={characters}
              mockups={mockups}
              onUpdate={updateScene}
              onMove={moveScene}
              onImageGenerated={onImageGenerated}
              onVideoGenerated={onVideoGenerated}
              onGenerateImagesFromIndex={onGenerateAllImages ? handleGenerateImagesFromIndex : undefined}
              onDelete={deleteSceneAt}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Storyboard({
  project,
  scenes,
  characters,
  mockups,
  onScenesChange,
  onGenerate,
  onImageGenerated,
  onVideoGenerated,
  generating,
  onGenerateAllImages,
  generatingAllImages,
}: {
  project: Project;
  scenes: Scene[];
  characters?: ReferenceCharacter[];
  mockups?: ProjectMockup[];
  onScenesChange: (scenes: Scene[] | ((prev: Scene[]) => Scene[])) => void;
  onGenerate: () => void;
  onImageGenerated?: () => void;
  onVideoGenerated?: (durationSeconds?: number) => void;
  generating: boolean;
  onGenerateAllImages?: (useContinuity: boolean, startIndex?: number) => void;
  generatingAllImages?: boolean;
}) {
  return (
    <DndProvider backend={HTML5Backend}>
      <StoryboardInner
        project={project}
        scenes={scenes}
        characters={characters}
        mockups={mockups}
        onScenesChange={onScenesChange}
        onGenerate={onGenerate}
        onImageGenerated={onImageGenerated}
        onVideoGenerated={onVideoGenerated}
        generating={generating}
        onGenerateAllImages={onGenerateAllImages}
        generatingAllImages={generatingAllImages}
      />
    </DndProvider>
  );
}
