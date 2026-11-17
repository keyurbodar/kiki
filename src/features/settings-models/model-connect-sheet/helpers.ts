import {
  labWildcard,
  modelIdOf,
  slugModelId,
} from "../model-routing/routing.ts";
import type {
  CatalogEntry,
  CredentialHeader,
  DaybreakAccess,
  LabTicks,
  MediaState,
  ModelSetting,
  OwnerType,
  Route,
  RouteTarget,
  TickModel,
  WireFeature,
  WireState,
} from "../model-routing/types.ts";
import { findCatalogEntry, isServedAs } from "./presets.ts";

export type DiscoveredModel = {
  readonly providerModelId: string;
  readonly name?: string;
  readonly context?: number;
  readonly match?: { readonly model: string; readonly entryId: string };
};

export type NoticeFeature = WireFeature | "socket";

export type Discovery = {
  readonly outcome: "listed" | "unlisted";
  readonly message?: string;
  readonly rows: ReadonlyArray<DiscoveredModel>;
  readonly wire: ReadonlyArray<{ readonly feature: NoticeFeature }>;
  readonly at: Date;
};

export type DiscoverResponse = {
  readonly outcome: "listed" | "unlisted" | "rejected" | "unreachable";
  readonly message?: string;
  readonly models: ReadonlyArray<DiscoveredModel>;
  readonly wire?: WireState;
};

type RawMedia = {
  readonly state: MediaState["state"];
  readonly checkedAt?: string | Date;
  readonly outcome?: string;
};

export const readMediaCheck = (raw: unknown) => {
  const value = raw as { media: RawMedia; failure?: string };
  return {
    media: {
      state: value.media.state,
      outcome: value.media.outcome,
      checkedAt:
        value.media.checkedAt === undefined
          ? undefined
          : new Date(value.media.checkedAt),
    } satisfies MediaState,
    failure: value.failure,
  };
};

export const readDaybreak = (raw: unknown) =>
  raw as { access: DaybreakAccess; failure?: string };

export const defaultMaxOutput = 32e3;

export const parseTokens = (text: string) => {
  const digits = text.replace(/[,_\s]/g, "");
  if (digits === "") return undefined;
  const tokens = Number(digits);
  return Number.isInteger(tokens) && tokens > 0 ? tokens : Number.NaN;
};

export const stripWhitespace = (text: string) =>
  text.replace(/[\p{White_Space}\u180e\u200b-\u200f\u2060\ufeff]/gu, "");

const noticeLabels: Record<NoticeFeature, string> = {
  strict: "strict tool schemas",
  custom: "freeform tool input",
  fallbacks: "model fallbacks",
  thinking: "adaptive thinking",
  socket: "the WebSocket upgrade",
};

export const wireMessage = (features: ReadonlyArray<NoticeFeature>) =>
  `This endpoint rejected ${features.map((f) => noticeLabels[f]).join(" and ")}, so Capy ${features.every((f) => f === "strict" || f === "custom") ? "sends plain JSON tools" : "leaves them out"}`;

const second = 1e3;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;
const week = 7 * day;
const year = 365 * day;

export const relativeTime = (date: Date, now = Date.now()) => {
  const delta = now - date.getTime();
  const size = Math.abs(delta);
  if (size < 5 * second) return "just now";
  const amount =
    size < minute
      ? `${Math.floor(size / second)}s`
      : size < hour
        ? `${Math.floor(size / minute)}m`
        : size < day
          ? `${Math.floor(size / hour)}h`
          : size < week
            ? `${Math.floor(size / day)}d`
            : size < year
              ? `${Math.floor(size / week)}w`
              : `${Math.floor(size / year)}y`;
  return delta < 0 ? `in ${amount}` : `${amount} ago`;
};

export const shortDate = (date: Date) =>
  date.toLocaleDateString(undefined, { month: "short", day: "numeric" });

type FlatTick = {
  readonly lab: string;
  readonly model: string;
  readonly entryId: string;
  readonly name: string;
  readonly providerModelId?: string;
  readonly context?: number;
};

