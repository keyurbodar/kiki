export type McpPlacement = "backend" | "machine" | "device";
export type McpTransport = "http" | "sse" | "stdio";
export type McpAuth = "none" | "headers" | "oauth";
export type McpClientIdentity = "auto" | "cimd" | "dcr" | "own";
export type McpConnection = "organization" | "member";
export type McpSecretPosition =
  | "env"
  | "header"
  | "credential_header"
  | "client_secret";

export type McpSecretView =
  | {
      readonly kind: "literal";
      readonly value: string;
      readonly visible?: boolean;
    }
  | { readonly kind: "project_env"; readonly name: string }
  | { readonly kind: "machine_env"; readonly name: string }
  | { readonly kind: "file"; readonly path: string; readonly key: string }
  | { readonly kind: "env_file"; readonly path: string };

export type McpOwner =
  | { readonly kind: "organization" }
  | { readonly kind: "user"; readonly userId: string };

export type McpAuthRequiredReason =
  | "expired"
  | "invalid_grant"
  | "invalid_client"
  | "issuer_moved"
  | "registration_refused"
  | "revoked";

export interface McpCredentialState {
  readonly status: "active" | "auth_required";
  readonly authRequiredReason: McpAuthRequiredReason | null;
  readonly grantedScopes: ReadonlyArray<string>;
  readonly requiredScopes: ReadonlyArray<string> | null;
  readonly updatedAt: string;
}

export type McpHealthStage =
  | "connect"
  | "auth"
  | "permissions"
  | "protocol"
  | "list";

export type McpHealth =
  | { readonly state: "unchecked" }
  | { readonly state: "checking" }
  | {
      readonly state: "ready";
      readonly toolCount: number;
      readonly excluded: number;
      readonly checkedAt: string;
    }
  | { readonly state: "empty"; readonly checkedAt: string }
  | {
      readonly state: "error";
      readonly stage: McpHealthStage;
      readonly code: string;
      readonly detail: string;
      readonly requiredScopes?: ReadonlyArray<string>;
      readonly checkedAt: string;
    };

