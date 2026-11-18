import type {
  ColorKey,
  Palette,
} from "@/features/settings-appearance/model/palette";
import { REQUIRED_COLOR_KEYS } from "@/features/settings-appearance/model/palette";

/**
 * A listing's palette is a map of CSS custom properties (the form the detail
 * stage spreads into its style); a user theme stores structured colour values.
 * Anything this cannot express — a `color-mix` on an optional key — is dropped,
 * and the base derivation in the token layer fills it in.
 */
const VAR_TO_KEY: Record<string, ColorKey> = {
  "--bg": "background",
  "--fg": "foreground",
  "--text": "text",
  "--primary": "accent",
  "--primary-text": "accentText",
  "--shader-ink": "shaderInk",
  "--chrome": "chrome",
  "--panel": "panel",
  "--card": "card",
  "--card-hover": "cardHover",
  "--popover": "popover",
  "--input": "input",
  "--button": "button",
  "--button-hover": "buttonHover",
  "--muted": "muted",
  "--muted-foreground-1": "mutedForeground1",
  "--muted-foreground-2": "mutedForeground2",
  "--muted-foreground-3": "mutedForeground3",
  "--icon-muted": "iconMuted",
  "--text-link": "textLink",
};

const colorValue = (raw: string) => {
  const trimmed = raw.trim();
  const reference = trimmed.match(/^var\((--[a-z0-9-]+)\)$/);
  if (reference !== null) {
    const field = VAR_TO_KEY[reference[1] ?? ""];
    return field === undefined
      ? undefined
      : ({ kind: "reference", field } as const);
  }
  return /^#[0-9a-f]{6}$/i.test(trimmed)
    ? ({ kind: "literal", hex: trimmed } as const)
    : undefined;
};

const paletteFrom = (
  vars: Readonly<Record<string, string>>,
): Palette | undefined => {
  const entries = Object.entries(VAR_TO_KEY).flatMap(([name, key]) => {
    const raw = vars[name];
    if (raw === undefined) return [];
    const value = colorValue(raw);
    return value === undefined ? [] : [[key, value] as const];
  });
  const palette = Object.fromEntries(entries) as Partial<Palette>;
  return REQUIRED_COLOR_KEYS.every((key) => palette[key] !== undefined)
    ? (palette as Palette)
    : undefined;
};

export type ListingTheme = {
  readonly light: Readonly<Record<string, string>>;
  readonly dark: Readonly<Record<string, string>>;
  readonly appearance?: { readonly effect?: string };
};

const EFFECTS = ["none", "dither", "grain", "vignette"] as const;

/** The user theme a listing becomes once someone adds it. */
export const themeFromListing = (theme: ListingTheme) => {
  const light = paletteFrom(theme.light);
  const dark = paletteFrom(theme.dark);
  if (light === undefined || dark === undefined) return undefined;
  const effect = EFFECTS.find((name) => name === theme.appearance?.effect);
  return { light, dark, effect: effect ?? "dither" };
};
