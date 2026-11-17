export type OwnerType = "user" | "org";

export type HealthState =
  | "connected"
  | "not_connected"
  | "signed_out"
  | "disabled"
  | "usage_exhausted";

export type Health = {
  readonly state: HealthState;
  readonly kind?: "key" | "member_seat";
  readonly provider: string;
  readonly action?: "connect" | "reconnect" | "replace_key" | "enable";
  readonly limitedModel?: string;
  readonly resetsAt?: Date;
};

export type UsageWindow = {
  readonly limitId?: string;
  readonly limitName?: string;
  readonly limiter: string;
  readonly windowMinutes?: number;
  readonly usedPercent: number;
  readonly resetsAt?: Date;
  readonly entitlement?: number;
  readonly remaining?: number;
};

export type TickModel = {
  readonly model: string;
  readonly entryId: string;
  readonly name: string;
  readonly ticked: boolean;
  readonly providerModelId?: string;
  readonly context?: number;
  readonly custom?: boolean;
};

export type LabTicks = {
  readonly lab: string;
  readonly ticked: boolean;
  readonly models: ReadonlyArray<TickModel>;
};

export type TickChange = {
  readonly lab: string;
  readonly model?: string;
  readonly ticked: boolean;
};

export type ModelSetting = {
  readonly model: string;
  readonly excluded?: boolean;
  readonly providerModelId?: string;
  readonly name?: string;
  readonly context?: number;
  readonly output?: number;
  readonly reasoning?: boolean;
  readonly images?: boolean;
};

export type WireFeature = "strict" | "custom" | "fallbacks" | "thinking";

export type WireState = Partial<
  Record<WireFeature, { readonly enabled: boolean; readonly at: Date }>
> & { readonly socket?: { readonly enabled: boolean } };

export type CredentialHeader = {
  readonly name: string;
  readonly value?: string;
  readonly secret?: boolean;
};

export type MediaState = {
  readonly state: "yes" | "no" | "unknown";
  readonly checkedAt?: Date;
  readonly outcome?: string;
};

export type DaybreakAccess = { readonly granted: ReadonlyArray<string> };

export type Api = "chat_completions" | "responses" | "anthropic_messages";

export type Credential = {
  readonly id: string;
  readonly name: string;
  readonly provider: string;
  readonly ownerType: OwnerType;
  readonly status: "active" | "invalid";
  readonly enabled: boolean;
  readonly position: number;
  readonly health?: Health;
  readonly exhaustedUntil?: Date;
  readonly ticks: ReadonlyArray<LabTicks>;
  readonly models: ReadonlyArray<ModelSetting>;
  readonly allModels: boolean;
  readonly baseURL?: string;
  readonly api?: Api;
  readonly azure?: {
    readonly resourceName: string;
    readonly apiVersion?: string;
  };
  readonly headers?: ReadonlyArray<CredentialHeader>;
  readonly wire?: WireState;
  readonly mediaUrl?: MediaState;
  readonly daybreak?: DaybreakAccess;
};

export type SeatService =
  | "claude"
  | "codex"
  | "copilot"
  | "supergrok"
  | "qwen-code";

export type Seat = {
  readonly service: string;
  readonly state: "connected" | "needs_reauth" | "not_connected";
  readonly credentialId?: string;
  readonly position?: number;
  readonly accountLabel?: string;
  readonly accountId?: string;
  readonly plan?: string;
  readonly enabled: boolean;
  readonly usageCap?: number;
  readonly expiresAt?: Date;
  readonly exhaustedUntil?: Date;
  readonly health: Health;
  readonly usage?: { readonly windows: ReadonlyArray<UsageWindow> };
  readonly ticks: ReadonlyArray<LabTicks>;
  readonly rows: ReadonlyArray<ModelSetting>;
};

export type RouteTarget = {
  readonly kind: "capy" | "member_seat" | "org_credential" | "user_credential";
  readonly ref: string;
  readonly label: string;
  readonly service?: string;
  readonly locked?: boolean;
  readonly skipped?: RouteTarget & {
    readonly exhaustedUntil: Date;
    readonly capped?: boolean;
    readonly resetNamed?: boolean;
    readonly idle?: "disabled" | "signed_out";
  };
};

export type Route = {
  readonly model: string;
  readonly entryId: string;
  readonly mine?: RouteTarget;
  readonly org?: RouteTarget;
  readonly mineNext?: RouteTarget;
  readonly orgNext?: RouteTarget;
};

export type ModelOrgSetting = {
  readonly model: string;
  readonly off?: boolean;
  readonly onlyOrgKey?: boolean;
};

export type ModelsRouting = {
  readonly admin: boolean;
  readonly seats: ReadonlyArray<Seat>;
  readonly credentials: ReadonlyArray<Credential>;
  readonly routes: ReadonlyArray<Route>;
  readonly settings: ReadonlyArray<ModelOrgSetting>;
};

export type CreditsFallback = "ask" | "own_then_ask" | "next";

export type ModelsSettings = {
  readonly creditsFallback?: CreditsFallback;
  readonly membersOverrideFallback?: boolean;
  readonly allowMemberCredentials?: boolean;
};

export type CatalogEntry = {
  readonly id: string;
  readonly name: string;
  readonly provider: string;
  readonly efforts: ReadonlyArray<string>;
  readonly fast: boolean;
  readonly pro: boolean;
  readonly limits: { readonly context: number; readonly output: number };
  readonly pricing?: { readonly input: number; readonly output: number };
  readonly replaces?: ReadonlyArray<string>;
};

export type CatalogRow = {
  readonly entry: CatalogEntry;
  readonly route: Route;
  readonly setting?: ModelOrgSetting;
};

export type CompactAtEntry = {
  readonly model: string;
  readonly compactAt: number;
};
