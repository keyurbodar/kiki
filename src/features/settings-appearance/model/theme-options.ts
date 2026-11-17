import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { themesAtom } from "@/data/atoms/appearance";
import {
  COLOR_THEME_IDS,
  COLOR_THEME_LABELS,
  type PresetColorTheme,
} from "@/tokens/theme";
import type { ThemeColors } from "./palette";

export interface UserTheme extends ThemeColors {
  readonly id: string;
  readonly name: string;
  readonly effect?: string | null;
  readonly listingVersionId?: string | null;
}

export type ThemeOption =
  | { readonly kind: "default" }
  | { readonly kind: "preset"; readonly id: PresetColorTheme }
  | ({
      readonly kind: "custom";
      readonly id: string;
      readonly name: string;
    } & ThemeColors);

export const PRESET_OPTIONS: ReadonlyArray<ThemeOption> = [
  { kind: "default" },
  ...COLOR_THEME_IDS.map((id) => ({ kind: "preset", id }) as const),
];

export const themeOptionKey = (option: ThemeOption) =>
  option.kind === "default" ? "default" : `${option.kind}:${option.id}`;

export const themeOptionLabel = (option: ThemeOption) =>
  option.kind === "custom"
    ? option.name
    : COLOR_THEME_LABELS[option.kind === "preset" ? option.id : "default"];

export const userThemesFrom = (value: unknown): ReadonlyArray<UserTheme> => {
  const themes = Array.isArray(value)
    ? value
    : (value as { themes?: unknown } | null)?.themes;
  return Array.isArray(themes)
    ? (themes as ReadonlyArray<UserTheme>).filter(
        (theme) => theme.light !== undefined && theme.dark !== undefined,
      )
    : [];
};

export function useUserThemes(): ReadonlyArray<UserTheme> | undefined {
  const result = useAtomValue(themesAtom);
  return AsyncResult.isSuccess(result)
    ? userThemesFrom(result.value)
    : undefined;
}

export function useThemeOptions() {
  const custom = (useUserThemes() ?? []).map(
    (theme): ThemeOption => ({
      kind: "custom",
      id: theme.id,
      name: theme.name,
      light: theme.light,
      dark: theme.dark,
    }),
  );
  return {
    presets: PRESET_OPTIONS,
    custom,
    options: [...PRESET_OPTIONS, ...custom],
  };
}
