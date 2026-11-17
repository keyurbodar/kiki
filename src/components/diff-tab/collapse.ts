export type CollapseBaseline = "expanded" | "collapsed" | "generated";

export type CollapseState = {
  baseline: CollapseBaseline;
  overrides: ReadonlyMap<string, boolean>;
};

export const initialCollapseState: CollapseState = {
  baseline: "generated",
  overrides: new Map(),
};

export const isCollapsed = (
  state: CollapseState,
  path: string,
  generated: ReadonlySet<string>,
) =>
  state.overrides.get(path) ??
  (state.baseline === "collapsed" ||
    (state.baseline === "generated" && generated.has(path)));

export const setCollapsed = (
  state: CollapseState,
  path: string,
  collapsed: boolean,
): CollapseState => ({
  ...state,
  overrides: new Map(state.overrides).set(path, collapsed),
});

export const toggleAll = (allCollapsed: boolean): CollapseState => ({
  baseline: allCollapsed ? "expanded" : "collapsed",
  overrides: new Map(),
});

export const allCollapsed = (
  state: CollapseState,
  paths: ReadonlyArray<string>,
  generated: ReadonlySet<string>,
) =>
  paths.length > 0 &&
  paths.every((path) => isCollapsed(state, path, generated));

const generatedPatterns: ReadonlyArray<RegExp> = [
  /(^|\/)(package-lock\.json|bun\.lockb?|yarn\.lock|pnpm-lock\.yaml|Cargo\.lock|go\.sum|poetry\.lock|Gemfile\.lock)$/,
  /\.min\.(js|css)$/,
  /\.gen\.[jt]sx?$/,
  /(^|\/)(dist|vendor|__generated__)\//,
];

export const isGeneratedPath = (path: string) =>
  generatedPatterns.some((pattern) => pattern.test(path));

export const generatedPaths = (files: ReadonlyArray<{ path: string }>) =>
  new Set(files.map((file) => file.path).filter(isGeneratedPath));
