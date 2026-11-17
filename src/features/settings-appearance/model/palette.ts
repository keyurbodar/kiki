export type HexColor = string;

export const REQUIRED_COLOR_KEYS = [
  "background",
  "foreground",
  "text",
  "accent",
  "accentText",
  "shaderInk",
] as const;

export const OPTIONAL_COLOR_KEYS = [
  "chrome",
  "panel",
  "card",
  "cardHover",
  "popover",
  "input",
  "button",
  "buttonHover",
  "muted",
  "mutedForeground1",
  "mutedForeground2",
  "mutedForeground3",
  "iconMuted",
  "textLink",
] as const;

export const COLOR_KEYS = [...REQUIRED_COLOR_KEYS, ...OPTIONAL_COLOR_KEYS];

export type RequiredColorKey = (typeof REQUIRED_COLOR_KEYS)[number];
export type OptionalColorKey = (typeof OPTIONAL_COLOR_KEYS)[number];
export type ColorKey = RequiredColorKey | OptionalColorKey;

export type ColorRef =
  | { readonly kind: "literal"; readonly hex: HexColor }
  | { readonly kind: "reference"; readonly field: ColorKey };

export type ColorValue =
  | ColorRef
  | {
      readonly kind: "mix";
      readonly first: ColorRef;
      readonly second: ColorRef;
      readonly firstWeight: number;
    };

export type Palette = { readonly [K in RequiredColorKey]: ColorValue } & {
  readonly [K in OptionalColorKey]?: ColorValue;
};

export interface ThemeColors {
  readonly light: Palette;
  readonly dark: Palette;
}

export type PaletteSide = "light" | "dark";

export const COLOR_VARS: Record<ColorKey, string> = {
  background: "--bg",
  foreground: "--fg",
  text: "--text",
  accent: "--primary",
  accentText: "--primary-text",
  shaderInk: "--shader-ink",
  chrome: "--chrome",
  panel: "--panel",
  card: "--card",
  cardHover: "--card-hover",
  popover: "--popover",
  input: "--input",
  button: "--button",
  buttonHover: "--button-hover",
  muted: "--muted",
  mutedForeground1: "--muted-foreground-1",
  mutedForeground2: "--muted-foreground-2",
  mutedForeground3: "--muted-foreground-3",
  iconMuted: "--icon-muted",
  textLink: "--text-link",
};

export const COLOR_LABELS: Record<ColorKey, string> = {
  background: "Background",
  foreground: "Foreground",
  text: "Text",
  accent: "Accent",
  accentText: "Text on accent",
  shaderInk: "Shader ink",
  chrome: "Chrome",
  panel: "Panel",
  card: "Card",
  cardHover: "Card hover",
  popover: "Popover",
  input: "Input",
  button: "Button",
  buttonHover: "Button hover",
  muted: "Muted",
  mutedForeground1: "Muted text 1",
  mutedForeground2: "Muted text 2",
  mutedForeground3: "Muted text 3",
  iconMuted: "Muted icon",
  textLink: "Link",
};

export const isHexColor = (value: string) => /^#[0-9a-f]{6}$/i.test(value);

const refCss = (value: ColorRef) =>
  value.kind === "literal" ? value.hex : `var(${COLOR_VARS[value.field]})`;

export const colorValueCss = (value: ColorValue) =>
  value.kind === "mix"
    ? `color-mix(in oklab, ${refCss(value.first)} ${Math.round(value.firstWeight * 100)}%, ${refCss(value.second)})`
    : refCss(value);

export const paletteDeclarations = (palette: Palette) =>
  COLOR_KEYS.flatMap((key) => {
    const value = palette[key];
    return value === undefined
      ? []
      : [[COLOR_VARS[key], colorValueCss(value)] as const];
  });

export const paletteStyle = (palette: Palette) =>
  Object.fromEntries(paletteDeclarations(palette));

const block = (selector: string, palette: Palette) =>
  `${selector} {\n${paletteDeclarations(palette)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n")}\n}`;

export const themeCss = (id: string, colors: ThemeColors) =>
  `${block(`[data-color-theme="${id}"]:not(.dark)`, colors.light)}\n${block(`.dark[data-color-theme="${id}"]`, colors.dark)}`;

const refs = (value: ColorRef): ColorKey[] =>
  value.kind === "reference" ? [value.field] : [];

const valueRefs = (value: ColorValue) =>
  value.kind === "mix" ? [...refs(value.first), ...refs(value.second)] : refs(value);

/** Keys whose value refers back to themselves through a chain of references. */
export const selfReferences = (palette: Palette): ColorKey[] =>
  COLOR_KEYS.filter((start) => {
    const seen = new Set<ColorKey>();
    const visit = (key: ColorKey): boolean => {
      const value = palette[key];
      if (value === undefined) return false;
      return valueRefs(value).some((next) => {
        if (next === start) return true;
        if (seen.has(next)) return false;
        seen.add(next);
        return visit(next);
      });
    };
    return visit(start);
  });

export const literal = (hex: HexColor): ColorRef => ({ kind: "literal", hex });

export const palettesEqual = (a: Palette, b: Palette) =>
  COLOR_KEYS.every(
    (key) => JSON.stringify(a[key] ?? null) === JSON.stringify(b[key] ?? null),
  );
