const onePixel = "calc(var(--spacing) * 0.25)";
const spacing = (steps: number) => `calc(var(--spacing) * ${steps})`;

const reviewRangeCSS = `
[data-selected-line] {
  --diffs-computed-selected-line-bg: var(--diffs-computed-diff-line-bg);
  --diffs-computed-hovered-line-bg: var(--diffs-computed-diff-line-bg);
  --diffs-selection-number-fg: var(--diffs-fg-number);
}
[data-selected-line][data-line-type="change-addition"] {
  --diffs-selection-number-fg: var(--diffs-fg-number-addition-override, var(--diffs-addition-base));
}
[data-selected-line][data-line-type="change-deletion"] {
  --diffs-selection-number-fg: var(--diffs-fg-number-deletion-override, var(--diffs-deletion-base));
}
[data-line-annotation][data-selected-line],
[data-gutter-buffer="annotation"][data-selected-line] {
  background-color: var(--card);
}
[data-line][data-selected-line] {
  background-color: var(--diffs-computed-diff-line-bg);
  box-shadow: inset ${onePixel} 0 var(--primary), inset calc(-1 * ${onePixel}) 0 var(--primary),
    inset 0 var(--review-range-top, 0) var(--primary),
    inset 0 var(--review-range-bottom, 0) var(--primary);
}
[data-line][data-selected-line="first"],
[data-line][data-selected-line="single"] {
  --review-range-top: ${onePixel};
  border-start-start-radius: var(--radius-sm);
  border-start-end-radius: var(--radius-sm);
}
[data-line][data-selected-line="last"],
[data-line][data-selected-line="single"],
[data-line][data-selected-line]:has(+ [data-line-annotation][data-selected-line="last"]) {
  --review-range-bottom: calc(-1 * ${onePixel});
  border-end-start-radius: var(--radius-sm);
  border-end-end-radius: var(--radius-sm);
}
`;

