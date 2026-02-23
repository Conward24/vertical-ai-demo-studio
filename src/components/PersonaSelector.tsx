"use client";

import type { Persona } from "@/types";
import { PERSONAS } from "@/data/personas";

interface PersonaSelectorProps {
  selectedId: string;
  onSelect: (persona: Persona) => void;
  locked?: boolean;
}

export default function PersonaSelector({
  selectedId,
  onSelect,
  locked = false,
}: PersonaSelectorProps) {
  const current = PERSONAS.find((p) => p.id === selectedId) ?? PERSONAS[0];

  return (
    <div className="rounded-lg border border-border bg-surface-raised p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Producer persona</h3>
        {locked && (
          <span className="text-xs text-zinc-500">Locked</span>
        )}
      </div>
      <select
        value={selectedId}
        onChange={(e) => {
          const p = PERSONAS.find((x) => x.id === e.target.value);
          if (p) onSelect(p);
        }}
        disabled={locked}
        className="w-full rounded border border-border bg-surface px-3 py-2 text-white focus:border-brand focus:outline-none disabled:opacity-60"
      >
        {PERSONAS.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <p className="mt-2 text-xs text-zinc-500">{current.description}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <dt className="text-zinc-500">Motion</dt>
        <dd className="text-zinc-300">{current.motion_intensity}/5</dd>
        <dt className="text-zinc-500">Lighting</dt>
        <dd className="text-zinc-300">{current.lighting_style}</dd>
        <dt className="text-zinc-500">UI dominance</dt>
        <dd className="text-zinc-300">{current.ui_dominance}/5</dd>
        <dt className="text-zinc-500">Voice</dt>
        <dd className="text-zinc-300">{current.voice_tone}</dd>
      </dl>
    </div>
  );
}
