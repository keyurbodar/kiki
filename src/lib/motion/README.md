# motion

The interaction layer on top of the motion and effect tokens in `src/tokens`
(`motion.css`: keyframes, `animate-*`, `duration-*`, `delay-*`, `ease-*`;
`effects.css`: `text-shimmer`, `shimmer-surface`, `progress-edge`). Every
class string here is Capy's own, copied from its production bundle; arbitrary
timings are swapped for the matching token.

`motion.css` is imported once from `src/styles.css`. Import the TS side from
`@/lib/motion`.

## CSS

| Class             | What it does                                                                                                                                                                |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `focus-gutter`    | Negative inline margin plus matching padding (one spacing step) so inline text controls have room for the focus ring. Pair with `rounded focus-visible:outline-ring-inset`. |
| `.dot-grid` rules | Resting dot opacity per `data-state` and the reduced-motion fallbacks for `DotGridIcon`.                                                                                    |

`outline-ring-inset` (Capy's focus ring) comes from the token layer (kiki#18).

## Recipes: `motion.<name>`

Compose them into cva base strings or `cx()`; don't restate them.

| Recipe          | Use for                                           | Capy string (tokenised)                                                                                   |
| --------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `focusRing`     | every focusable control                           | `outline-none focus-visible:outline-ring-inset`                                                           |
| `focusGutter`   | inline text links/buttons                         | `focus-gutter`                                                                                            |
| `hover`         | rows and controls with hover backgrounds          | `transition-colors duration-100`                                                                          |
| `press`         | pressable surfaces (all Button variants)          | `active:brightness-97`                                                                                    |
| `disabled`      | buttons and pressables                            | `disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55`                            |
| `touchTarget`   | small controls                                    | 44x44 `pointer-coarse:after:*` hit area                                                                   |
| `popup`         | Menu, Popover, Select, Combobox popups            | scale 0.97 + fade, `duration-fast ease-out-quint`, exit `duration-exit`, `data-[instant]:transition-none` |
| `dialog`        | Dialog popup                                      | scale 95 + fade, `duration-base`, exit `duration-fast`                                                    |
| `backdrop`      | Dialog/Sheet/Drawer backdrop                      | fade, `duration-base ease-out`, exit `duration-fast`                                                      |
| `fade`          | preview cards, small floating hints               | fade, `duration-fast ease-out`, exit `duration-exit`                                                      |
| `sheetUp`       | bottom sheet / drawer                             | `translate-y-full` + fade                                                                                 |
| `tooltip`       | Tooltip popup                                     | `animate-tooltip-in/out`, `data-[instant]:animate-none`                                                   |
| `collapsible`   | Collapsible panel                                 | height + opacity, `motion-reduce:transition-none`                                                         |
| `navStack`      | nested menu or dialog pages with `data-nav="push" | "pop"`                                                                                                    | slide `translate-x-2` + fade on `starting:` |
| `enter`         | content mounting without Base UI                  | `motion-safe:starting:opacity-0`                                                                          |
| `enterRise`     | page bodies, onboarding steps                     | fade + `motion-safe:starting:translate-y-1`                                                               |
| `delayedReveal` | loading placeholders (no flash on fast loads)     | `delay-preview` then fade in                                                                              |
| `skeletonPulse` | skeleton shapes                                   | `animate-skeleton-pulse motion-reduce:animate-none`                                                       |

Enter/exit follows Base UI: popups carry `data-starting-style` on mount and
`data-ending-style` while closing, so the `data-[starting-style]:` and
`data-[ending-style]:` variants describe the hidden state and the transition
does the rest. Hover uses plain `hover:` (Tailwind v4 gates it behind
`@media (hover: hover)`); `data-[popup-open]:` mirrors hover styling on an
open trigger.

## Reduced motion

CSS: prefer `motion-safe:` for movement and `motion-reduce:transition-none` /
`motion-reduce:animate-none` to stop loops, as Capy does.

TS: `prefersReducedMotion()`, `usePrefersReducedMotion()` and
`onReducedMotionChange(setup)` (re-runs a Web Animations setup when the
preference flips).

## Off-screen pausing

`observeActive(el, listener)` shares one IntersectionObserver and the page
visibility state; `listener(active)` fires when the element enters or leaves
the viewport or the tab hides. `ShimmerText` uses it to pause its sweep.

## Loading primitives built on this

`DotGridIcon` (`@/primitives/dot-grid-icon`), `ShimmerText` + `useShimmerState`,
`SkeletonPanel` + `SkeletonPulse`, `ProgressEdge`.
