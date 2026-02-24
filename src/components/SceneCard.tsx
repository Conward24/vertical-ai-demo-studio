"use client";

import { useState } from "react";
import type { Scene, SceneStatus, ReferenceCharacter, ProjectMockup } from "@/types";

const STATUS_OPTIONS: SceneStatus[] = ["Draft", "In Review", "Approved", "Locked"];

function getMockupUrls(scene: Scene): string[] {
  if (scene.attached_mockup_urls?.length) return scene.attached_mockup_urls;
  return scene.attached_mockup_url ? [scene.attached_mockup_url] : [];
}

interface SceneCardProps {
  scene: Scene;
  onUpdate: (scene: Scene) => void;
  referenceImageUrl?: string | null;
  characters?: ReferenceCharacter[];
  mockups?: ProjectMockup[];
  onImageGenerated?: () => void;
  onVideoGenerated?: (durationSeconds?: number) => void;
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
}

export default function SceneCard({
  scene,
  onUpdate,
  referenceImageUrl,
  characters = [],
  mockups = [],
  onImageGenerated,
  onVideoGenerated,
  isDragging,
  dragHandleProps,
}: SceneCardProps) {
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [uploadingMockup, setUploadingMockup] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  /** Brief success message after image/video generation (e.g. "Image ready") */
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const update = (patch: Partial<Scene>) => {
    onUpdate({ ...scene, ...patch });
  };

  const handleAttachMockup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setGenError(null);
    setUploadingMockup(true);
    let urls = [...getMockupUrls(scene)];
    try {
      for (let i = 0; i < files.length; i++) {
        const form = new FormData();
        form.append("file", files[i]);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        if (data.url) urls.push(data.url);
      }
      if (urls.length > 0) setMockupUrls(urls);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingMockup(false);
      e.target.value = "";
    }
  };

  const setMockupUrls = (urls: string[]) => {
    update({ attached_mockup_urls: urls.length ? urls : undefined, attached_mockup_url: urls[0] });
  };

  const handleGenerateImage = async () => {
    if (!scene.nano_prompt?.trim()) {
      setGenError("Add a NanoBanana prompt first");
      return;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const toAbsolute = (url: string) => (url.startsWith("http") ? url : `${origin}${url}`);
    const refUrls: string[] = [...getMockupUrls(scene).map(toAbsolute)];
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
        onImageGenerated?.();
        setSuccessMessage("Image ready");
        setTimeout(() => setSuccessMessage(null), 2500);
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
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const mockups = getMockupUrls(scene);
    const imageUrl = mockups[0]
      ? (mockups[0].startsWith("http") ? mockups[0] : `${origin}${mockups[0]}`)
      : scene.generated_image_url;
    if (!imageUrl) {
      setGenError("Attach a mockup image or generate an image first (Veo needs a starting frame)");
      return;
    }
    const duration = scene.video_duration_seconds ?? 8;
    setGenError(null);
    setGeneratingVideo(true);
    try {
      const res = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          prompt: scene.veo_prompt.trim(),
          duration,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || "Failed");
      if (data.url) {
        update({ generated_video_url: data.url });
        onVideoGenerated?.(duration);
        setSuccessMessage("Video ready");
        setTimeout(() => setSuccessMessage(null), 2500);
      }
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Video generation failed");
    } finally {
      setGeneratingVideo(false);
    }
  };

  const isGenerating = generatingImage || generatingVideo;
  const generatingLabel = generatingImage ? "Generating image…" : generatingVideo ? "Generating video…" : null;

  return (
    <div
      className={`relative flex-shrink-0 w-72 rounded-lg border bg-surface-raised overflow-hidden flex flex-col ${isDragging ? "opacity-70 shadow-lg" : "border-border"}`}
    >
      {isGenerating && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-zinc-900/90 text-white"
          aria-busy="true"
          aria-live="polite"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <p className="mt-2 text-sm font-medium">{generatingLabel}</p>
          <p className="mt-0.5 text-xs text-zinc-400">This may take a minute…</p>
        </div>
      )}
      {successMessage && !isGenerating && (
        <div
          className="absolute left-0 right-0 top-2 z-10 mx-2 rounded bg-emerald-600/95 px-2 py-1.5 text-center text-xs font-medium text-white shadow-lg"
          role="status"
          aria-live="polite"
        >
          {successMessage}
        </div>
      )}
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
        {(scene.attached_mockup_url || getMockupUrls(scene).length > 0 || scene.generated_image_url || scene.generated_video_url) && (
          <div className="rounded border border-border bg-surface overflow-hidden space-y-2">
            {getMockupUrls(scene).length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <p className="text-xs text-zinc-500">Attached mockup{getMockupUrls(scene).length > 1 ? "s" : ""} ({getMockupUrls(scene).length})</p>
                </div>
                <img src={getMockupUrls(scene)[0]} alt="Mockup" className="w-full aspect-[9/16] object-cover rounded" />
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
          <label className="block text-xs text-zinc-500 mb-0.5">Mockup image(s)</label>
          {getMockupUrls(scene).length > 0 ? (
            <div className="space-y-1">
              <div className="flex flex-wrap gap-1">
                {getMockupUrls(scene).map((url, idx) => (
                  <div key={idx} className="relative">
                    <img src={url.startsWith("http") ? url : `${typeof window !== "undefined" ? window.location.origin : ""}${url}`} alt="" className="w-14 h-14 object-cover rounded border border-border" />
                    <button type="button" onClick={() => setMockupUrls(getMockupUrls(scene).filter((_, i) => i !== idx))} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] leading-none">×</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-1">
                <label className="rounded border border-border px-2 py-1 text-xs text-zinc-400 hover:bg-surface cursor-pointer">
                  Add more
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleAttachMockup} disabled={uploadingMockup} />
                </label>
                <button type="button" onClick={() => setMockupUrls([])} className="text-xs text-red-400 hover:underline">Clear all</button>
              </div>
            </div>
          ) : (
            <label className="block rounded border-2 border-dashed border-brand/50 px-3 py-3 text-xs text-zinc-400 hover:bg-surface hover:border-brand cursor-pointer text-center">
              {uploadingMockup ? "Uploading…" : "Choose file(s) — multiple allowed"}
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleAttachMockup} disabled={uploadingMockup} />
            </label>
          )}
          {mockups.length > 0 && (
            <div className="mt-1.5">
              <p className="text-[10px] text-zinc-500 mb-1">Or add from project mockups:</p>
              <div className="flex flex-wrap gap-1">
                {mockups.map((m) => {
                  const current = getMockupUrls(scene);
                  const isIn = current.includes(m.image_url);
                  return (
                    <label key={m.id} className="flex items-center gap-1 rounded border border-border px-2 py-1 text-[10px] text-zinc-400 hover:bg-surface cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isIn}
                        onChange={() => {
                          if (isIn) setMockupUrls(current.filter((u) => u !== m.image_url));
                          else setMockupUrls([...current, m.image_url]);
                        }}
                        className="rounded"
                      />
                      <img src={m.image_url.startsWith("http") ? m.image_url : `${typeof window !== "undefined" ? window.location.origin : ""}${m.image_url}`} alt="" className="w-6 h-6 object-cover rounded" />
                    </label>
                  );
                })}
              </div>
            </div>
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
              className="flex w-full items-center justify-center gap-2 rounded bg-brand px-2 py-2 text-xs font-medium text-white hover:bg-brand/90 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {generatingImage && (
                <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              {generatingImage ? "Generating image…" : "Generate image"}
            </button>
            {getMockupUrls(scene).length > 0 && (
              <p className="text-[10px] text-zinc-500 mt-0.5">Uses your mockup + prompt.</p>
            )}
            {referenceImageUrl && getMockupUrls(scene).length === 0 && (
              <p className="text-[10px] text-zinc-500 mt-0.5">Uses character reference + prompt.</p>
            )}
          </div>
        )}
        {scene.veo_prompt?.trim() && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-500 whitespace-nowrap">Duration:</label>
              <select
                value={scene.video_duration_seconds ?? 8}
                onChange={(e) => update({ video_duration_seconds: Number(e.target.value) })}
                className="rounded border border-border bg-surface px-2 py-1 text-xs text-zinc-300 focus:border-brand focus:outline-none"
              >
                <option value={4}>4 s</option>
                <option value={6}>6 s</option>
                <option value={8}>8 s</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleGenerateVideo}
              disabled={generatingVideo || !(getMockupUrls(scene)[0] || scene.generated_image_url)}
              title={!(getMockupUrls(scene)[0] || scene.generated_image_url) ? "Attach mockup or generate image first" : undefined}
              className="flex w-full items-center justify-center gap-2 rounded border border-brand bg-brand/20 px-2 py-1.5 text-xs font-medium text-white hover:bg-brand/40 disabled:opacity-70"
            >
              {generatingVideo && (
                <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              {generatingVideo ? "Generating video…" : "Generate video"}
            </button>
          </div>
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
