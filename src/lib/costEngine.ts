import type { Scene, PricingAssumptions } from "@/types";

export function sceneCost(
  scene: Scene,
  pricing: PricingAssumptions,
  imagesPerScene: number = 2.5
): number {
  let cost = 0;
  if (scene.mockup_required) {
    cost += (pricing.nano_banana_per_image ?? 0.04) * Math.ceil(imagesPerScene);
  }
  if (scene.veo_prompt?.trim()) {
    const seconds = scene.video_duration_seconds ?? 8;
    cost += (pricing.veo_per_second ?? 0.1) * seconds;
  }
  const voLines = [scene.vo_line_1, scene.vo_line_2].filter(Boolean).join(" ");
  const approxWords = voLines.split(/\s+/).length;
  const approxMinutes = approxWords / 150;
  cost += (pricing.vo_per_minute ?? 0.02) * approxMinutes;
  return Math.round(cost * 100) / 100;
}

export function totalProjectCost(
  scenes: Scene[],
  pricing: PricingAssumptions,
  imagesPerScene: number = 2.5
): number {
  return scenes.reduce(
    (sum, s) => sum + sceneCost(s, pricing, imagesPerScene),
    0
  );
}

export function updateSceneCosts(
  scenes: Scene[],
  pricing: PricingAssumptions,
  imagesPerScene: number = 2.5
): Scene[] {
  return scenes.map((s) => ({
    ...s,
    estimated_cost: sceneCost(s, pricing, imagesPerScene),
  }));
}

export function getOptimizationSuggestions(
  scenes: Scene[],
  pricing: PricingAssumptions,
  budgetCap?: number
): string[] {
  const total = totalProjectCost(scenes, pricing);
  const suggestions: string[] = [];
  const uiOnlyConsecutive = countConsecutiveUIOnly(scenes);
  if (uiOnlyConsecutive > 2) {
    suggestions.push(
      `You have ${uiOnlyConsecutive} consecutive UI-only scenes. Consider inserting a B-roll or talking-head scene for variety.`
    );
  }
  const motionHeavy = scenes.filter(
    (s) => s.veo_prompt && s.veo_prompt.length > 100
  ).length;
  if (motionHeavy > scenes.length * 0.5) {
    suggestions.push(
      "Many scenes have long motion prompts. Shorter Veo prompts can reduce cost and generation time."
    );
  }
  if (budgetCap != null && total > budgetCap) {
    suggestions.push(
      `Total ($${total.toFixed(2)}) exceeds budget cap ($${budgetCap.toFixed(2)}). Reduce mockup_required or Veo usage.`
    );
  }
  return suggestions;
}

function countConsecutiveUIOnly(scenes: Scene[]): number {
  let max = 0;
  let current = 0;
  for (const s of scenes) {
    if (s.mockup_required && !s.uses_character) {
      current++;
      max = Math.max(max, current);
    } else {
      current = 0;
    }
  }
  return max;
}
