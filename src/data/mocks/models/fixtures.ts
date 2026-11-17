import {
  apiKeys,
  isoMinutesAgo,
  models,
  org,
  people,
} from "../fixtures/world.ts";

export interface SampleCredential {
  readonly id: string;
  readonly service: string;
  readonly name: string;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly enabled: boolean;
  readonly status: string;
  readonly models: ReadonlyArray<string>;
}

export const sampleCredentials: ReadonlyArray<SampleCredential> = [
  {
    id: "cred_sample_anthropic",
    service: "anthropic",
    name: "Anthropic workspace",
    createdBy: people.sam.id,
    createdAt: isoMinutesAgo(24 * 60),
    enabled: true,
    status: "connected",
    models: ["anthropic/claude-opus", "anthropic/claude-sonnet"],
  },
  {
    id: "cred_sample_openai",
    service: "openai",
    name: "OpenAI workspace",
    createdBy: people.alex.id,
    createdAt: isoMinutesAgo(12 * 60),
    enabled: true,
    status: "connected",
    models: ["openai/gpt"],
  },
  {
    id: "cred_sample_google",
    service: "google",
    name: "Google workspace",
    createdBy: people.priya.id,
    createdAt: isoMinutesAgo(6 * 60),
    enabled: false,
    status: "disconnected",
    models: ["google/gemini"],
  },
];

export const sampleCompactAt: Readonly<Record<string, string>> = {
  [people.alex.id]: isoMinutesAgo(60 * 18),
  [people.sam.id]: isoMinutesAgo(60 * 13),
};

export const sampleOrgCompactAt: Readonly<Record<string, string>> = {
  [org.id]: isoMinutesAgo(60 * 6),
};

export const sampleConnections: ReadonlyArray<{
  readonly credentialId: string;
  readonly service: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly models: ReadonlyArray<string>;
  readonly position: number;
}> = sampleCredentials.map((credential, position) => ({
  credentialId: credential.id,
  service: credential.service,
  name: credential.name,
  enabled: credential.enabled,
  models: credential.models,
  position,
}));

export const sampleRouting: Readonly<Record<string, string>> = {
  small: "anthropic/claude-sonnet",
  medium: "anthropic/claude-opus",
  large: "anthropic/claude-opus",
};

export const sampleOrgKeys: ReadonlyArray<{
  readonly provider: string;
  readonly apiKeyId: string;
  readonly prefix: string;
  readonly createdAt: string;
}> = [
  {
    provider: "anthropic",
    apiKeyId: apiKeys[0].id,
    prefix: apiKeys[0].prefix,
    createdAt: apiKeys[0].createdAt,
  },
];

export const sampleSettings = {
  defaultModel: models[1].id,
  fallbackModel: models[0].id,
  memberCredentials: "organization",
  availableModels: models.map((model) => model.id),
} as const;

/** Catalog rows ST10's models table renders: world models plus Capy's catalog fields. */
export const sampleCatalogModels = models.map((model) => ({
  id: model.id,
  name: model.label,
  label: model.label,
  provider: model.provider,
  tier: model.tier,
  enabled: true,
  efforts: model.tier === "peak" ? ["low", "medium", "high"] : ["low", "high"],
  fast: model.tier !== "peak",
  pro: model.tier === "peak",
  limits: { context: 200_000, output: 64_000 },
}));

/** models.routing as Capy serves it: seats, credentials, per-model routes and org settings. */
export const sampleRoutingPayload = {
  ...sampleRouting,
  admin: true,
  seats: [
    {
      service: "claude",
      state: "connected",
      credentialId: "seat_sample_claude",
      accountLabel: people.sam.email,
      plan: "max",
      enabled: true,
      jobCount: 1,
      usageCap: 5,
      health: { state: "connected", kind: "member_seat", provider: "claude" },
      ticks: [
        {
          lab: "anthropic",
          ticked: true,
          models: [
            {
              model: "anthropic/claude-opus",
              entryId: "anthropic/claude-opus",
              name: "Claude Opus",
              ticked: true,
            },
            {
              model: "anthropic/claude-sonnet",
              entryId: "anthropic/claude-sonnet",
              name: "Claude Sonnet",
              ticked: true,
            },
          ],
        },
      ],
      rows: [
        {
          model: "anthropic/claude-opus",
          providerModelId: "claude-opus-4",
          context: 200_000,
        },
      ],
    },
  ],
  credentials: [
    {
      id: "cred_sample_anthropic",
      name: "Anthropic workspace",
      provider: "anthropic",
      ownerType: "org",
      status: "active",
      enabled: true,
      position: 0,
      allModels: true,
      health: { state: "connected", kind: "key", provider: "anthropic" },
      ticks: [
        {
          lab: "anthropic",
          ticked: true,
          models: [
            {
              model: "anthropic/claude-opus",
              entryId: "anthropic/claude-opus",
              name: "Claude Opus",
              ticked: true,
            },
            {
              model: "anthropic/claude-sonnet",
              entryId: "anthropic/claude-sonnet",
              name: "Claude Sonnet",
              ticked: true,
            },
          ],
        },
      ],
      models: [
        {
          model: "anthropic/claude-opus",
          name: "Claude Opus",
          context: 200_000,
        },
        {
          model: "anthropic/claude-sonnet",
          name: "Claude Sonnet",
          context: 200_000,
        },
      ],
    },
  ],
  routes: models.map((model) => ({
    model: model.id,
    entryId: model.id,
    org: {
      kind: "org_credential",
      ref: "cred_sample_anthropic",
      label: "Anthropic workspace",
      service: "anthropic",
    },
  })),
  settings: [],
} as const;
