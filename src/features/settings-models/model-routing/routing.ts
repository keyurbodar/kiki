import type {
  CatalogEntry,
  CatalogRow,
  Credential,
  CreditsFallback,
  Health,
  LabTicks,
  ModelSetting,
  ModelsRouting,
  RouteTarget,
  Seat,
  TickChange,
} from "./types.ts";

export const seatServices = [
  { id: "claude", title: "Claude Code" },
  { id: "codex", title: "Codex" },
  { id: "copilot", title: "GitHub Copilot" },
  { id: "supergrok", title: "SuperGrok" },
  { id: "qwen-code", title: "Qwen Code" },
] as const;

export const unsupportedSeatService = "unsupported";

export const capyProvider = "capy";

export const isCapyCredits = (credential: Credential) =>
  credential.provider === capyProvider;

export const serviceTitle = (service: string) =>
  seatServices.find((s) => s.id === service)?.title ?? service;

const labOrder =
  "anthropic.claude-code.openai.xai.bench.moonshotai.zai.deepseek.google.qwen.minimax.xiaomi.tencent.meituan.meta.nvidia.particle.inception.openrouter.vercel-gateway.gravity.codex.copilot.supergrok.claude.azure".split(
    ".",
  );

const labNames: Record<string, string> = {
  anthropic: "Anthropic",
  "claude-code": "Claude Code",
  openai: "OpenAI",
  xai: "xAI",
  bench: "Benchmark",
  moonshotai: "Moonshot",
  zai: "Z.ai",
  deepseek: "DeepSeek",
  google: "Google",
  qwen: "Qwen",
  minimax: "MiniMax",
  xiaomi: "Xiaomi",
  tencent: "Tencent",
  meituan: "Meituan",
  meta: "Meta",
  nvidia: "NVIDIA",
  particle: "Particle",
  inception: "Inception",
  openrouter: "OpenRouter",
  "vercel-gateway": "Vercel AI Gateway",
  gravity: "Gravity",
  codex: "Codex",
  copilot: "Copilot",
  supergrok: "SuperGrok",
  claude: "Claude",
  azure: "Azure",
};

export const labName = (lab: string) => labNames[lab] ?? lab;

export const labRank = (lab: string) => {
  const index = labOrder.indexOf(lab);
  return index === -1 ? labOrder.length : index;
};

export const labWildcard = (lab: string) => `${lab}/*`;

export const modelIdOf = (entryId: string) => entryId;

export const slugModelId = (providerModelId: string) =>
  providerModelId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9./-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const formatContext = (tokens: number) =>
  tokens >= 1e6
    ? `${(tokens / 1e6).toFixed(1).replace(/\.0$/, "")}M`
    : tokens >= 1e3
      ? `${Math.round(tokens / 1e3)}k`
      : String(tokens);

export const formatTokens = (tokens: number) =>
  tokens >= 1e6
    ? `${(tokens / 1e6).toFixed(1).replace(/\.0$/, "")}M`
    : tokens >= 1e3
      ? `${(tokens / 1e3).toFixed(1).replace(/\.0$/, "")}K`
      : String(tokens);

