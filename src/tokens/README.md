# tokens

The single home for every design value in the app. It's Capy's design system, taken value for value from Capy's production stylesheet (Tailwind v4.3.3 output) and checked against the CDS token sheets on the Doop canvas. Everything here is Tailwind v4 `@theme` plus CSS variables, so Tailwind utilities (`bg-card`, `text-muted-foreground-2`, `rounded-card`, `shadow-card`, `duration-fast`, `delay-stagger`, `ease-out-quint`, `animate-tooltip-in`) resolve to these tokens.

**Rule:** nothing outside `src/tokens` holds a raw value: no hex or colour functions, no px, no ms/s. `bun run lint` enforces it with `scripts/check-raw-values.ts`. Reference a token instead (`size-(--icon-base)`, `h-(--h-control-sm)`, `duration-(--duration-exit)`). If a value is missing, add a token here first.

## Layers

| File                                     | Layer         | What it holds                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `primitives.css`                         | 1. Primitives | Font stacks, type scale with line heights and letter spacing, weights (450/500/560/700), spacing, containers, breakpoints (md is 768px), radius, icon sizes, control/row/badge heights, z-index, durations, easings, blur. The `--responsive-*` raw values switch between touch and desktop sizes at `(width >= 768px), (hover: hover) and (pointer: fine)`. Tailwind's default colour palette is removed: Capy has no colour ramps. |
| `semantic.css`                           | 2. Semantic   | `--color-*` utilities for surface, text, border, accent, state, diff and chart, each pointing at a theme variable (`--color-card: var(--card)`), plus `--shadow-card` and the skeleton/progress gradients.                                                                                                                                                                                                                           |
| `components.css`                         | 3. Component  | Component radii (`--radius-button`, `--radius-card`, `--radius-panel`, ...), sidebar pin grid, media box, composer, safe-area and shell offsets.                                                                                                                                                                                                                                                                                     |
| `themes/default.css`                     | Theme         | Capy's default theme ("Capy"): light on `:root`, dark on `.dark`, the derivation every preset shares, the default-accent preview and the blue/orange diff palette.                                                                                                                                                                                                                                                                   |
| `themes/presets.css`                     | Theme         | The 13 presets, light and dark.                                                                                                                                                                                                                                                                                                                                                                                                      |
| `motion.css`                             | Motion        | Recipe durations, delays and curves, named animations (`animate-tooltip-in`, `animate-skeleton-pulse`, ...), the `@property` registrations and all 26 keyframes from the bundle.                                                                                                                                                                                                                                                     |
| `fonts.css`, `fonts-katex.css`           | Fonts         | Inter Variable and Italic, Geist Mono, JetBrains Mono Nerd Font Mono and the 20 KaTeX faces, self-hosted from `fonts/` with Capy's exact `@font-face` settings. Licences sit next to the files (OFL 1.1 for Inter, Geist Mono and JetBrains Mono; MIT for the Nerd Fonts patch and KaTeX). Vite emits them with the same content hashes as Capy's build.                                                                             |
| `effects.css`, `effects.ts`, `textures/` | Effects       | Background effects (grain, vignette), text shimmer, shimmer surface and progress edge, plus the dither shader, dither-fill and dither-cover parameters.                                                                                                                                                                                                                                                                              |
| `catalog.ts`                             | Runtime       | Token names grouped for the `/__tokens` specimen.                                                                                                                                                                                                                                                                                                                                                                                    |
| `base.css`                               | Base          | Body defaults, border/outline colour and `::selection`.                                                                                                                                                                                                                                                                                                                                                                              |
| `theme.ts`                               | Runtime       | Theme ids, labels, `applyColorTheme`, `applyColorMode`.                                                                                                                                                                                                                                                                                                                                                                              |

Themes set theme variables (`--bg`, `--fg`, `--text`, `--primary`, `--primary-text`, `--shader-ink`, and for some presets the surface and muted values) and nothing else. Layers 1 to 3 never change per theme.

## Themes

Same mechanism as Capy:

- Mode: the `dark` class on `<html>` (light when absent). The default mode is `system`.
- Colour theme: `data-color-theme="<id>"` on `<html>`. No attribute means the default theme.
- Ids: `absolutely`, `bearded-oled`, `catppuccin`, `codex`, `crimson-evernight`, `everforest`, `firecrawl`, `github`, `gruvbox`, `hub`, `linear`, `notion`, `one`.
- `[data-theme-preview]` renders a theme inside a subtree (theme picker cards).
- `data-diff-colors="blue-orange"` swaps the diff palette.

`index.html` applies the stored theme and mode before first paint, reading the same localStorage keys Capy uses (`capy-web:color-theme-v2`, `capy-web:appearance`, `capy-web:diff-colors`).

## Sources and coverage

See [COVERAGE.md](./COVERAGE.md) for how every bundle variable and every canvas token maps to this folder.

## Specimen

`bun run dev` and open `/__tokens?theme=<id>&mode=light|dark`. It renders every colour, theme variable, type size and weight, radius, shadow, size, z-index, duration, easing, animation, icon and effect in the chosen theme. The route returns 404 in production builds.

## Component-scoped variables

Some variables in Capy's stylesheet are not tokens. They're locals that a component sets on itself, usually through an arbitrary-property utility such as `[--table-row-h:32px]`, so they have no global value here. Whoever builds the component owns them:

- Button and menu intents: `--intent-*`, `--focus-ring`, `--menu-row-highlight`
- Toasts (sonner's own variables): `--normal-*`, `--gray1` to `--gray12`, `--error-*`, `--info-*`, `--success-*`, `--warning-*` (`-bg`, `-border`, `-text`), `--lift`
- Diff viewer: `--diff-card-*`, `--diff-comment-*`, `--diff-gutter-utility-*`, `--diff-sticky-*`
- File tree: `--capy-file-tree-surface`, `--capy-tree-indent`, `--tree-connector-bleed`
- Tables: `--table-*`
- Tabs: `--tab-fade-left`, `--tab-fade-right`, `--tab-surface`
- Lightbox: `--lightbox-gutter`, `--lightbox-strip`
- Scroll areas and masks: `--scroll-area-inset`, `--scroll-fade-ramp`, `--scroll-fade-surface`, `--mask-fade-ramp`, `--mask-notch`, `--clamp-fade`
- Panels: `--panel-border`
- Shimmer: `--shimmer-lit` (registered with `@property` in `motion.css`)

The raw values those components set (32px rows, 3.5rem gutters, ...) still belong in this folder: add a component token here and set the local from it.
