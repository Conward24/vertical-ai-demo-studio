"use client";

import type { Project } from "@/types";

interface ExportImportProps {
  project: Project;
  onProjectReplace: (project: Project) => void;
}

export default function ExportImport({
  project,
  onProjectReplace,
}: ExportImportProps) {
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vertical-ai-demo-${project.config.name.replace(/\s+/g, "-")}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string) as Project;
          if (parsed.config && parsed.scenes) {
            onProjectReplace(parsed);
          } else {
            alert("Invalid project file: missing config or scenes.");
          }
        } catch {
          alert("Invalid JSON file.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="rounded-lg border border-border bg-surface-raised p-4 flex gap-2">
      <button
        type="button"
        onClick={exportJson}
        className="rounded bg-brand px-3 py-1.5 text-sm text-white hover:opacity-90"
      >
        Export project (.json)
      </button>
      <button
        type="button"
        onClick={importJson}
        className="rounded border border-border px-3 py-1.5 text-sm text-zinc-300 hover:bg-surface"
      >
        Import project (.json)
      </button>
    </div>
  );
}
