"use client";

import { useCallback } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import type { Scene, ReferenceCharacter, ProjectMockup } from "@/types";
import { autoSequence } from "@/lib/autoSequence";
import SceneCard from "./SceneCard";

const SCENE_TYPE = "scene";

function DraggableSceneCard({
  scene,
  index,
  referenceImageUrl,
  characters,
  mockups,
  onUpdate,
  onMove,
  onImageGenerated,
  onVideoGenerated,
}: {
  scene: Scene;
  index: number;
  referenceImageUrl?: string | null;
  characters: ReferenceCharacter[];
  mockups: ProjectMockup[];
  onUpdate: (scene: Scene) => void;
  onMove: (from: number, to: number) => void;
  onImageGenerated?: () => void;
  onVideoGenerated?: (durationSeconds?: number) => void;
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
        onUpdate={onUpdate}
        referenceImageUrl={referenceImageUrl}
        characters={characters}
        mockups={mockups}
        onImageGenerated={onImageGenerated}
        onVideoGenerated={onVideoGenerated}
        isDragging={isDragging}
        dragHandleProps={{}}
      />
    </div>
  );
}

function StoryboardInner({
  scenes: scenesProp,
  characters = [],
  mockups = [],
  onScenesChange,
  onGenerate,
  onImageGenerated,
  onVideoGenerated,
  generating,
}: {
  scenes: Scene[];
  characters?: ReferenceCharacter[];
  mockups?: ProjectMockup[];
  onScenesChange: (scenes: Scene[] | ((prev: Scene[]) => Scene[])) => void;
  onGenerate: () => void;
  onImageGenerated?: () => void;
  onVideoGenerated?: (durationSeconds?: number) => void;
  generating: boolean;
}) {
  const scenes = Array.isArray(scenesProp) ? scenesProp : [];
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-white">Storyboard</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={addScene}
            className="rounded border border-border bg-surface-raised px-3 py-1.5 text-sm text-zinc-300 hover:bg-surface"
          >
            Add scene
          </button>
          <button
            type="button"
            onClick={runAutoSequence}
            disabled={scenes.length < 2}
            className="rounded border border-border bg-surface-raised px-3 py-1.5 text-sm text-zinc-300 hover:bg-surface disabled:opacity-50"
          >
            Auto sequence
          </button>
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
      <div className="flex-1 overflow-x-auto overflow-y-auto pb-4 scrollbar-thin">
        <div className="flex gap-4 min-w-min p-2">
          {scenes.map((scene, i) => (
            <DraggableSceneCard
              key={`${scene.scene_number}-${i}`}
              scene={scene}
              index={i}
              referenceImageUrl={getReferenceImageUrl(scene)}
              characters={characters}
              mockups={mockups}
              onUpdate={updateScene}
              onMove={moveScene}
              onImageGenerated={onImageGenerated}
              onVideoGenerated={onVideoGenerated}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Storyboard({
  scenes,
  characters,
  mockups,
  onScenesChange,
  onGenerate,
  onImageGenerated,
  onVideoGenerated,
  generating,
}: {
  scenes: Scene[];
  characters?: ReferenceCharacter[];
  mockups?: ProjectMockup[];
  onScenesChange: (scenes: Scene[] | ((prev: Scene[]) => Scene[])) => void;
  onGenerate: () => void;
  onImageGenerated?: () => void;
  onVideoGenerated?: (durationSeconds?: number) => void;
  generating: boolean;
}) {
  return (
    <DndProvider backend={HTML5Backend}>
      <StoryboardInner
        scenes={scenes}
        characters={characters}
        mockups={mockups}
        onScenesChange={onScenesChange}
        onGenerate={onGenerate}
        onImageGenerated={onImageGenerated}
        onVideoGenerated={onVideoGenerated}
        generating={generating}
      />
    </DndProvider>
  );
}
