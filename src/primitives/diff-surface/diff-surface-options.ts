import { registerCustomTheme, setCustomExtension } from "@pierre/diffs";
import diffsWorkerUrl from "@pierre/diffs/worker/worker.js?worker&url";
import {
  DIFF_CARD_LAYOUT,
  DIFF_FLUSH_LAYOUT,
  DIFF_METRICS,
  DIFF_MINIMAL_METRICS,
  workerPoolSize,
} from "./diff-surface-model";
import { diffSurfaceCSS } from "./diff-surface-styles";

export const DIFF_THEME = { light: "capy-light", dark: "capy-dark" } as const;

registerCustomTheme(DIFF_THEME.light, () =>
  import("@/tokens/code-themes/capy-light.json").then((theme) => ({
    ...theme.default,
    type: "light",
  })),
);
registerCustomTheme(DIFF_THEME.dark, () =>
  import("@/tokens/code-themes/capy-dark.json").then((theme) => ({
    ...theme.default,
    type: "dark",
  })),
);
setCustomExtension("svg", "xml");

export type DiffStyle = "unified" | "split";
export type DiffVariant = "default" | "minimal";
export type DiffOverflow = "wrap" | "scroll";
export type DiffReviewSide = "additions" | "deletions";

export function renderDiffError(errorHref: string | undefined) {
  return (error: Error, fileDiff?: { name: string }) => {
    const name = fileDiff?.name ?? "Unknown file";
    const element = document.createElement("div");
    element.dataset.diffError = "";
    element.append("Could not render this diff");
    if (errorHref !== undefined) {
      const link = document.createElement("a");
      link.href = errorHref;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "view on GitHub";
      element.append(", ", link);
    }
    const detail = document.createElement("pre");
    detail.dataset.diffErrorDetail = "";
    detail.textContent = `${name}\n${error.message}`;
    element.append(detail);
    return element;
  };
}

export function buildDiffOptions(options: {
  themeType: "light" | "dark";
  diffStyle: DiffStyle;
  overflow: DiffOverflow;
  variant: DiffVariant;
  expandUnchanged: boolean;
  itemCards: boolean;
  lineHeight: number;
  scrollbarGutter: number;
  errorHref: string | undefined;
  reviewRangeSide: DiffReviewSide | undefined;
}) {
  const minimal = options.variant === "minimal";
  return {
    theme: DIFF_THEME,
    themeType: options.themeType,
    diffStyle: options.diffStyle,
    lineDiffType: "word-alt" as const,
    overflow: options.overflow,
    stickyHeaders: !minimal,
    renderError: renderDiffError(options.errorHref),
    hunkSeparators: minimal ? ("simple" as const) : undefined,
    expandUnchanged: options.expandUnchanged,
    itemMetrics: {
      ...(minimal ? DIFF_MINIMAL_METRICS : DIFF_METRICS),
      lineHeight: options.lineHeight,
      paddingBottom: options.scrollbarGutter,
    },
    layout: options.itemCards ? DIFF_CARD_LAYOUT : DIFF_FLUSH_LAYOUT,
    unsafeCSS: diffSurfaceCSS(options.variant, options.reviewRangeSide),
  };
}

export const diffWorkerPoolOptions = (
  hardwareConcurrency: number | undefined,
) => ({
  workerFactory: () => new Worker(diffsWorkerUrl, { type: "module" }),
  deferInitialization: true,
  poolSize: workerPoolSize(hardwareConcurrency),
  totalASTLRUCacheSize: 240,
});

export const DIFF_HIGHLIGHTER_OPTIONS = {
  theme: DIFF_THEME,
  lineDiffType: "word-alt" as const,
  tokenizeMaxLineLength: 1000,
};
