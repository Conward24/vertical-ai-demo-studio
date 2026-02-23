import type { Project, AppSettings } from "@/types";
import { DEFAULT_SETTINGS } from "@/data/defaultSettings";
import { SAMPLE_PROJECT } from "@/data/sampleProject";

const PROJECT_KEY = "vertical-ai-demo-studio-project";
const SETTINGS_KEY = "vertical-ai-demo-studio-settings";

export function loadProject(): Project | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROJECT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Project;
  } catch {
    return null;
  }
}

export function saveProject(project: Project): void {
  if (typeof window === "undefined") return;
  const updated = {
    ...project,
    config: {
      ...project.config,
      updated_at: new Date().toISOString(),
    },
  };
  localStorage.setItem(PROJECT_KEY, JSON.stringify(updated));
}

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadSampleProject(): Project {
  return JSON.parse(JSON.stringify(SAMPLE_PROJECT));
}
