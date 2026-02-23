import type { Scene } from "@/types";

/**
 * Enforces: no more than 2 full UI scenes consecutively, at least 2 variation types,
 * avoid identical composition back-to-back. Preserves narrative order where possible.
 */
export function autoSequence(scenes: Scene[]): Scene[] {
  if (scenes.length <= 2) return scenes.map((s, i) => ({ ...s, scene_number: i + 1 }));

  const withIndex = scenes.map((s, i) => ({ scene: s, originalIndex: i }));
  const uiOnly = (s: Scene) => s.mockup_required && !s.uses_character;
  const typeKey = (s: Scene) =>
    [s.mockup_required ? "ui" : "non-ui", s.uses_character ? "char" : "no-char"].join("-");

  let result: typeof withIndex = [];
  const used = new Set<number>();

  // Build a reordered sequence that breaks long UI-only runs
  let consecutiveUI = 0;
  const pickNext = (preferNonUI: boolean): typeof withIndex[0] | null => {
    for (let i = 0; i < withIndex.length; i++) {
      if (used.has(i)) continue;
      const { scene } = withIndex[i];
      const isUI = uiOnly(scene);
      if (preferNonUI && !isUI) {
        used.add(i);
        return withIndex[i];
      }
      if (!preferNonUI && isUI && consecutiveUI < 2) {
        used.add(i);
        return withIndex[i];
      }
      if (!preferNonUI && !isUI) {
        used.add(i);
        return withIndex[i];
      }
    }
    for (let i = 0; i < withIndex.length; i++) {
      if (used.has(i)) return withIndex[i];
    }
    return null;
  };

  while (result.length < scenes.length) {
    const needNonUI = consecutiveUI >= 2;
    const next = pickNext(needNonUI);
    if (!next) break;
    const { scene } = next;
    if (uiOnly(scene)) {
      consecutiveUI++;
    } else {
      consecutiveUI = 0;
    }
    result.push(next);
  }

  // Renumber and avoid identical composition back-to-back by swapping if same type
  const renumbered: Scene[] = result.map(({ scene }, i) => ({
    ...scene,
    scene_number: i + 1,
  }));

  for (let i = 1; i < renumbered.length; i++) {
    if (typeKey(renumbered[i]) === typeKey(renumbered[i - 1])) {
      // Try swap with i+1 if different type
      for (let j = i + 1; j < renumbered.length; j++) {
        if (typeKey(renumbered[j]) !== typeKey(renumbered[i])) {
          [renumbered[i], renumbered[j]] = [renumbered[j], renumbered[i]];
          renumbered.forEach((s, k) => (s.scene_number = k + 1));
          break;
        }
      }
    }
  }

  return renumbered;
}
