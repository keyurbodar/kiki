import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { queryTimeToLive } from "@/data/atoms/conventions";
import { ApiClient } from "@/data/client/ApiClient";
import {
  type ColorThemeChoice,
  colorThemeKey,
  PRESET_COLOR_THEME_CHOICES,
  readColorTheme,
  sameColorTheme,
  setColorTheme,
  useAppearance,
} from "@/lib/appearance";

export type CustomColorTheme = Extract<ColorThemeChoice, { kind: "custom" }>;

const userThemesKey = "user_theme";

export const userThemesAtom = ApiClient.query("themes", "list", {
  reactivityKeys: [userThemesKey],
  timeToLive: queryTimeToLive,
});

export const removeUserThemeAtom = ApiClient.mutation("themes", "remove");

export const toCustomColorThemes = (value: unknown): CustomColorTheme[] =>
  Array.isArray(value)
    ? value.flatMap((theme: unknown) =>
        typeof theme === "object" &&
        theme !== null &&
        "id" in theme &&
        "name" in theme &&
        typeof theme.id === "string" &&
        typeof theme.name === "string"
          ? [{ kind: "custom" as const, id: theme.id, name: theme.name }]
          : [],
      )
    : [];

export function useColorThemeOptions() {
  const { displayedColorTheme } = useAppearance();
  const custom = toCustomColorThemes(
    Option.getOrUndefined(AsyncResult.value(useAtomValue(userThemesAtom))),
  );
  const options = [...PRESET_COLOR_THEME_CHOICES, ...custom];
  return {
    displayed: displayedColorTheme,
    options,
    presets: PRESET_COLOR_THEME_CHOICES,
    custom,
    select: setColorTheme,
    byKey: (key: string) =>
      options.find((option) => colorThemeKey(option) === key),
  };
}

export function useDeleteColorTheme() {
  const remove = useAtomSet(removeUserThemeAtom, { mode: "promise" });
  return (theme: CustomColorTheme) =>
    remove({
      params: { themeId: theme.id },
      reactivityKeys: [userThemesKey],
    }).then(() => {
      if (sameColorTheme(readColorTheme(), theme)) {
        setColorTheme({ kind: "default" });
      }
    });
}
