import type {
  CatalogEntry,
  Credential,
  LabTicks,
  ModelsRouting,
  Seat,
} from "./types.ts";

const now = Date.UTC(2026, 0, 15, 12);

export const fixtureNow = now;

const hours = (n: number) => new Date(now + n * 36e5);

export const sampleCatalog: ReadonlyArray<CatalogEntry> = [
  {
    id: "anthropic/sample-large",
    name: "Sample Large",
    provider: "anthropic",
    efforts: ["low", "medium", "high"],
    fast: false,
    pro: false,
    limits: { context: 1_000_000, output: 64_000 },
    pricing: { input: 3, output: 15 },
  },
  {
    id: "anthropic/sample-small",
    name: "Sample Small",
    provider: "anthropic",
    efforts: [],
    fast: true,
    pro: false,
    limits: { context: 200_000, output: 32_000 },
    pricing: { input: 0.8, output: 4 },
  },
  {
    id: "openai/sample-turbo",
    name: "Sample Turbo",
    provider: "openai",
    efforts: ["medium"],
    fast: false,
    pro: true,
    limits: { context: 400_000, output: 128_000 },
  },
];

export const sampleTicks: ReadonlyArray<LabTicks> = [
  {
    lab: "anthropic",
    ticked: true,
    models: [
      {
        model: "anthropic/sample-large",
        entryId: "anthropic/sample-large",
        name: "Sample Large",
        ticked: true,
      },
      {
        model: "anthropic/sample-small",
        entryId: "anthropic/sample-small",
        name: "Sample Small",
        ticked: false,
      },
    ],
  },
  {
    lab: "openai",
    ticked: false,
    models: [
      {
        model: "openai/sample-turbo",
        entryId: "openai/sample-turbo",
        name: "Sample Turbo",
        ticked: false,
      },
    ],
  },
];

export const sampleCredential: Credential = {
  id: "cred_sample_gateway",
  name: "Acme gateway",
  provider: "openrouter",
  ownerType: "org",
  status: "active",
  enabled: true,
  position: 1,
  ticks: sampleTicks,
  models: [{ model: "anthropic/sample-small", excluded: true }],
  allModels: false,
  baseURL: "https://gateway.example.com/v1",
  api: "responses",
};

export const sampleCapyCredits: Credential = {
  id: "cred_sample_capy",
  name: "Capy credits",
  provider: "capy",
  ownerType: "org",
  status: "active",
  enabled: true,
  position: 99,
  ticks: sampleTicks,
  models: [],
  allModels: true,
};

export const sampleSeat: Seat = {
  service: "claude",
  state: "connected",
  credentialId: "cred_sample_seat",
  position: 0,
  accountLabel: "alex@acme.test",
  plan: "Max",
  enabled: true,
  usageCap: 80,
  expiresAt: hours(24 * 200),
  health: { state: "connected", kind: "member_seat", provider: "claude" },
  usage: {
    windows: [
      {
        limiter: "session",
        windowMinutes: 300,
        usedPercent: 42,
        resetsAt: hours(2),
      },
      {
        limiter: "weekly",
        windowMinutes: 10080,
        usedPercent: 91,
        resetsAt: hours(72),
      },
    ],
  },
  ticks: [sampleTicks[0] as LabTicks],
  rows: [],
};

export const sampleRouting: ModelsRouting = {
  admin: true,
  seats: [sampleSeat],
  credentials: [sampleCredential, sampleCapyCredits],
  routes: [
    {
      model: "anthropic/sample-large",
      entryId: "anthropic/sample-large",
      mine: {
        kind: "member_seat",
        ref: "cred_sample_seat",
        label: "Claude Code",
        service: "claude",
      },
      org: {
        kind: "org_credential",
        ref: "cred_sample_gateway",
        label: "Acme gateway",
      },
    },
    {
      model: "anthropic/sample-small",
      entryId: "anthropic/sample-small",
      mine: { kind: "capy", ref: "cred_sample_capy", label: "Capy credits" },
      org: { kind: "capy", ref: "cred_sample_capy", label: "Capy credits" },
    },
    {
      model: "openai/sample-turbo",
      entryId: "openai/sample-turbo",
      mine: { kind: "capy", ref: "cred_sample_capy", label: "Capy credits" },
    },
  ],
  settings: [
    { model: "openai/sample-turbo", off: true },
    { model: "anthropic/sample-large", onlyOrgKey: true },
  ],
};
