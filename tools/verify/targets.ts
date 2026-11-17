export type Scheme = "light" | "dark";
export type Viewport = { width: number; height: number; scale?: number };
export type Step = string[];
export type Expect = Record<string, Record<string, string>>;
export type Capture = Record<string, string[]>;

export type TargetFields = {
  frame?: string;
  viewport?: Viewport | string;
  steps?: Step[];
  expect?: Expect;
  capture?: Capture;
  fullPage?: boolean;
  maxMismatch?: number;
  threshold?: number;
};

export type TargetSpec = TargetFields & {
  id?: string;
  route: string;
  state?: string;
  theme?: string;
  scheme?: Scheme;
  variants?: Record<string, TargetFields>;
};

export type TargetsFile = {
  matrix?: { theme?: string[]; scheme?: Scheme[] };
  defaults?: TargetFields;
  targets: TargetSpec[];
};

export type Target = {
  id: string;
  route: string;
  state?: string;
  theme: string;
  scheme: Scheme;
  frame?: string;
  viewport?: Viewport;
  steps: Step[];
  expect: Expect;
  capture: Capture;
  fullPage: boolean;
  maxMismatch: number;
  threshold: number;
};

export const DEFAULT_CAPTURE: Capture = {
  html: [],
  body: [],
  "#root > *": [],
  h1: [],
};

export function parseViewport(value: Viewport | string): Viewport {
  if (typeof value !== "string") return value;
  const m = /^(\d+)x(\d+)(?:@(\d+(?:\.\d+)?))?$/.exec(value.trim());
  if (!m) throw new Error(`viewport "${value}" is not WxH or WxH@scale`);
  return {
    width: Number(m[1]),
    height: Number(m[2]),
    ...(m[3] ? { scale: Number(m[3]) } : {}),
  };
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function expandTargets(
  file: TargetsFile,
  base: { maxMismatch: number; threshold: number },
): Target[] {
  const themes = file.matrix?.theme ?? ["default"];
  const schemes = file.matrix?.scheme ?? ["dark"];
  const out: Target[] = [];
  for (const spec of file.targets) {
    if (!spec.route?.startsWith("/"))
      throw new Error(
        `target route must start with "/": ${JSON.stringify(spec)}`,
      );
    for (const theme of spec.theme ? [spec.theme] : themes) {
      for (const scheme of spec.scheme ? [spec.scheme] : schemes) {
        if (scheme !== "light" && scheme !== "dark")
          throw new Error(`scheme must be light or dark, got ${scheme}`);
        const variant = {
          ...spec.variants?.[theme],
          ...spec.variants?.[scheme],
          ...spec.variants?.[`${theme}/${scheme}`],
        };
        const merged: TargetFields = { ...file.defaults, ...spec, ...variant };
        const route = spec.route
          .replaceAll("{theme}", theme)
          .replaceAll("{scheme}", scheme);
        const name =
          spec.id ?? (slug(spec.route.split("?")[0] ?? "") || "root");
        out.push({
          id: `${slug(name)}--${theme}-${scheme}`,
          route,
          state: spec.state,
          theme,
          scheme,
          frame: merged.frame,
          viewport: merged.viewport
            ? parseViewport(merged.viewport)
            : undefined,
          steps: merged.steps ?? [],
          expect: merged.expect ?? {},
          capture: { ...DEFAULT_CAPTURE, ...merged.capture },
          fullPage: merged.fullPage ?? false,
          maxMismatch: merged.maxMismatch ?? base.maxMismatch,
          threshold: merged.threshold ?? base.threshold,
        });
      }
    }
  }
  const seen = new Set<string>();
  for (const t of out) {
    if (seen.has(t.id)) throw new Error(`duplicate target id ${t.id}`);
    seen.add(t.id);
  }
  return out;
}

export function shard<T>(
  items: T[],
  perShard: number,
  maxShards: number,
): T[][] {
  const count = Math.max(
    1,
    Math.min(maxShards, Math.ceil(items.length / perShard)),
  );
  const shards: T[][] = Array.from({ length: count }, () => []);
  items.forEach((item, i) => {
    shards[i % count]?.push(item);
  });
  return shards.filter((s) => s.length > 0);
}

export type RefSpec =
  | { kind: "pr"; number: number; fetchRef: string; label: string }
  | { kind: "sha"; sha: string; label: string }
  | { kind: "branch"; name: string; fetchRef: string; label: string };

export function parseRef(ref: string): RefSpec {
  const r = ref.trim().replace(/^#/, "");
  if (/^\d+$/.test(r))
    return {
      kind: "pr",
      number: Number(r),
      fetchRef: `refs/pull/${r}/head`,
      label: `pr-${r}`,
    };
  if (/^[0-9a-f]{7,40}$/i.test(r))
    return {
      kind: "sha",
      sha: r.toLowerCase(),
      label: r.toLowerCase().slice(0, 12),
    };
  return {
    kind: "branch",
    name: r,
    fetchRef: `refs/heads/${r}`,
    label: slug(r),
  };
}