export const formatPrice = (dollars: number) =>
  `$${dollars.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export const effortsLabel = (entry: CatalogEntry) =>
  entry.efforts.length === 0
    ? "—"
    : entry.efforts.length === 1
      ? entry.efforts[0]
      : `${entry.efforts[0]}-${entry.efforts.at(-1)}`;

export const formatCount = (value: number) => value.toLocaleString("en-US");

export const formatUntil = (date: Date, now: number) => {
  const ms = date.getTime() - now;
  if (ms < 864e5)
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  if (ms < 6048e5)
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      hour: "numeric",
    });
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export const usageCapLabels = {
  none: "No cap",
  50: "50%",
  70: "70%",
  80: "80%",
  90: "90%",
} as const;

export const usageCapValues = ["none", "50", "70", "80", "90"] as const;

export const fallbackLabels: Record<CreditsFallback, string> = {
  ask: "Ask me",
  own_then_ask: "Ask before Capy credits",
  next: "Keep going",
};

export const fallbackValues = ["ask", "own_then_ask", "next"] as const;

export const fallbackDescriptions: Record<CreditsFallback, string> = {
  ask: "The thread stops and asks before using anything else",
  own_then_ask:
    "The thread uses the next subscription or key and says so, and asks before Capy credits",
  next: "The thread uses the next subscription or key and says so, Capy credits included",
};

export const targetLabel = (target: RouteTarget) =>
  target.kind === "capy"
    ? "Capy credits"
    : target.kind === "member_seat"
      ? `${target.label} plan`
      : target.label;

export const lockedModels = (routing: ModelsRouting) =>
  routing.settings.filter((s) => s.onlyOrgKey).map((s) => s.model);

export const connectionsCount = (count: number) =>
  count === 0
    ? "No connections"
    : count === 1
      ? "1 connection"
      : `${count} connections`;

const keyName = (label: string) =>
  /\bkey$/i.test(label) ? label : `${label} key`;

const healthActionLabels = {
  connect: "Connect",
  reconnect: "Reconnect",
  replace_key: "Replace key",
  enable: "Turn on",
} as const;

export type HealthSummary = {
  readonly badge?: string;
  readonly sentence: string;
  readonly action?: {
    readonly kind: keyof typeof healthActionLabels;
    readonly label: string;
    readonly href: string;
  };
};

export const describeHealth = (
  health: Health,
  now: number,
  model?: string,
  name?: string,
): HealthSummary => {
  const subject = name ?? labName(health.provider);
  const toUse = model === undefined ? "" : ` to use ${model}`;
  const action =
    health.action === undefined
      ? undefined
      : {
          kind: health.action,
          label: healthActionLabels[health.action],
          href:
            health.kind === "key"
              ? "/settings/models#api-keys"
              : "/settings/models",
        };
  const until =
    health.resetsAt === undefined || health.resetsAt.getTime() <= now
      ? ""
      : ` until ${formatUntil(health.resetsAt, now)}`;
  switch (health.state) {
    case "connected":
      return health.limitedModel === undefined
        ? { sentence: `${subject} is connected` }
        : {
            badge: `${health.limitedModel} out of usage`,
            sentence: `${subject} is connected, but ${health.limitedModel} is out of usage${until}`,
          };
    case "not_connected":
      return {
        sentence: `${subject} is not connected, connect it${toUse}`,
        action,
      };
    case "signed_out":
      return health.kind === "key"
        ? {
            badge: "Key rejected",
            sentence:
              name === undefined
                ? `${subject} rejected your organization's key, replace it${toUse}`
                : `${keyName(name)} was rejected, replace it${toUse}`,
            action,
          }
        : {
            badge: "Reconnect needed",
            sentence: `${subject} signed out, reconnect it${toUse}`,
            action,
          };
    case "disabled":
      return {
        badge: "Off",
        sentence:
          name === undefined
            ? `${subject} is turned off in settings, turn it on${toUse}`
            : `${keyName(name)} is turned off, turn it on${toUse}`,
        action,
      };
    case "usage_exhausted":
      return {
        badge: "Out of usage",
        sentence: `${subject} is out of usage${until}`,
      };
  }
};

export const healthSentence = (
  health: Health,
  owner: "user" | "org",
  now: number,
  name?: string,
) => {
  const sentence = describeHealth(health, now, undefined, name).sentence;
  return owner === "user"
    ? sentence.replace("your organization's key", "your key")
    : sentence;
};

const tickedModelNames = (lab: LabTicks) =>
  lab.models.filter((m) => m.ticked).map((m) => m.name);

const excludedModelNames = (lab: LabTicks) =>
  lab.ticked ? lab.models.filter((m) => !m.ticked).map((m) => m.name) : [];

export const describeCredential = (credential: Credential, now: number) => {
  const health = credential.health;
  if (health?.state === "disabled" || health?.state === "signed_out")
    return healthSentence(health, credential.ownerType, now, credential.name);
  if (credential.status !== "active" && health === undefined)
    return "The provider rejected this key";
  if (
    credential.exhaustedUntil !== undefined &&
    credential.exhaustedUntil.getTime() > now
  )
    return `Out of usage until ${formatUntil(credential.exhaustedUntil, now)}`;
  const served = credential.ticks.flatMap(tickedModelNames);
  const everyLab = credential.ticks
    .filter((l) => l.ticked)
    .map((l) => labName(l.lab));
  const except = credential.ticks.flatMap(excludedModelNames);
  if (served.length === 0) return "Serves nothing yet";
  if (everyLab.length > 0 && except.length <= 3)
    return `Serves every ${everyLab.join(", ")} model${except.length === 0 ? "" : `, except ${except.join(", ")}`}`;
  if (served.length <= 3) return `Serves ${served.join(", ")}`;
  return `Serves ${served.length} models`;
};

