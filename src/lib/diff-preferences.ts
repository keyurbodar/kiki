import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Atom } from "effect/reactivity";
import { ApiClient } from "@/data/client/ApiClient";

export type DiffStyle = "unified" | "split";
export type DiffColors = "red-green" | "blue-orange";

export type DiffPreferences = {
  diffStyle: DiffStyle;
  diffColors: DiffColors;
  diffWrap: boolean;
};

export const diffStyleLabels: Record<DiffStyle, string> = {
  unified: "Unified",
  split: "Split",
};

export const diffColorLabels: Record<DiffColors, string> = {
  "red-green": "Red/green",
  "blue-orange": "Blue/orange",
};

export const diffPreferencesAtom = Atom.make<DiffPreferences>({
  diffStyle: "unified",
  diffColors: "red-green",
  diffWrap: false,
}).pipe(Atom.keepAlive);

const updateClientAppearance = ApiClient.mutation(
  "users",
  "updateClientAppearance",
);

/**
 * Diff display preferences, saved to the client appearance the way Capy's
 * `updateAppearance` does. The local value updates at once and rolls back
 * when the save fails, so callers only toast.
 */
export function useDiffPreferences() {
  const preferences = useAtomValue(diffPreferencesAtom);
  const setPreferences = useAtomSet(diffPreferencesAtom);
  const save = useAtomSet(updateClientAppearance, { mode: "promise" });
  const updateAppearance = (patch: Partial<DiffPreferences>) => {
    const previous = preferences;
    setPreferences({ ...previous, ...patch });
    return save({ payload: patch }).then(
      () => undefined,
      (error: unknown) => {
        setPreferences(previous);
        throw error;
      },
    );
  };
  return { preferences, updateAppearance };
}
