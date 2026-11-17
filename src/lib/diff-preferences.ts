import { useSyncExternalStore } from "react";
import {
  appearanceActions,
  type DiffColors,
  type DiffStyle,
  getAppearance,
} from "@/features/settings-appearance/model/appearance-store";

export type {
  DiffColors,
  DiffStyle,
} from "@/features/settings-appearance/model/appearance-store";

export const diffStyleLabels: Record<DiffStyle, string> = {
  unified: "Unified",
  split: "Split",
};

export const diffColorLabels: Record<DiffColors, string> = {
  "red-green": "Red/green",
  "blue-orange": "Blue/orange",
};

const subscribe = (listener: () => void) => {
  const media = globalThis.matchMedia?.("(prefers-color-scheme: dark)");
  const onChange = () => listener();
  media?.addEventListener("change", onChange);
  return () => media?.removeEventListener("change", onChange);
};

const getDiffWrap = () => false;

/** Diff display preferences come from the same store Capy's appearance uses. */
export function useDiffPreferences() {
  useSyncExternalStore(subscribe, getAppearance, getAppearance);
  const appearance = getAppearance();
  return {
    preferences: {
      diffStyle: appearance.preferences.diffStyle,
      diffColors: appearance.diffColors,
      diffWrap: getDiffWrap(),
    },
    updateAppearance: (
      patch: Partial<{
        diffStyle: DiffStyle;
        diffColors: DiffColors;
        diffWrap: boolean;
      }>,
    ) => {
      if (patch.diffStyle !== undefined)
        appearanceActions.updatePreferences({ diffStyle: patch.diffStyle });
      if (patch.diffColors !== undefined)
        appearanceActions.setDiffColors(patch.diffColors);
      return Promise.resolve();
    },
  };
}
