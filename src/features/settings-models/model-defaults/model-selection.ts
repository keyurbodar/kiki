export type ModelSelection = {
  modelId: string;
  reasoningMode?: string;
  modes?: Record<string, boolean>;
};

export type ModelEntry = {
  id: string;
  name: string;
  provider: string;
  efforts: ReadonlyArray<string>;
  defaultEffort?: string;
  context?: number;
};

const effortLabels: Record<string, string> = {
  none: "None",
  instant: "Instant",
  minimal: "Minimal",
  low: "Low",
  medium: "Medium",
  high: "High",
  xhigh: "Extra high",
  max: "Max",
};

export function fromSelection(value: unknown): ModelSelection | null {
  if (typeof value === "string")
    return value === "" ? null : { modelId: value };
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Record<string, unknown>;
  const modelId = candidate.modelId;
  if (typeof modelId !== "string" || modelId === "") return null;
  return {
    modelId,
    reasoningMode:
      typeof candidate.reasoningMode === "string"
        ? candidate.reasoningMode
        : undefined,
    modes:
      typeof candidate.modes === "object" && candidate.modes !== null
        ? (candidate.modes as Record<string, boolean>)
        : undefined,
  };
}

export function toSelection(value: ModelSelection | null): unknown {
  if (value === null) return null;
  return {
    modelId: value.modelId,
    reasoningMode: value.reasoningMode,
    modes: value.modes,
  };
}

/** The catalog rows: `/models` serves a bare array of them. */
export function extractCatalog(value: unknown): ReadonlyArray<ModelEntry> {
  const rows = Array.isArray(value) ? value : [];
  return rows.flatMap((row) => {
    if (typeof row !== "object" || row === null) return [];
    const item = row as Record<string, unknown>;
    const id = item.id;
    const name = item.name ?? item.label;
    if (typeof id !== "string" || typeof name !== "string") return [];
    const limits =
      typeof item.limits === "object" && item.limits !== null
        ? (item.limits as Record<string, unknown>)
        : undefined;
    return [
      {
        id,
        name,
        provider: typeof item.provider === "string" ? item.provider : "capy",
        efforts: Array.isArray(item.efforts)
          ? item.efforts.filter(
              (effort): effort is string => typeof effort === "string",
            )
          : [],
        defaultEffort:
          typeof item.defaultEffort === "string"
            ? item.defaultEffort
            : undefined,
        context:
          typeof limits?.context === "number" ? limits.context : undefined,
      },
    ];
  });
}

export function catalogEntry(
  catalog: ReadonlyArray<ModelEntry>,
  selection: ModelSelection | null,
): ModelEntry | undefined {
  if (selection === null) return undefined;
  return catalog.find((entry) => entry.id === selection.modelId);
}

export function providerOf(
  catalog: ReadonlyArray<ModelEntry>,
  selection: ModelSelection | null,
): string {
  const entry = catalogEntry(catalog, selection);
  if (entry !== undefined) return entry.provider;
  if (selection === null) return "capy";
  const slash = selection.modelId.indexOf("/");
  return slash === -1 ? "capy" : selection.modelId.slice(0, slash);
}

export function selectionName(
  catalog: ReadonlyArray<ModelEntry>,
  selection: ModelSelection | null,
): string {
  if (selection === null) return "No model";
  const entry = catalogEntry(catalog, selection);
  if (entry !== undefined) return entry.name;
  const slash = selection.modelId.indexOf("/");
  return slash === -1 ? selection.modelId : selection.modelId.slice(slash + 1);
}

export function selectionEffort(
  catalog: ReadonlyArray<ModelEntry>,
  selection: ModelSelection | null,
): string {
  if (selection === null) return "";
  const effort =
    selection.reasoningMode ?? catalogEntry(catalog, selection)?.defaultEffort;
  if (effort === undefined) return "";
  return effortLabels[effort] ?? effort;
}

export function filterCatalog(
  catalog: ReadonlyArray<ModelEntry>,
  query: string,
): ReadonlyArray<ModelEntry> {
  const needle = query.trim().toLowerCase();
  if (needle === "") return catalog;
  return catalog.filter(
    (entry) =>
      entry.name.toLowerCase().includes(needle) ||
      entry.id.toLowerCase().includes(needle),
  );
}

export function parseTokens(value: string): number | null {
  const cleaned = value.replaceAll(",", "").trim();
  if (cleaned === "") return null;
  const parsed = Number(cleaned);
  return Number.isInteger(parsed) ? parsed : null;
}

export function formatTokens(value: number): string {
  return value.toLocaleString("en-US");
}

/** Capy's built-in default model, shown when neither the user nor the org set one. */
export const builtInDefaultModel: ModelSelection = {
  modelId: "anthropic/claude-opus-5-5",
};

export type ResolvedDefaults = {
  org: ModelSelection;
  web: ModelSelection;
  slack: ModelSelection;
  linear: ModelSelection;
};

/**
 * What a row displays: an unset value falls back to the level it inherits from,
 * so only the stored value decides the "Org" and "Web" badges.
 */
export function resolveDefaults(input: {
  webValue: ModelSelection | null;
  orgValue: ModelSelection | null;
  surfaceValues: Record<string, ModelSelection | null>;
}): ResolvedDefaults {
  const org = input.orgValue ?? builtInDefaultModel;
  const web = input.webValue ?? org;
  const surface = (key: string) => input.surfaceValues[key] ?? web;
  return { org, web, slack: surface("slack"), linear: surface("linear") };
}
