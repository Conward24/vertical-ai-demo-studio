"use client";

import { useState } from "react";
import type { ReferenceCharacter } from "@/types";

interface CharacterStudioProps {
  characters: ReferenceCharacter[];
  onCharactersChange: (characters: ReferenceCharacter[]) => void;
}

export default function CharacterStudio({
  characters,
  onCharactersChange,
}: CharacterStudioProps) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const handleAttachReference = async (characterId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingId(characterId);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      if (data.url) {
        onCharactersChange(
          characters.map((c) => (c.id === characterId ? { ...c, reference_image_url: data.url } : c))
        );
      }
    } finally {
      setUploadingId(null);
      e.target.value = "";
    }
  };

  const add = () => {
    onCharactersChange([
      ...characters,
      {
        id: `char-${Date.now()}`,
        role_label: "",
        nano_prompt: "",
        anchor_description: "",
        approved: false,
      },
    ]);
  };

  const update = (id: string, patch: Partial<ReferenceCharacter>) => {
    onCharactersChange(
      characters.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
  };

  const remove = (id: string) => {
    onCharactersChange(characters.filter((c) => c.id !== id));
  };

  return (
    <div className="rounded-lg border border-border bg-surface-raised p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Character studio</h2>
        <button
          type="button"
          onClick={add}
          className="rounded bg-brand px-3 py-1.5 text-sm text-white hover:opacity-90"
        >
          Add character
        </button>
      </div>
      <p className="text-xs text-zinc-500 mb-4">
        Add characters and <strong className="text-zinc-400">upload a reference image</strong> for each. Scenes with &quot;Character&quot; checked will use this image so the AI matches the same person.
        {characters.some((c) => c.id.startsWith("char-proposed-")) && (
          <span className="block mt-1 text-brand/90">Characters proposed by the storyboard are below; edit prompts and upload references, then approve.</span>
        )}
      </p>
      <div className="space-y-4">
        {characters.map((c) => (
          <div
            key={c.id}
            className="rounded border border-border bg-surface p-4 space-y-3"
          >
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Upload reference image (photo for AI to match)</label>
              {c.reference_image_url ? (
                <div className="space-y-1">
                  <img src={c.reference_image_url} alt="" className="w-full max-h-40 object-contain rounded border border-border bg-surface-raised" />
                  <div className="flex gap-2">
                    <label className="rounded border border-border px-2 py-1 text-xs text-zinc-400 hover:bg-surface cursor-pointer">
                      Replace
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAttachReference(c.id, e)} disabled={uploadingId === c.id} />
                    </label>
                    <button type="button" onClick={() => update(c.id, { reference_image_url: undefined })} className="text-xs text-red-400 hover:underline">
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="block rounded border-2 border-dashed border-brand/50 px-4 py-4 text-xs text-zinc-400 hover:bg-surface hover:border-brand cursor-pointer text-center">
                  {uploadingId === c.id ? "Uploading…" : "Choose image — JPEG, PNG, WebP or GIF (max 10MB)"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAttachReference(c.id, e)} disabled={uploadingId === c.id} />
                </label>
              )}
            </div>
            <div className="flex justify-between items-start">
              <input
                value={c.role_label}
                onChange={(e) => update(c.id, { role_label: e.target.value })}
                placeholder="Role (e.g. Host, Expert)"
                className="flex-1 rounded border border-border bg-surface-raised px-2 py-1 text-sm text-white focus:border-brand focus:outline-none mr-2"
              />
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-xs text-zinc-400">
                  <input
                    type="checkbox"
                    checked={c.approved}
                    onChange={(e) => update(c.id, { approved: e.target.checked })}
                    className="rounded border-border"
                  />
                  Approved
                </label>
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  className="text-xs text-red-400 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">NanoBanana reference prompt</label>
              <textarea
                value={c.nano_prompt}
                onChange={(e) => update(c.id, { nano_prompt: e.target.value })}
                rows={3}
                className="w-full rounded border border-border bg-surface-raised px-2 py-1 text-xs text-zinc-300 focus:border-brand focus:outline-none resize-y min-h-[4rem]"
                placeholder="Prompt for reference image generation (or describe the attached image)"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Character anchor description</label>
              <input
                value={c.anchor_description}
                onChange={(e) => update(c.id, { anchor_description: e.target.value })}
                className="w-full rounded border border-border bg-surface-raised px-2 py-1 text-xs text-zinc-300 focus:border-brand focus:outline-none"
                placeholder="Stored description for consistency"
              />
            </div>
          </div>
        ))}
        {characters.length === 0 && (
          <div className="rounded border border-dashed border-border p-6 text-center">
            <p className="text-sm text-zinc-500 mb-2">No characters yet.</p>
            <p className="text-xs text-zinc-600 mb-3">Click &quot;Add character&quot; above, then upload a reference image so the AI can match that person in scenes where you check &quot;Character&quot;.</p>
            <button type="button" onClick={add} className="rounded bg-brand px-4 py-2 text-sm text-white hover:opacity-90">
              Add character
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
