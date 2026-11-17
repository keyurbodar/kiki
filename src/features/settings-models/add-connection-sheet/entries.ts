import {
  directProviders,
  openaiCompatible,
  type Preset,
  presets,
  providerName,
} from "../model-connect-sheet/presets.ts";
import { seatServices } from "../model-routing/routing.ts";
import type { OwnerType } from "../model-routing/types.ts";

export type ConnectionTarget =
  | { readonly kind: "seat"; readonly service: string }
  | {
      readonly kind: "key";
      readonly provider: string;
      readonly preset?: string;
    };

export type ConnectionEntry = {
  readonly id: string;
  readonly name: string;
  readonly detail: string;
  readonly target?: ConnectionTarget;
  readonly state?: string;
};

export type ConnectionSection = {
  readonly title: string;
  readonly entries: ReadonlyArray<ConnectionEntry>;
};

export const connectableSeats = ["codex", "copilot", "supergrok", "claude"];

export const singleSeatServices = ["copilot"];

export const searchAliases: Record<string, ReadonlyArray<string>> = {
  claude: ["anthropic"],
  codex: ["openai", "chatgpt", "gpt"],
  copilot: ["github", "microsoft"],
  supergrok: ["grok", "xai", "x premium"],
  anthropic: ["claude"],
  openai: ["chatgpt", "gpt"],
  xai: ["grok"],
  google: ["gemini", "ai studio"],
  vercel_gateway: ["vercel", "ai sdk"],
  cloudflare_gateway: ["workers"],
  ollama_cloud: ["ollama"],
  neon_gateway: ["postgres"],
  ramp_router: ["ramp", "router"],
  opencode_go: ["zen"],
  kimi_code: ["moonshot"],
  morph_ultra: ["morphllm"],
  glm_coding_plan: ["zhipu", "z.ai", "zai"],
  bedrock: ["aws", "amazon"],
  baseten: ["model apis"],
  fireworks: ["fireworks ai"],
  together: ["together", "togethercompute"],
  deepinfra: ["deep infra"],
  meta_model_api: ["meta", "meta ai", "muse", "llama"],
  nvidia: ["nim", "nemotron"],
  [openaiCompatible]: [
    "openai compatible",
    "self-hosted",
    "vllm",
    "litellm",
    "url",
  ],
};

export const providerHosts: Record<string, string> = {
  claude: "api.anthropic.com",
  codex: "chatgpt.com",
  copilot: "api.githubcopilot.com",
  supergrok: "api.x.ai",
  anthropic: "api.anthropic.com",
  openai: "api.openai.com",
  xai: "api.x.ai",
  google: "generativelanguage.googleapis.com",
};

const entryOrder = [
  "codex",
  "claude",
  "anthropic",
  "supergrok",
  "openai",
  "openrouter",
  "opencode_go",
  "google",
  "copilot",
  "glm_coding_plan",
  "xai",
  "ollama_cloud",
  "baseten",
  "kimi_code",
  "vercel_gateway",
  "nvidia",
  "fireworks",
  "bedrock",
  "meta_model_api",
  "cloudflare_gateway",
  "neon_gateway",
  "ramp_router",
  "together",
  "deepinfra",
];

export const entryRank = (entry: ConnectionEntry) => {
  const index = entryOrder.indexOf(entry.id);
  return index === -1 ? entryOrder.length : index;
};

const byRank = (a: ConnectionEntry, b: ConnectionEntry) =>
  entryRank(a) - entryRank(b);

const urlHost = /^https?:\/\/([^/]+)/;

export const presetEntry = (preset: Preset): ConnectionEntry => ({
  id: preset.id,
  name: preset.name,
  detail: preset.host ?? urlHost.exec(preset.baseURL)?.[1] ?? "",
  target: { kind: "key", provider: preset.provider, preset: preset.id },
});

export const providerEntry = (provider: string): ConnectionEntry => ({
  id: provider,
  name: providerName(provider),
  detail: providerHosts[provider] ?? "",
  target: { kind: "key", provider },
});

export const customEndpointEntry: ConnectionEntry = {
  id: openaiCompatible,
  name: "Custom endpoint",
  detail: "Your own base URL",
  target: { kind: "key", provider: openaiCompatible },
};

const codingPlans = presets
  .filter((p) => p.kind === "coding_plan")
  .map(presetEntry);

const keyPresets = presets
  .filter((p) => p.kind !== "coding_plan")
  .map(presetEntry);

export const seatEntries = (
  connectedSeats: ReadonlyArray<string>,
): Array<ConnectionEntry> =>
  seatServices.flatMap((service): Array<ConnectionEntry> => {
    if (!connectableSeats.includes(service.id)) return [];
    const connected = connectedSeats.includes(service.id);
    const full = connected && singleSeatServices.includes(service.id);
    return [
      {
        id: service.id,
        name: service.title,
        detail: providerHosts[service.id] ?? "",
        target: full ? undefined : { kind: "seat", service: service.id },
        state: full ? "Connected" : connected ? "Add another" : undefined,
      },
    ];
  });

export const matchesQuery = (entry: ConnectionEntry, query: string) =>
  [entry.name, entry.detail, ...(searchAliases[entry.id] ?? [])].some((text) =>
    text.toLowerCase().includes(query),
  );

export const connectionSections = (
  scope: OwnerType,
  connectedSeats: ReadonlyArray<string>,
  search: string,
): Array<ConnectionSection> => {
  const query = search.trim().toLowerCase();
  return [
    {
      title: "Subscriptions",
      entries: (scope === "user" ? seatEntries(connectedSeats) : []).toSorted(
        byRank,
      ),
    },
    { title: "Coding plans", entries: codingPlans.toSorted(byRank) },
    {
      title: "API keys",
      entries: [
        ...[...directProviders.map(providerEntry), ...keyPresets].toSorted(
          byRank,
        ),
        customEndpointEntry,
      ],
    },
  ]
    .map((section) => ({
      ...section,
      entries: section.entries.filter((entry) => matchesQuery(entry, query)),
    }))
    .filter((section) => section.entries.length > 0);
};

export const firstTarget = (sections: ReadonlyArray<ConnectionSection>) =>
  sections
    .flatMap((section) => section.entries)
    .find((entry) => entry.target !== undefined)?.target;

export const targetKey = (target: ConnectionTarget | undefined) =>
  target === undefined
    ? "list"
    : target.kind === "seat"
      ? target.service
      : (target.preset ?? target.provider);