export const buildTicks = (
  base: ReadonlyArray<LabTicks>,
  listed: ReadonlyArray<DiscoveredModel>,
  models: ReadonlyArray<ModelSetting>,
  allModels: boolean,
  catalog: ReadonlyArray<CatalogEntry>,
  customLab: string | undefined,
  hideServedAs: boolean,
): Array<LabTicks> => {
  const flat = [
    ...base.flatMap((lab) =>
      lab.models
        .filter(
          (m) =>
            m.custom !== true &&
            !(
              hideServedAs &&
              isServedAs({
                model: m.model,
                providerModelId: m.providerModelId,
              }) &&
              !models.some((s) => s.model === m.model)
            ),
        )
        .map(
          (m): FlatTick => ({
            lab: lab.lab,
            model: m.model,
            entryId: m.entryId,
            name: m.name,
            providerModelId: m.providerModelId,
            context: m.context,
          }),
        ),
    ),
    ...listed.flatMap((row): Array<FlatTick> => {
      const entry = catalog.find((e) => e.id === row.match?.entryId);
      return entry === undefined || row.match === undefined
        ? []
        : [
            {
              lab: entry.provider,
              model: row.match.model,
              entryId: entry.id,
              name: entry.name,
              providerModelId: allModels ? undefined : row.providerModelId,
              context: allModels ? undefined : row.context,
            },
          ];
    }),
    ...models.flatMap((m): Array<FlatTick> => {
      const entry =
        m.name !== undefined || m.model.endsWith("/*")
          ? undefined
          : findCatalogEntry(catalog, m.model);
      return entry === undefined
        ? []
        : [
            {
              lab: entry.provider,
              model: m.model,
              entryId: entry.id,
              name: entry.name,
              providerModelId: m.providerModelId,
              context: m.context,
            },
          ];
    }),
  ].filter(
    (tick, index, all) =>
      all.findIndex((t) => t.model === tick.model) === index,
  );
  const customs = models.filter((m) => m.name !== undefined);
  const labs = [
    ...new Set([
      ...base.map((lab) => lab.lab),
      ...flat.map((tick) => tick.lab),
      ...(customLab === undefined || customs.length === 0 ? [] : [customLab]),
    ]),
  ];
  return labs
    .map((lab): LabTicks => {
      const wildcard = models.find((m) => m.model === labWildcard(lab));
      const ticked =
        wildcard === undefined ? allModels : wildcard.excluded !== true;
      return {
        lab,
        ticked,
        models: [
          ...flat
            .filter((tick) => tick.lab === lab)
            .map((tick): TickModel => {
              const setting = models.find((m) => m.model === tick.model);
              return {
                model: tick.model,
                entryId: tick.entryId,
                name: tick.name,
                ticked:
                  setting === undefined ? ticked : setting.excluded !== true,
                providerModelId:
                  setting?.providerModelId ?? tick.providerModelId,
                context: setting?.context ?? tick.context,
              };
            }),
          ...(lab === customLab
            ? customs.map(
                (m): TickModel => ({
                  model: m.model,
                  entryId: `${lab}/${m.model}`,
                  name: m.name ?? m.model,
                  ticked: m.excluded !== true,
                  providerModelId: m.providerModelId,
                  context: m.context,
                  custom: true,
                }),
              )
            : []),
        ],
      };
    })
    .filter((lab) => lab.models.length > 0);
};

export const directTicks = (
  provider: string,
  catalog: ReadonlyArray<CatalogEntry>,
): Array<LabTicks> => [
  {
    lab: provider,
    ticked: true,
    models: catalog
      .filter((e) => e.provider === provider)
      .map((e) => ({
        model: modelIdOf(e.id),
        entryId: e.id,
        name: e.name,
        ticked: true,
      })),
  },
];

export const servedCount = (ticks: ReadonlyArray<LabTicks>) =>
  ticks.reduce(
    (sum, lab) => sum + lab.models.filter((m) => m.ticked).length,
    0,
  );

export const totalCount = (ticks: ReadonlyArray<LabTicks>) =>
  ticks.reduce((sum, lab) => sum + lab.models.length, 0);

export const listedModels = (rows: ReadonlyArray<DiscoveredModel>) =>
  rows.flatMap(
    (row): Array<ModelSetting> =>
      row.match === undefined
        ? []
        : [
            {
              model: row.match.model,
              providerModelId:
                row.providerModelId === row.match.model
                  ? undefined
                  : row.providerModelId,
              context: row.context,
            },
          ],
  );

export const matchedFirst = (a: DiscoveredModel, b: DiscoveredModel) =>
  Number(a.match === undefined) - Number(b.match === undefined);

export type TokenFields = {
  readonly context?: number;
  readonly output?: number;
  readonly compactAt?: number;
  readonly defaultCompactAt: number;
  readonly outputPlaceholder: number;
  readonly contextProblem?: string;
  readonly outputProblem?: string;
  readonly compactProblem?: string;
};

export const minimumCompactAt = 5e4;

const orgCompactAtCap = 4e5;