export interface McpServer {
  readonly id: string;
  readonly owner: McpOwner;
  readonly projectId: string | null;
  readonly serverKey: string;
  readonly displayName: string;
  readonly iconUrl: string | null;
  readonly placement: McpPlacement;
  readonly transport: McpTransport;
  readonly deviceId: string | null;
  readonly pluginInstallationId: string | null;
  readonly connection: McpConnection;
  readonly privateThreadsOnly: boolean;
  readonly url: string | null;
  readonly command: string | null;
  readonly args: ReadonlyArray<string>;
  readonly cwd: string | null;
  readonly env: Readonly<Record<string, McpSecretView>>;
  readonly requestHeaders: Readonly<Record<string, McpSecretView>>;
  readonly credentialHeaders: Readonly<Record<string, McpSecretView>>;
  readonly auth: McpAuth;
  readonly clientId: string | null;
  readonly clientSecret: McpSecretView | null;
  readonly clientIdentity: McpClientIdentity;
  readonly connectOnDemand: boolean;
  readonly scopes: ReadonlyArray<string> | null;
  readonly disabledTools: ReadonlyArray<string> | null;
  readonly allowedTools: ReadonlyArray<string> | null;
  readonly readOnlyTools: ReadonlyArray<string> | null;
  readonly hint: string | null;
  readonly enabled: boolean;
  readonly credential: McpCredentialState | null;
  readonly toolCount: number | null;
  readonly health: McpHealth;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface McpMemberConnection {
  readonly serverId: string;
  readonly userId: string;
  readonly name: string;
  readonly credential: McpCredentialState | null;
  readonly createdAt: string;
}

export interface McpServerTools {
  readonly tools: ReadonlyArray<{
    readonly name: string;
    readonly description: string | null;
  }>;
  readonly instructions: string | null;
  readonly observedAt: string;
}

export type McpDiagnosisStage = McpHealthStage;

export interface McpDiagnosis {
  readonly version: string | null;
  readonly auth: McpAuth;
  readonly requestedScopes: ReadonlyArray<string>;
  readonly grantedScopes: ReadonlyArray<string>;
  readonly requiredScopes: ReadonlyArray<string> | null;
  readonly passed: ReadonlyArray<McpDiagnosisStage>;
  readonly failure: {
    readonly stage: McpDiagnosisStage;
    readonly code: string;
    readonly detail: string;
  } | null;
  readonly toolCount: number | null;
  readonly machines: ReadonlyArray<{
    readonly id: string;
    readonly label: string;
  }>;
}

export interface McpDraftProbe {
  readonly reachable: boolean;
  readonly auth: McpAuth;
  readonly version: string | null;
  readonly passed: ReadonlyArray<McpDiagnosisStage>;
  readonly failure: McpDiagnosis["failure"];
  readonly toolCount: number | null;
}

export type PluginSource = "marketplace" | "github";
export type PluginOwner = "organization" | "me";

export interface PluginMaker {
  readonly name: string;
  readonly url?: string;
}

export interface PluginServerSpec {
  readonly entry: string;
  readonly serverKey: string;
  readonly displayName: string;
  readonly transport: McpTransport;
  readonly placement: McpPlacement;
  readonly url?: string;
  readonly command?: string;
  readonly args?: ReadonlyArray<string>;
  readonly cwd?: string;
  readonly env?: Readonly<Record<string, string>>;
  readonly auth: McpAuth;
  readonly connection: McpConnection;
  readonly scopes?: ReadonlyArray<string>;
  readonly secrets: Readonly<
    Record<
      string,
      { readonly description: string; readonly optional?: boolean }
    >
  >;
}

export interface PluginSkill {
  readonly name: string;
  readonly description: string;
  readonly path?: string;
}

export interface PluginVersion {
  readonly id: string;
  readonly source: PluginSource;
  readonly pluginId: string | null;
  readonly name: string;
  readonly version: string;
  readonly displayName: string;
  readonly description: string;
  readonly hasIcon: boolean;
  readonly servers: ReadonlyArray<PluginServerSpec>;
  readonly skills: ReadonlyArray<PluginSkill>;
  readonly warnings: ReadonlyArray<string>;
  readonly repository: string;
  readonly path: string;
  readonly notes?: string | null;
  readonly maker?: PluginMaker | null;
  readonly createdAt: string;
}

export type MarketplaceCategory =
  | "monitoring"
  | "deployment"
  | "database"
  | "docs"
  | "design"
  | "payments"
  | "productivity"
  | "other";

export interface MarketplacePlugin {
  readonly pluginId: string;
  readonly name: string;
  readonly category: string;
  readonly featured: boolean;
  readonly verified: boolean;
  readonly maker: PluginMaker | null;
  readonly stars: number | null;
  readonly setup: unknown;
  readonly version: PluginVersion;
  readonly installationId: string | null;
}

export interface InstalledPlugin {
  readonly id: string;
  readonly pluginId: string | null;
  readonly pluginName: string;
  readonly displayName: string;
  readonly description: string;
  readonly versionId: string;
  readonly version: string;
  readonly hasIcon: boolean;
  readonly source: PluginSource;
  readonly repository: string;
  readonly owner: PluginOwner;
  readonly projectId: string | null;
  readonly enabled: boolean;
  readonly toolCount: number;
  readonly skillCount: number;
  readonly status: string | null;
  readonly updateNeedsYou: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PluginServer {
  readonly serverId: string;
  readonly ownServerId: string | null;
  readonly entry: string;
  readonly serverKey: string;
  readonly displayName: string;
  readonly placement: McpPlacement;
  readonly transport: McpTransport;
  readonly auth: McpAuth;
  readonly connection: McpConnection;
  readonly status: string;
  readonly connected: boolean;
  readonly toolCount: number | null;
}

export interface InstalledPluginDetail {
  readonly installation: InstalledPlugin;
  readonly version: PluginVersion;
  readonly pending: PluginVersion | null;
  readonly canRollBack: boolean;
  readonly pendingIsRollback: boolean;
  readonly held: boolean;
  readonly removedFromMarketplace: boolean;
  readonly sourceRef: string | null;
  readonly servers: ReadonlyArray<PluginServer>;
}

export interface FetchedGitHubPlugin {
  readonly version: PluginVersion;
  readonly ref: string | null;
}

export type PluginSyncOutcome = "unchanged" | "applied" | "needs_review";

export interface PluginSyncResult {
  readonly outcome: PluginSyncOutcome;
  readonly plugin: InstalledPluginDetail;
}

export type PluginFetchFailureReason =
  | "invalid_source"
  | "not_found"
  | "too_large"
  | "invalid_archive"
  | "unsafe_entry"
  | "no_manifest"
  | "invalid_manifest"
  | "unavailable";

export type McpMount =
  | { readonly kind: "settings" }
  | { readonly kind: "project"; readonly projectId: string }
  | { readonly kind: "admin"; readonly orgId: string };