export const DIFF_SURFACE_CSS = `
:host {
  --diffs-bg: var(--card);
}
[data-diff-error] {
  padding: ${spacing(3)};
  font: var(--text-xs)/1.5 var(--font-sans);
  color: var(--muted-foreground-2);
}
[data-diff-error] a {
  color: inherit;
  text-decoration: underline;
}
[data-diff-error-detail] {
  margin: ${spacing(2)} 0 0;
  font: var(--text-code-block)/1.5 var(--font-mono);
  color: var(--muted-foreground-1);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
::highlight(selection-quote) {
  background: var(--color-primary-20);
  color: var(--color-primary);
}
[data-diffs-header][data-sticky] {
  top: calc(var(--diff-sticky-top, 0rem) + var(--diff-card-hairline-strip, 0rem));
}
[data-diffs-header][data-sticky]::before {
  content: "";
  position: absolute;
  z-index: -1;
  inset-inline: 0;
  bottom: calc(100% - ${onePixel});
  height: calc(var(--diff-sticky-backing-height, 0rem) + ${onePixel});
  background: var(--diff-sticky-backing, none);
  pointer-events: none;
}
[data-diff-type="split"][data-overflow="wrap"] {
  --diffs-code-grid: var(--diffs-grid-number-column-width) minmax(0, 1fr);
}
[data-overflow="wrap"] [data-code] {
  scrollbar-gutter: auto;
}
[data-background] [data-line][data-line-type="change-addition"],
[data-background] [data-no-newline][data-line-type="change-addition"],
[data-background] [data-column-number][data-line-type="change-addition"],
[data-background] [data-gutter-buffer][data-line-type="change-addition"] {
  --diffs-computed-diff-line-bg: var(--diff-add-wash);
}
[data-background] [data-line][data-line-type="change-deletion"],
[data-background] [data-no-newline][data-line-type="change-deletion"],
[data-background] [data-column-number][data-line-type="change-deletion"],
[data-background] [data-gutter-buffer][data-line-type="change-deletion"] {
  --diffs-computed-diff-line-bg: var(--diff-del-wash);
}
[data-separator="line-info"],
[data-separator="line-info-basic"] {
  background-color: var(--diffs-bg);
  height: ${spacing(6)};
}
[data-separator-wrapper] {
  background-color: var(--diffs-bg);
}
[data-expand-button],
[data-separator-content] {
  background-color: transparent;
}
[data-expand-button] {
  border-right: 0;
  min-width: ${spacing(6)};
  margin: ${spacing(0.5)} ${spacing(0.5)} ${spacing(0.5)} ${spacing(1)};
  border-radius: var(--radius-button);
  color: var(--muted-foreground-1);
  transition: color var(--duration-hover), background-color var(--duration-hover);
}
[data-expand-button]:hover {
  color: var(--fg);
  background-color: var(--secondary);
}
[data-separator-content] {
  color: var(--muted-foreground-2);
  justify-content: center;
  background: linear-gradient(var(--border-1), var(--border-1)) center / 100% ${onePixel} no-repeat;
}
[data-expand-index] [data-separator-content]:hover {
  color: var(--fg);
  text-decoration: none;
}
[data-unmodified-lines] {
  background-color: var(--diffs-bg);
  padding-inline: ${spacing(2)};
}
[data-line-annotation],
[data-gutter-buffer="annotation"] {
  --diffs-annotation-bg: var(--diff-add-wash);
  min-height: 0;
}
[data-background] [data-gutter-buffer],
[data-background] [data-column-number] {
  --mix-light: 94%;
  --mix-dark: 90%;
}
[data-diff]:has([data-line-annotation]):not(:has([data-column-number])) {
  --diffs-grid-number-column-width: 0rem;
  --diffs-code-grid: var(--diffs-grid-number-column-width) minmax(0, 1fr);
  --diffs-overflow-override: hidden;
}
[data-diff]:has([data-line-annotation]):not(:has([data-column-number])) [data-gutter] {
  display: none;
}
[data-diff]:has([data-line-annotation]):not(:has([data-column-number])) [data-code] {
  scrollbar-gutter: auto;
}
[data-diff]:has([data-line-annotation]):not(:has([data-column-number])) [data-line-annotation] {
  --diffs-annotation-bg: var(--card);
}
[data-diff]:has([data-line-annotation]):not(:has([data-column-number])) [data-annotation-content] {
  position: static;
  width: auto;
}
[data-diff-type="split"]:has([data-line-annotation]):not(:has([data-column-number])) [data-deletions] {
  display: none;
}
[data-diff-type="split"][data-overflow="scroll"]:has([data-line-annotation]):not(:has([data-column-number])) [data-additions] {
  grid-column: 1 / -1;
}
[data-diff-type="split"][data-overflow="wrap"]:has([data-line-annotation]):not(:has([data-column-number])) [data-additions] [data-content] {
  grid-column: 1 / -1;
  display: block;
}
:host {
  --diffs-selection-base: var(--primary);
}
[data-utility-button] {
  box-sizing: border-box;
  width: var(--diff-gutter-utility-size, 1lh);
  height: var(--diff-gutter-utility-size, 1lh);
  margin-right: calc(1ch - (1lh + var(--diff-gutter-utility-size, 1lh)) / 2);
  border: var(--border-width-hairline) solid var(--border-2);
  border-radius: var(--radius-overlay);
  background-color: var(--popover);
  color: var(--muted-foreground-1);
  box-shadow: var(--shadow-overlay);
}
[data-gutter-utility-slot] {
  align-items: center;
}
[data-utility-button]:hover {
  color: var(--fg);
}
[data-utility-button] > [data-icon] {
  display: none;
}
[data-utility-button]::after {
  content: "";
  width: var(--icon-sm);
  height: var(--icon-sm);
  background-color: currentColor;
  mask: var(--diff-gutter-utility-icon) center / contain no-repeat;
}
`;

export const DIFF_SURFACE_MINIMAL_CSS = `${DIFF_SURFACE_CSS}
[data-separator] {
  display: none;
}
`;

export function diffSurfaceCSS(
  variant: "default" | "minimal",
  reviewRangeSide: "additions" | "deletions" | undefined,
) {
  const base =
    variant === "minimal" ? DIFF_SURFACE_MINIMAL_CSS : DIFF_SURFACE_CSS;
  if (reviewRangeSide === undefined) return base;
  const other = reviewRangeSide === "additions" ? "deletions" : "additions";
  return `${base}${reviewRangeCSS}
[data-diff-type="split"] [data-${other}] [data-line][data-selected-line] {
  box-shadow: none;
  border-radius: 0;
}`;
}
