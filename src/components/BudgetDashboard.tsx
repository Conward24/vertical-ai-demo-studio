"use client";

import type { Scene, PricingAssumptions } from "@/types";
import {
  totalProjectCost,
  getOptimizationSuggestions,
  updateSceneCosts,
} from "@/lib/costEngine";

interface BudgetDashboardProps {
  scenes: Scene[];
  pricing: PricingAssumptions;
  imagesPerScene?: number;
  budgetCap?: number;
  imageGenerationsCount?: number;
  videoGenerationsCount?: number;
  onScenesUpdate?: (scenes: Scene[]) => void;
}

export default function BudgetDashboard({
  scenes,
  pricing,
  imagesPerScene = 2.5,
  budgetCap,
  imageGenerationsCount = 0,
  videoGenerationsCount = 0,
  onScenesUpdate,
}: BudgetDashboardProps) {
  const total = totalProjectCost(scenes, pricing, imagesPerScene);
  const suggestions = getOptimizationSuggestions(scenes, pricing, budgetCap);
  const recalc = () => {
    const updated = updateSceneCosts(scenes, pricing, imagesPerScene);
    onScenesUpdate?.(updated);
  };

  const spendSoFar =
    imageGenerationsCount * (pricing.nano_banana_per_image ?? 0.04) +
    videoGenerationsCount * (pricing.veo_per_clip ?? 0.08);

  return (
    <div className="rounded-lg border border-border bg-surface-raised p-4">
      <h2 className="text-lg font-semibold text-white mb-4">Budget</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-zinc-500">Total projected cost (estimate)</p>
          <p className="text-2xl font-semibold text-white">${total.toFixed(2)}</p>
        </div>
        {budgetCap != null && (
          <div>
            <p className="text-xs text-zinc-500">Budget cap</p>
            <p className={`text-2xl font-semibold ${total > budgetCap ? "text-red-400" : "text-white"}`}>
              ${budgetCap.toFixed(2)}
            </p>
          </div>
        )}
      </div>
      <div className="mb-4 p-3 rounded border border-border bg-surface">
        <p className="text-xs text-zinc-500 mb-1">Generations (for billing)</p>
        <p className="text-sm text-zinc-300">
          Images: <strong className="text-white">{imageGenerationsCount}</strong>
          {" · "}
          Videos: <strong className="text-white">{videoGenerationsCount}</strong>
        </p>
        <p className="text-xs text-zinc-500 mt-1">
          Estimated spend so far: <strong className="text-white">${spendSoFar.toFixed(2)}</strong>
          {" "}
          (images × ${(pricing.nano_banana_per_image ?? 0.04).toFixed(2)} + videos × ${(pricing.veo_per_clip ?? 0.08).toFixed(2)})
        </p>
      </div>
      <div className="mb-4">
        <p className="text-xs text-zinc-500 mb-1">Cost per scene</p>
        <div className="flex flex-wrap gap-2">
          {scenes.map((s) => (
            <span
              key={s.scene_number}
              className="rounded bg-surface px-2 py-1 text-xs text-zinc-300"
            >
              #{s.scene_number} ${s.estimated_cost.toFixed(2)}
            </span>
          ))}
        </div>
      </div>
      {onScenesUpdate && (
        <button
          type="button"
          onClick={recalc}
          className="rounded border border-border px-3 py-1.5 text-sm text-zinc-400 hover:bg-surface mb-4"
        >
          Recalculate costs
        </button>
      )}
      {suggestions.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-2">Suggestions</p>
          <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1">
            {suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