export const tokenFields = (
  contextText: string,
  outputText: string,
  compactText: string,
): TokenFields => {
  const parsedContext = parseTokens(contextText);
  const output = parseTokens(outputText);
  const compactAt = parseTokens(compactText);
  const context =
    parsedContext !== undefined && !Number.isNaN(parsedContext)
      ? parsedContext
      : undefined;
  return {
    context,
    output,
    compactAt,
    defaultCompactAt: Math.min(
      Math.round((context ?? 0) * 0.8),
      orgCompactAtCap,
    ),
    outputPlaceholder: Math.min(defaultMaxOutput, context ?? defaultMaxOutput),
    contextProblem:
      parsedContext === undefined || context !== undefined
        ? undefined
        : "Enter a whole number of tokens",
    outputProblem:
      output === undefined
        ? undefined
        : Number.isNaN(output)
          ? "Enter a whole number of tokens"
          : context !== undefined && output > context
            ? "At most the context window"
            : undefined,
    compactProblem:
      compactAt === undefined
        ? undefined
        : Number.isNaN(compactAt) || compactAt < minimumCompactAt
          ? `At least ${minimumCompactAt.toLocaleString("en-US")} tokens`
          : context !== undefined && compactAt >= context
            ? "Below the context window"
            : undefined,
  };
};

export const headerTags = [
  "capy.user.id",
  "capy.user.email",
  "capy.user.type",
  "capy.org.id",
  "capy.org.hash",
  "capy.thread.id",
  "capy.thread.root_id",
  "capy.conversation.id",
  "capy.thread.kind",
  "capy.thread.origin",
  "capy.agent",
  "capy.model.id",
  "capy.model.provider_id",
  "capy.provider",
] as const;

export type HeaderTag = (typeof headerTags)[number];

export const tagDescriptions: Record<HeaderTag, string> = {
  "capy.user.id": "User id the thread runs as",
  "capy.user.email": "That user's email, empty for a service user",
  "capy.user.type": "human or service",
  "capy.org.id": "Organization id",
  "capy.org.hash": "SHA-256 of the organization id, first 32 hex digits",
  "capy.thread.id": "Thread or subagent id",
  "capy.thread.root_id": "Root thread id",
  "capy.conversation.id":
    "Source thread id for a forked thread, else the thread or subagent id",
  "capy.thread.kind": "thread, or task for a subagent",
  "capy.thread.origin": "web, slack, linear, api, cli, automation",
  "capy.agent": "capy, captain, or review",
  "capy.model.id": "Capy model id",
  "capy.model.provider_id": "Model id sent to the provider",
  "capy.provider": "Provider the key belongs to",
};

const tagExamples: Record<HeaderTag, string> = {
  "capy.org.hash": "3f9a1c7e02b64d8a9e51c0f7b2d4a6e8",
  "capy.conversation.id": "jam_01K5R2Q8ZT3M7XV9W1B4NCD6EF",
  "capy.user.id": "user_01K5R2Q8ZT3M7XV9W1B4NCD6EF",
  "capy.user.email": "you@example.com",
  "capy.user.type": "human",
  "capy.org.id": "org_01J8F2QWERTY7XV9W1B4NCD6EF",
  "capy.thread.id": "jam_01K5R2Q8ZT3M7XV9W1B4NCD6EF",
  "capy.thread.root_id": "jam_01K5R2Q8ZT3M7XV9W1B4NCD6EF",
  "capy.thread.kind": "thread",
  "capy.thread.origin": "web",
  "capy.agent": "capy",
  "capy.model.id": "anthropic/claude-opus-5",
  "capy.model.provider_id": "claude-opus-5",
  "capy.provider": "anthropic",
};

export const isHeaderTag = (tag: string): tag is HeaderTag =>
  (headerTags as ReadonlyArray<string>).includes(tag);

export const reservedHeaders = [
  "authorization",
  "x-api-key",
  "host",
  "content-length",
  "content-type",
  "transfer-encoding",
];

const tagPattern = /\$\{[^}]*\}/g;

export const tagRanges = (value: string) =>
  Array.from(value.matchAll(tagPattern), (m) => ({
    start: m.index,
    end: m.index + m[0].length,
  }));

export const tagNames = (value: string) =>
  Array.from(value.matchAll(/\$\{([^}]*)\}/g), (m) => m[1] ?? "");

export const previewValue = (value: string) =>
  value.replace(tagPattern, (tag) => {
    const name = tag.slice(2, -1);
    return isHeaderTag(name) ? tagExamples[name] : tag;
  });

export type ValuePart =
  | { readonly start: number; readonly tag: string; readonly width: number }
  | { readonly start: number; readonly text: string };