export const describeEndpoint = (credential: Credential) => {
  const host = credential.baseURL?.replace(/^https?:\/\//, "");
  return [
    host === undefined ? undefined : `Through ${host}`,
    credential.azure?.resourceName === undefined
      ? undefined
      : `on ${credential.azure.resourceName}`,
    credential.api === "responses" ? "with the Responses API" : undefined,
  ]
    .filter((part) => part !== undefined)
    .join(" ")
    .replace(/^with/, "With")
    .replace(/^on/, "On");
};

export const describeCapyCredits = (credential: Credential) => {
  const used = credential.ticks.some((lab) => lab.models.some((m) => m.ticked));
  if (!used) return "Never used";
  const left = credential.ticks
    .filter((lab) => !lab.ticked)
    .map((lab) => labName(lab.lab));
  return left.length === 0
    ? "Serves models nothing else serves, from your organization's balance"
    : `Serves models nothing else serves, except ${left.join(", ")} models`;
};

const carriesMetadata = (setting: ModelSetting) =>
  setting.name !== undefined ||
  setting.providerModelId !== undefined ||
  setting.context !== undefined ||
  setting.output !== undefined ||
  setting.reasoning !== undefined ||
  setting.images !== undefined;

export const applyTick = (
  models: ReadonlyArray<ModelSetting>,
  allModels: boolean,
  ticks: ReadonlyArray<LabTicks>,
  change: TickChange,
): Array<ModelSetting> => {
  const lab = ticks.find((l) => l.lab === change.lab);
  const labModels = new Set(
    lab?.models.filter((m) => m.custom !== true).map((m) => m.model),
  );
  const wildcard = labWildcard(change.lab);
  if (change.model === undefined) {
    const kept = models
      .filter((m) => m.model !== wildcard)
      .flatMap((m): Array<ModelSetting> => {
        if (!labModels.has(m.model)) return [m];
        const { excluded: _excluded, ...rest } = m;
        if (carriesMetadata(m))
          return [change.ticked ? rest : { ...rest, excluded: true }];
        return [];
      });
    return change.ticked === allModels
      ? kept
      : [...kept, { model: wildcard, excluded: !change.ticked }];
  }
  const labTicked = lab?.ticked ?? allModels;
  const existing = models.find((m) => m.model === change.model);
  const rest = models.filter((m) => m.model !== change.model);
  if (existing?.name !== undefined || existing?.providerModelId !== undefined)
    return [
      ...rest,
      { ...existing, excluded: change.ticked ? undefined : true },
    ];
  return change.ticked === labTicked
    ? rest
    : [...rest, { model: change.model, excluded: !change.ticked }];
};

export const neverUseCapyCredits = (ticks: ReadonlyArray<LabTicks>) =>
  ticks.map((lab) => ({ model: labWildcard(lab.lab), excluded: true }));

export type ConnectionEntry =
  | {
      readonly id: string;
      readonly position: number;
      readonly seat: Seat;
      readonly credential?: undefined;
    }
  | {
      readonly id: string;
      readonly position: number;
      readonly seat?: undefined;
      readonly credential: Credential;
    };

export const myConnections = (routing: ModelsRouting): Array<ConnectionEntry> =>
  [
    ...routing.seats.flatMap(
      (seat): Array<ConnectionEntry> =>
        seat.state === "not_connected" || seat.credentialId === undefined
          ? []
          : [
              {
                id: seat.credentialId,
                position: seat.position ?? 2 ** 53 - 1,
                seat,
              },
            ],
    ),
    ...routing.credentials
      .filter((c) => c.ownerType === "user")
      .map(
        (credential): ConnectionEntry => ({
          id: credential.id,
          position: credential.position,
          credential,
        }),
      ),
  ].toSorted((a, b) => a.position - b.position);

export const organizationConnections = (routing: ModelsRouting) =>
  routing.credentials
    .filter((c) => c.ownerType === "org" && !isCapyCredits(c))
    .toSorted((a, b) => a.position - b.position);

export const catalogRows = (
  routing: ModelsRouting | undefined,
  catalog: ReadonlyArray<CatalogEntry>,
  customs: ReadonlyArray<CatalogEntry>,
): Array<CatalogRow> => {
  if (routing === undefined) return [];
  const custom = routing.credentials.flatMap((credential) =>
    credential.ticks.flatMap((lab) =>
      lab.models.flatMap((model) =>
        model.custom === true
          ? [
              customs.find((e) => e.id === model.entryId) ?? {
                id: model.entryId,
                name: model.name,
                provider: lab.lab,
                efforts: [],
                fast: false,
                pro: false,
                limits: { context: model.context ?? 0, output: 0 },
              },
            ]
          : [],
      ),
    ),
  );
  return routing.routes
    .flatMap((route) => {
      const entry = [...catalog, ...custom].find((e) => e.id === route.entryId);
      return entry === undefined
        ? []
        : [
            {
              entry,
              route,
              setting: routing.settings.find((s) => s.model === route.model),
            },
          ];
    })
    .toSorted((a, b) => labRank(a.entry.provider) - labRank(b.entry.provider));
};

export const defaultCompactAt = (context: number, orgCompactAt?: number) =>
  Math.min(Math.round(context * 0.8), orgCompactAt ?? 4e5);

export const minimumCompactAt = 5e4;
