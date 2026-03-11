"use client";

import { useState } from "react";
import type { ProjectMockup } from "@/types";

interface MockupStudioProps {
  mockups: ProjectMockup[];
  onMockupsChange: (mockups: ProjectMockup[]) => void;
}

function isPublicUrl(url: string): boolean {
  try {
    const host = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost").hostname;
    return host !== "localhost" && host !== "127.0.0.1";
  } catch {
    return false;
  }
}

export default function MockupStudio({ mockups, onMockupsChange }: MockupStudioProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setError(null);
    setUploading(true);
    const added: ProjectMockup[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        if (data.url) {
          added.push({ id: `mockup-${Date.now()}-${i}`, image_url: data.url });
        }
      }
      if (added.length) onMockupsChange([...mockups, ...added]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const remove = (id: string) => {
    onMockupsChange(mockups.filter((m) => m.id !== id));
  };

  const publicCount = mockups.filter((m) => isPublicUrl(m.image_url)).length;
  const needsDeploy = mockups.length > 0 && publicCount === 0;

  return (
    <div className="rounded-lg border border-border bg-surface-raised p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Mockups</h2>
      </div>
      <p className="text-xs text-zinc-500 mb-4">
        Bulk upload mockup images (screens, device frames, UI). When you <strong className="text-zinc-400">Generate scenes</strong>, the AI picks which mockup fits which scene and <strong className="text-zinc-400">auto-attaches</strong> them to the storyboard—no need to reattach or assign manually.
      </p>
      {needsDeploy && (
        <p className="text-xs text-amber-400/90 mb-3">
          These uploads are on localhost. Deploy the app so the AI can see them when generating scenes.
        </p>
      )}
      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
      <label className="block rounded border-2 border-dashed border-brand/50 px-4 py-4 text-center text-sm text-zinc-400 hover:bg-surface hover:border-brand cursor-pointer mb-4">
        {uploading ? "Uploading…" : "Choose files (multiple) — JPEG, PNG, WebP or GIF (max 10MB each)"}
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFiles}
          disabled={uploading}
        />
      </label>
      <div className="space-y-3">
        {mockups.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 rounded border border-border bg-surface p-2"
          >
            <img
              src={m.image_url.startsWith("http") ? m.image_url : `${typeof window !== "undefined" ? window.location.origin : ""}${m.image_url}`}
              alt=""
              className="w-16 h-16 object-cover rounded border border-border flex-shrink-0"
            />
            <span className="text-xs text-zinc-500 flex-1 truncate">
              {isPublicUrl(m.image_url) ? "Ready for AI" : "Local only"}
            </span>
            <button
              type="button"
              onClick={() => remove(m.id)}
              className="text-xs text-red-400 hover:underline flex-shrink-0"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      {mockups.length === 0 && (
        <p className="text-sm text-zinc-500 text-center py-4">No mockups yet. Upload above, then generate scenes so the AI can use them.</p>
      )}
    </div>
  );
}