export const valueParts = (value: string): Array<ValuePart> => {
  let offset = 0;
  return value
    .split(/(\$\{[^}]*\})/)
    .filter((part) => part !== "")
    .map((part) => {
      const start = offset;
      offset += part.length;
      return part.startsWith("${") && part.endsWith("}")
        ? { start, tag: part.slice(2, -1), width: part.length }
        : { start, text: part };
    });
};

export const nearestEdge = (
  caret: number,
  range: { start: number; end: number },
) => (caret - range.start <= range.end - caret ? range.start : range.end);

export type HeaderDraft = {
  readonly id: number;
  readonly name: string;
  readonly value: string;
};

export const draftHeaders = (
  headers: ReadonlyArray<CredentialHeader> | undefined,
): Array<HeaderDraft> =>
  (headers ?? []).map((header, id) => ({
    id,
    name: header.name,
    value: header.value ?? "",
  }));

export const headerProblem = (
  header: HeaderDraft,
  all: ReadonlyArray<HeaderDraft>,
): { field: "name" | "value"; text: string } | undefined => {
  const name = header.name.trim();
  if (name !== "" && !/^[A-Za-z0-9-]{1,64}$/.test(name))
    return {
      field: "name",
      text: "Header names use letters, digits, and dashes",
    };
  if (reservedHeaders.includes(name.toLowerCase()))
    return { field: "name", text: `${name} is set by Capy, pick another name` };
  if (
    name !== "" &&
    all.some(
      (other) =>
        other.id !== header.id &&
        other.name.trim().toLowerCase() === name.toLowerCase(),
    )
  )
    return { field: "name", text: `${name} is already listed` };
  const unknown = tagNames(header.value).find((tag) => !isHeaderTag(tag));
  if (unknown !== undefined)
    return {
      field: "value",
      text: `Unknown tag ${unknown}, insert one from the tag list`,
    };
  if (name === "" && header.value !== "")
    return { field: "name", text: "Name the header" };
  return undefined;
};

export const hasHeaderProblems = (headers: ReadonlyArray<HeaderDraft>) =>
  headers.some((header) => headerProblem(header, headers) !== undefined);

export const cleanHeaders = (headers: ReadonlyArray<HeaderDraft>) =>
  headers.flatMap((header) =>
    header.name.trim() === ""
      ? []
      : [{ name: header.name.trim(), value: header.value }],
  );

export const nextHeaderId = (headers: ReadonlyArray<HeaderDraft>) =>
  Math.max(-1, ...headers.map((header) => header.id)) + 1;

export const maxHeaders = 16;

export type RemovalRoute = Route & {
  readonly orgNext?: RouteTarget;
  readonly mineNext?: RouteTarget;
};

const keyName = (label: string) =>
  /\bkey$/i.test(label) ? label : `${label} key`;

export const nextTargetPhrase = (target: RouteTarget | undefined) =>
  target === undefined
    ? "will have nothing to run on"
    : target.kind === "capy"
      ? "will run on Capy credits"
      : target.kind === "member_seat"
        ? `will run on your ${target.label} subscription`
        : `will run on ${keyName(target.label)}`;

export const removalSummary = (
  credential: { readonly id: string; readonly ownerType: OwnerType },
  routes: ReadonlyArray<RemovalRoute>,
  lockedModels: ReadonlyArray<string>,
  nameOf: (model: string) => string,
) => {
  const next = (route: RemovalRoute) =>
    nextTargetPhrase(
      credential.ownerType === "org" ? route.orgNext : route.mineNext,
    );
  const served = routes.filter(
    (route) =>
      (credential.ownerType === "org" ? route.org : route.mine)?.ref ===
      credential.id,
  );
  const blocked =
    credential.ownerType === "org"
      ? served
          .filter(
            (route) =>
              lockedModels.includes(route.model) && route.orgNext === undefined,
          )
          .map((route) => nameOf(route.model))
      : [];
  const lines = [...new Set(served.map(next))].map(
    (phrase) =>
      `${served
        .filter((route) => next(route) === phrase)
        .map((route) => nameOf(route.model))
        .join(", ")} ${phrase}`,
  );
  return { blocked, lines };
};

export const customIdProblem = (
  id: string,
  customs: ReadonlyArray<ModelSetting>,
  listed: ReadonlyArray<DiscoveredModel>,
  catalog: ReadonlyArray<CatalogEntry>,
) => {
  const model = slugModelId(id);
  if (model === "") return "Use letters, numbers, dots or dashes";
  if (customs.some((m) => m.model === model)) return "Already added";
  if (
    listed.some((row) => row.match?.model === model) ||
    findCatalogEntry(catalog, model) !== undefined
  )
    return "Capy already has this model, add it with Use a Capy model";
  return undefined;
};
