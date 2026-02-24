"use client";

import { useState } from "react";
import type { Scene, SceneStatus, ReferenceCharacter } from "@/types";

const STATUS_OPTIONS: SceneStatus[] = ["Draft", "In Review", "Approved", "Locked"];

interface SceneCardProps {
  scene: Scene;
  onUpdate: (scene: Scene) => void;
  /** When scene uses_character, pass the reference image URL for NanoBanana. */
  referenceImageUrl?: string | null;
  /** List of project characters for per-scene character selection. */
  characters?: ReferenceCharacter[];
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
}

export default function SceneCard({
  scene,
  onUpdate,
  referenceImageUrl,
  characters = [],
  isDragging,
  dragHandleProps,
}: SceneCardProps) {
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [uploadingMockup, setUploadingMockup] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const update = (patch: Partial<Scene>) => {
    onUpdate({ ...scene, ...patch });
  };

  const handleAttachMockup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGenError(null);
    setUploadingMockup(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      if (data.url) update({ attached_mockup_url: data.url });
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingMockup(false);
      e.target.value = "";
    }
  };

  const handleGenerateImage = async () => {
    if (!scene.nano_prompt?.trim()) {
      setGenError("Add a NanoBanana prompt first");
      return;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const toAbsolute = (url: string) => (url.startsWith("http") ? url : `${origin}${url}`);
    const refUrls: string[] = [];
    if (scene.attached_mockup_url) refUrls.push(toAbsolute(scene.attached_mockup_url));
    if (referenceImageUrl) refUrls.push(toAbsolute(referenceImageUrl));
    setGenError(null);
    setGeneratingImage(true);
    try {
      const body: { prompt: string; reference_image_urls?: string[] } = { prompt: scene.nano_prompt.trim() };
      if (refUrls.length > 0) body.reference_image_urls = refUrls;
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || "Failed");
      if (data.url) {
        update({ generated_image_url: data.url });
        if (data.skipped_reference) {
          setGenError("Image created without your mockup (Replicate can’t use uploads on localhost). Deploy the app to use mockups.");
          setTimeout(() => setGenError(null), 6000);
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Image generation failed";
      setGenError(msg);
      setTimeout(() => setGenError(null), 8000);
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!scene.veo_prompt?.trim()) {
      setGenError("Add a Veo prompt first");
      return;
    }
    const imageUrl = scene.attached_mockup_url
      ? (scene.attached_mockup_url.startsWith("http") ? scene.attached_mockup_url : `${typeof window !== "undefined" ? window.location.origin : ""}${scene.attached_mockup_url}`)
      : scene.generated_image_url;
    if (!imageUrl) {
      setGenError("Attach a mockup image or generate an image first (Veo needs a starting frame)");
      return;
    }
    setGenError(null);
    setGeneratingVideo(true);
    try {
      const res = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          prompt: scene.veo_prompt.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || "Failed");
      if (data.url) update({ generated_video_url: data.url });
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Video generation failed");
    } finally {
      setGeneratingVideo(false);
    }
  };

  return (
    <div
      className={`flex-shrink-0 w-72 rounded-lg border bg-surface-raised overflow-hidden flex flex-col ${isDragging ? "opacity-70 shadow-lg" : "border-border"}`}
    >
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface"
        {...dragHandleProps}
      >
        <span className="text-xs font-mono text-zinc-500">#{scene.scene_number}</span>
        <select
          value={scene.status}
          onChange={(e) => update({ status: e.target.value as SceneStatus })}
          className="text-xs rounded border border-border bg-surface px-2 py-1 text-zinc-300 focus:border-brand focus:outline-none"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="p-3 space-y-2 flex-1 overflow-y-auto scrollbar-thin max-h-96">
        {(scene.attached_mockup_url || scene.generated_image_url || scene.generated_video_url) && (
          <div className="rounded border border-border bg-surface overflow-hidden space-y-2">
            {scene.attached_mockup_url && (
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-xs text-zinc-500">Attached mockup</p>
                  <a
                    href={scene.attached_mockup_url.startsWith("http") ? scene.attached_mockup_url : `${typeof window !== "undefined" ? window.location.origin : ""}${scene.attached_mockup_url}`}
                    download
                    className="text-xs text-brand hover:underline"
                  >
                    Download
                  </a>
                </div>
                <img src={scene.attached_mockup_url} alt="Mockup" className="w-full aspect-[9/16] object-cover rounded" />
              </div>
            )}
            {scene.generated_image_url && (
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-xs text-zinc-500">Image</p>
                  <a
                    href={`/api/download?url=${encodeURIComponent(scene.generated_image_url)}&filename=scene-${scene.scene_number}-image.png`}
                    className="text-xs text-brand hover:underline"
                  >
                    Download
                  </a>
                </div>
                <img src={scene.generated_image_url} alt="" className="w-full aspect-[9/16] object-cover rounded" />
              </div>
            )}
            {scene.generated_video_url && (
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-xs text-zinc-500">Video</p>
                  <a
                    href={`/api/download?url=${encodeURIComponent(scene.generated_video_url)}&filename=scene-${scene.scene_number}-video.mp4`}
                    className="text-xs text-brand hover:underline"
                  >
                    Download
                  </a>
                </div>
                <video src={scene.generated_video_url} controls className="w-full aspect-[9/16] object-cover rounded" />
              </div>
            )}
            <p className="text-[10px] text-zinc-500">URLs stored in project. Export .json to save; Replicate links may expire.</p>
          </div>
        )}
        {genError && <p className="text-xs text-red-400">{genError}</p>}
        <input
          value={scene.title}
          onChange={(e) => update({ title: e.target.value })}
          className="w-full rounded border border-border bg-surface px-2 py-1 text-sm font-medium text-white focus:border-brand focus:outline-none"
          placeholder="Title"
        />
        <input
          value={scene.purpose}
          onChange={(e) => update({ purpose: e.target.value })}
          className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-zinc-300 focus:border-brand focus:outline-none"
          placeholder="Purpose"
        />
        <div className="flex gap-2">
          <label className="flex items-center gap-1 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={scene.mockup_required}
              onChange={(e) => update({ mockup_required: e.target.checked })}
              className="rounded border-border"
            />
            Mockup
          </label>
          <label className="flex items-center gap-1 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={scene.uses_character}
              onChange={(e) =>
                update({
                  uses_character: e.target.checked,
                  character_id: e.target.checked ? scene.character_id ?? characters.find((c) => c.reference_image_url)?.id : undefined,
                })
              }
              className="rounded border-border"
            />
            Character
          </label>
        </div>
        {scene.uses_character && characters.length > 0 && (
          <div>
            <label className="block text-xs text-zinc-500 mb-0.5">Which character</label>
            <select
              value={scene.character_id ?? ""}
              onChange={(e) => update({ character_id: e.target.value || undefined })}
              className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-zinc-300 focus:border-brand focus:outline-none"
            >
              <option value="">Select…</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.role_label?.trim() || c.anchor_description?.trim() || `Character (${c.id.slice(-6)})`}
                  {!c.reference_image_url ? " — no reference image" : ""}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs text-zinc-500 mb-0.5">Upload mockup image</label>
          {scene.attached_mockup_url ? (
            <div className="space-y-1">
              <img src={scene.attached_mockup_url} alt="Mockup" className="w-full aspect-video object-contain rounded border border-border bg-surface" />
              <div className="flex gap-1">
                <label className="rounded border border-border px-2 py-1 text-xs text-zinc-400 hover:bg-surface cursor-pointer">
                  Replace
                  <input type="file" accept="image/*" className="hidden" onChange={handleAttachMockup} disabled={uploadingMockup} />
                </label>
                <button type="button" onClick={() => update({ attached_mockup_url: undefined })} className="text-xs text-red-400 hover:underline">
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <label className="block rounded border-2 border-dashed border-brand/50 px-3 py-3 text-xs text-zinc-400 hover:bg-surface hover:border-brand cursor-pointer text-center">
              {uploadingMockup ? "Uploading…" : "Choose file — JPEG, PNG, WebP or GIF (max 10MB)"}
              <input type="file" accept="image/*" className="hidden" onChange={handleAttachMockup} disabled={uploadingMockup} />
            </label>
          )}
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-0.5">NanoBanana prompt (describe the image you want)</label>
          <textarea
            value={scene.nano_prompt}
            onChange={(e) => update({ nano_prompt: e.target.value })}
            rows={Math.max(2, Math.min(12, (scene.nano_prompt?.split("\n").length ?? 0) + 1))}
            className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-zinc-300 focus:border-brand focus:outline-none resize-y min-h-[4rem]"
            placeholder="e.g. Same layout with warmer lighting, or: UI screen on a desk at night"
          />
        </div>
        {scene.nano_prompt?.trim() && (
          <div>
            <button
              type="button"
              onClick={handleGenerateImage}
              disabled={generatingImage}
              className="w-full rounded bg-brand px-2 py-2 text-xs font-medium text-white hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingImage ? "Generating image…" : "Generate image"}
            </button>
            {scene.attached_mockup_url && (
              <p className="text-[10px] text-zinc-500 mt-0.5">Uses your mockup + prompt.</p>
            )}
            {referenceImageUrl && !scene.attached_mockup_url && (
              <p className="text-[10px] text-zinc-500 mt-0.5">Uses character reference + prompt.</p>
            )}
          </div>
        )}
        {scene.veo_prompt?.trim() && (
          <button
            type="button"
            onClick={handleGenerateVideo}
            disabled={generatingVideo || !(scene.attached_mockup_url || scene.generated_image_url)}
            title={!(scene.attached_mockup_url || scene.generated_image_url) ? "Attach mockup or generate image first" : undefined}
            className="w-full rounded border border-brand bg-brand/20 px-2 py-1.5 text-xs font-medium text-white hover:bg-brand/40 disabled:opacity-50"
          >
            {generatingVideo ? "Generating video…" : "Generate video"}
          </button>
        )}
        <div>
          <label className="block text-xs text-zinc-500 mb-0.5">Veo prompt</label>
          <textarea
            value={scene.veo_prompt}
            onChange={(e) => update({ veo_prompt: e.target.value })}
            rows={Math.max(2, Math.min(12, (scene.veo_prompt?.split("\n").length ?? 0) + 1))}
            className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-zinc-300 focus:border-brand focus:outline-none resize-y min-h-[4rem]"
            placeholder="Motion prompt"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-0.5">VO (2 lines)</label>
          <textarea
            value={scene.vo_line_1}
            onChange={(e) => update({ vo_line_1: e.target.value })}
            rows={Math.max(2, Math.min(4, (scene.vo_line_1?.split("\n").length ?? 0) + 1))}
            className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-zinc-300 focus:border-brand focus:outline-none resize-y min-h-[2.5rem] mb-1"
            placeholder="Line 1"
          />
          <textarea
            value={scene.vo_line_2}
            onChange={(e) => update({ vo_line_2: e.target.value })}
            rows={Math.max(2, Math.min(4, (scene.vo_line_2?.split("\n").length ?? 0) + 1))}
            className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-zinc-300 focus:border-brand focus:outline-none resize-y min-h-[2.5rem]"
            placeholder="Line 2"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-0.5">On-screen text</label>
          <input
            value={scene.on_screen_text}
            onChange={(e) => update({ on_screen_text: e.target.value })}
            className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-zinc-300 focus:border-brand focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-0.5">Audio direction</label>
          <input
            value={scene.audio_direction}
            onChange={(e) => update({ audio_direction: e.target.value })}
            className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-zinc-300 focus:border-brand focus:outline-none"
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">Est. cost</span>
          <span className="text-zinc-300">${scene.estimated_cost.toFixed(2)}</span>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-0.5">Comment</label>
          <input
            value={scene.comment}
            onChange={(e) => update({ comment: e.target.value })}
            className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-zinc-400 focus:border-brand focus:outline-none"
            placeholder="Scene comment"
          />
        </div>
      </div>
    </div>
  );
}
