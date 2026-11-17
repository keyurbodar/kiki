export type ModelSelection = {
  modelId: string;
  reasoningMode?: string;
  modes?: Record<string, boolean>;
};

export type ModelEntry = {
  id: string;
  name: string;
  provider: string;
  efforts?: ReadonlyArray<string>;
  defaultEffort?: string;
  context?: number;
};

export const fallbackCatalog: ReadonlyArray<ModelEntry> = [
  {
    id: "anthropic/claude-opus",
    name: "Claude Opus 5.5",
    provider: "anthropic",
    efforts: ["low", "medium", "high"],
    defaultEffort: "medium",
    context: 200_000,
  },
  {
    id: "anthropic/claude-sonnet",
    name: "Claude Sonnet 5.5",
    provider: "anthropic",
    efforts: ["low", "medium", "high"],
    defaultEffort: "medium",
    context: 200_000,
  },
  {
    id: "openai/gpt",
    name: "GPT",
    provider: "openai",
    efforts: ["low", "medium", "high"],
    defaultEffort: "medium",
    context: 128_000,
  },
  {
    id: "google/gemini",
    name: "Gemini",
    provider: "google",
    efforts: ["low", "medium", "high"],
    defaultEffort: "medium",
    context: 1_000_000,
  },
];

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
  if (typeof value === "string") return { modelId: value };
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Record<string, unknown>;
  const modelId = candidate.modelId ?? candidate.model;
  if (typeof modelId !== "string" || modelId === "") return null;
  const reasoningMode =
    typeof candidate.reasoningMode === "string"
      ? candidate.reasoningMode
      : typeof candidate.effort === "string"
        ? candidate.effort
        : undefined;
  const modes =
    typeof candidate.modes === "object" && candidate.modes !== null
      ? (candidate.modes as Record<string, boolean>)
      : undefined;
  return { modelId, reasoningMode, modes };
}

export function toSelection(value: ModelSelection | null): unknown {
  if (value === null) return null;
  return {
    modelId: value.modelId,
    reasoningMode: value.reasoningMode,
    modes: value.modes,
  };
}

export function catalogEntry(
  catalog: ReadonlyArray<ModelEntry>,
  selection: ModelSelection | null,
): ModelEntry | undefined {
  if (selection === null) return undefined;
  return (
    catalog.find((entry) => entry.id === selection.modelId) ??
    catalog.find((entry) => selection.modelId.startsWith(`${entry.id}/`))
  );
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
  const entry = catalogEntry(catalog, selection);
  const effort = selection.reasoningMode ?? entry?.defaultEffort;
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
