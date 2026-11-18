import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { themesAtom, userThemeKey } from "@/data/atoms/appearance";
import { ApiClient } from "@/data/client/ApiClient";
import {
  customColorThemeChoice,
  userThemesFrom,
} from "@/features/settings-appearance/model/theme-options";
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

export const removeUserThemeAtom = ApiClient.mutation("themes", "remove");

export const toCustomColorThemes = (value: unknown): CustomColorTheme[] =>
  userThemesFrom(value).map(customColorThemeChoice);

export function useColorThemeOptions() {
  const { displayedColorTheme } = useAppearance();
  const custom = toCustomColorThemes(
    Option.getOrUndefined(AsyncResult.value(useAtomValue(themesAtom))),
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
      reactivityKeys: [userThemeKey()],
    }).then(() => {
      if (sameColorTheme(readColorTheme(), theme)) {
        setColorTheme({ kind: "default" });
      }
    });
}
