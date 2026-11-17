import type {
  McpSecretSource,
  McpSecrets,
  McpServerConfig,
  McpServerProposal,
  McpSetupProposal,
  McpTransport,
  McpUpdateProposal,
} from "./proposal";

export type McpSetupState =
  | "pending"
  | "declined"
  | "changed"
  | "expired"
  | "private"
  | "ready"
  | "added"
  | "updated"
  | "connected";

export type McpServerHealth =
  | { state: "unchecked" }
  | { state: "checking" }
  | { state: "ready"; toolCount: number; excluded: number; checkedAt: number }
  | { state: "empty"; checkedAt: number }
  | {
      state: "error";
      stage: "connect" | "auth" | "permissions" | "protocol" | "list";
      code: string;
      detail: string;
      requiredScopes?: readonly string[];
      checkedAt: number;
    };

export type McpQuickEdit = { fromProject: string };

export type McpAvailability = {
  owner: "open" | "user" | "organization" | undefined;
  orgName: string;
  where: string;
  quickEdit?: McpQuickEdit;
};

export type McpRecovery = "automatic" | "exhausted";
export type McpSetupStatus = "pending" | "done" | "skipped";
export type McpSetupBusy = "review" | "decline" | "retry";

export const proposalServer = (proposal: McpServerProposal): McpServerConfig =>
  proposal.kind === "update"
    ? proposal.after
    : proposal.kind === "connect"
      ? proposal.server
      : {
          ...proposal.server,
          projectId: proposal.server.projectId ?? null,
          enabled: true,
        };

export const changeCount = (proposal: McpUpdateProposal): number => {
  const { before, after } = proposal;
  return [
    before.serverKey !== after.serverKey,
    before.displayName !== after.displayName,
    before.projectId !== after.projectId,
    before.iconUrl !== after.iconUrl,
    before.enabled !== after.enabled,
    JSON.stringify(before.transport) !== JSON.stringify(after.transport),
  ].filter(Boolean).length;
};

export const isQuickEdit = (proposal: McpServerProposal): boolean =>
  proposal.kind === "update" &&
  Object.keys(proposal.secrets).length === 0 &&
  !proposal.dropsCredentials &&
  JSON.stringify(proposal.before.transport) ===
    JSON.stringify(proposal.after.transport) &&
  proposal.before.iconUrl === proposal.after.iconUrl &&
  (proposal.before.projectId === proposal.after.projectId ||
    proposal.after.projectId === null) &&
  changeCount(proposal) > 0;

export const healthLabel = (health: McpServerHealth): string =>
  health.state === "ready"
    ? `Connected · ${health.toolCount} tools`
    : health.state === "empty"
      ? "Connected · no tools"
      : health.state === "unchecked"
        ? "Not checked"
        : health.state === "checking"
          ? "Checking"
          : health.stage === "permissions"
            ? "Missing permissions"
            : health.stage === "auth"
              ? "Needs reconnect"
              : "Unavailable";

const isDone = (state: McpSetupState) =>
  state === "ready" ||
  state === "added" ||
  state === "updated" ||
  state === "connected";

export const setupStatusLabel = (
  proposal: McpServerProposal,
  state: McpSetupState,
  health: McpServerHealth | undefined,
  quickEdit: McpQuickEdit | undefined,
): string => {
  const done = isDone(state);
  const update = proposal.kind === "update" ? proposal : undefined;
  const moves =
    update !== undefined &&
    changeCount(update) === 1 &&
    update.after.projectId === null &&
    update.before.projectId !== null;
  if (done && update !== undefined && !update.after.enabled)
    return "Turned off";
  if (
    health !== undefined &&
    (health.state === "error" ||
      (done && (health.state === "ready" || health.state === "empty")))
  )
    return healthLabel(health);
  if (state === "pending") {
    if (quickEdit !== undefined && update !== undefined) {
      const count = changeCount(update);
      return moves
        ? `Connected in ${quickEdit.fromProject}`
        : `${count} ${count === 1 ? "change" : "changes"}`;
    }
    return proposal.kind === "add"
      ? "Needs setup"
      : proposal.kind === "update"
        ? "Needs update"
        : "Needs connection";
  }
  if (state === "declined")
    return quickEdit !== undefined && moves
      ? "Not moved"
      : proposal.kind === "add"
        ? "Not added"
        : proposal.kind === "update"
          ? "Not updated"
          : "Not connected";
  return state === "changed"
    ? "Setup changed"
    : state === "expired"
      ? "Expired"
      : state === "private"
        ? "Private"
        : state === "ready"
          ? "Ready"
          : state === "added"
            ? "Added"
            : state === "updated"
              ? "Updated"
              : "Connected";
};

export const setupStatus = (
  state: McpSetupState,
  health: McpServerHealth | undefined,
): McpSetupStatus =>
  state === "pending" || state === "changed" || health?.state === "error"
    ? "pending"
    : state === "declined" || state === "expired"
      ? "skipped"
      : "done";

export const reviewLabel = (
  proposal: McpServerProposal,
  availability: McpAvailability,
): string =>
  availability.quickEdit !== undefined
    ? "Approve"
    : proposal.kind === "add"
      ? "Review and add"
      : proposal.kind === "update"
        ? "Review update"
        : "Review and connect";

export const takeoverLabel = (proposal: McpServerProposal): string =>
  proposal.kind === "add"
    ? "MCP server setup"
    : proposal.kind === "update"
      ? "MCP server update"
      : "MCP connection";

export const takeoverHeading = (proposal: McpServerProposal): string => {
  const { displayName } = proposalServer(proposal);
  return proposal.kind === "add"
    ? `Add the ${displayName} MCP server`
    : proposal.kind === "update"
      ? `Update ${displayName}`
      : `Connect ${displayName}`;
};

export const availabilityLabel = (availability: McpAvailability): string => {
  const who =
    availability.owner === "open"
      ? "Chosen when you review"
      : availability.owner === "user"
        ? "Only you"
        : `Everyone in ${availability.orgName}`;
  return availability.owner === undefined
    ? availability.where
    : `${who}, ${availability.where}`;
};

export const hostLabel = (url: string): string =>
  URL.canParse(url) ? new URL(url).host : "Remote server";

export const secretLabel = (key: string): string => {
  const [kind, name] = key.split(":", 2);
  return kind === "env"
    ? `Environment ${name ?? ""}`
    : kind === "header"
      ? `Request header ${name ?? ""}`
      : kind === "credential_header"
        ? `Authentication header ${name ?? ""}`
        : "OAuth client secret";
};

export const secretValueLabel = (secret: McpSecretSource): string =>
  secret.kind === "visible"
    ? secret.value
    : secret.kind === "project_env"
      ? `Project variable ${secret.name}`
      : secret.kind === "machine_env"
        ? `Machine variable ${secret.name}`
        : secret.kind === "file"
          ? `${secret.key} in ${secret.path}`
          : `Env file ${secret.path}`;

export const referencedSecrets = (
  proposal: McpServerProposal,
): Array<[string, McpSecretSource]> =>
  Object.entries(proposal.secrets).filter(
    ([, secret]) => secret.kind !== "visible",
  );

export const visibleSecretKeys = (proposal: McpServerProposal): Set<string> =>
  new Set(
    Object.entries(proposal.secrets)
      .filter(([, secret]) => secret.kind === "visible")
      .map(([key]) => key.toLowerCase()),
  );

export type McpSecretNeeds = {
  requestHeaders: readonly string[];
  credentialHeaders: readonly string[];
  environment: readonly string[];
  clientSecret: boolean;
  oauth: boolean;
};

export type McpSecretValues = {
  requestHeaders: Record<string, string>;
  credentialHeaders: Record<string, string>;
  environment: Record<string, string>;
  clientSecret: string;
};

export type McpSecretGroup = Exclude<keyof McpSecretValues, "clientSecret">;

const transportNeeds = (transport: McpTransport): McpSecretNeeds =>
  transport.type === "stdio"
    ? {
        requestHeaders: [],
        credentialHeaders: [],
        environment: transport.environmentNames,
        clientSecret: false,
        oauth: false,
      }
    : {
        requestHeaders: transport.requestHeaderNames,
        credentialHeaders:
          transport.auth.type === "headers"
            ? transport.auth.credentialHeaderNames
            : [],
        environment: [],
        clientSecret:
          transport.auth.type === "oauth" &&
          transport.auth.clientSecretRequired,
        oauth: transport.auth.type === "oauth",
      };

export const secretKey = (group: McpSecretGroup, name: string): string =>
  `${group === "requestHeaders" ? "header" : group === "credentialHeaders" ? "credential_header" : "env"}:${name}`;

const findSecret = (secrets: McpSecrets, key: string) =>
  Object.entries(secrets).find(
    ([name]) => name.toLowerCase() === key.toLowerCase(),
  )?.[1];

const sameNames = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((name, index) => name === b[index]);

const sameNamesIgnoringCase = (a: readonly string[], b: readonly string[]) => {
  const sorted = b.map((name) => name.toLowerCase()).toSorted();
  return (
    a.length === b.length &&
    a
      .map((name) => name.toLowerCase())
      .toSorted()
      .every((name, index) => name === sorted[index])
  );
};

export const secretNeeds = (proposal: McpServerProposal): McpSecretNeeds => {
  if (proposal.kind === "add") return transportNeeds(proposal.server.transport);
  if (proposal.kind === "connect")
    return {
      ...transportNeeds(proposal.server.transport),
      requestHeaders: [],
      environment: [],
      clientSecret: false,
    };
  const before = proposal.before.transport;
  const after = proposal.after.transport;
  const beforeNeeds = transportNeeds(before);
  const afterNeeds = transportNeeds(after);
  const urlChanged =
    after.type === "http" &&
    (before.type !== "http" || before.url !== after.url);
  const commandChanged =
    after.type === "stdio" &&
    (before.type !== "stdio" || before.command !== after.command);
  const authChanged =
    before.type !== "http" ||
    after.type !== "http" ||
    (before.auth.type === "headers" && after.auth.type === "headers"
      ? !sameNamesIgnoringCase(
          before.auth.credentialHeaderNames,
          after.auth.credentialHeaderNames,
        )
      : JSON.stringify(before.auth) !== JSON.stringify(after.auth));
  const proposed = new Set(
    Object.keys(proposal.secrets).map((key) => key.toLowerCase()),
  );
  const withSecret = (prefix: string, names: readonly string[]) =>
    names.filter((name) => proposed.has(`${prefix}:${name.toLowerCase()}`));
  return {
    requestHeaders:
      urlChanged ||
      !sameNamesIgnoringCase(
        beforeNeeds.requestHeaders,
        afterNeeds.requestHeaders,
      ) ||
      withSecret("header", afterNeeds.requestHeaders).length > 0
        ? afterNeeds.requestHeaders
        : [],
    credentialHeaders:
      urlChanged ||
      authChanged ||
      withSecret("credential_header", afterNeeds.credentialHeaders).length > 0
        ? afterNeeds.credentialHeaders
        : [],
    environment:
      commandChanged ||
      !sameNames(beforeNeeds.environment, afterNeeds.environment)
        ? afterNeeds.environment
        : withSecret("env", afterNeeds.environment),
    clientSecret:
      afterNeeds.clientSecret && (authChanged || proposed.has("client_secret")),
    oauth: afterNeeds.oauth,
  };
};

export const requiredSecrets = (
  proposal: McpServerProposal,
): McpSecretNeeds => {
  const needs = secretNeeds(proposal);
  const referenced = (key: string) => {
    const secret = findSecret(proposal.secrets, key);
    return secret !== undefined && secret.kind !== "visible";
  };
  return {
    ...needs,
    requestHeaders: needs.requestHeaders.filter(
      (name) => !referenced(secretKey("requestHeaders", name)),
    ),
    credentialHeaders: needs.credentialHeaders.filter(
      (name) => !referenced(secretKey("credentialHeaders", name)),
    ),
    environment: needs.environment.filter(
      (name) => !referenced(secretKey("environment", name)),
    ),
    clientSecret: needs.clientSecret && !referenced("client_secret"),
  };
};

export const initialSecretValues = (
  proposal: McpServerProposal,
): McpSecretValues => {
  const needs = secretNeeds(proposal);
  const visible = (group: McpSecretGroup) =>
    Object.fromEntries(
      needs[group].flatMap((name) => {
        const secret = findSecret(proposal.secrets, secretKey(group, name));
        return secret?.kind === "visible" ? [[name, secret.value]] : [];
      }),
    );
  const clientSecret = findSecret(proposal.secrets, "client_secret");
  return {
    requestHeaders: visible("requestHeaders"),
    credentialHeaders: visible("credentialHeaders"),
    environment: visible("environment"),
    clientSecret: clientSecret?.kind === "visible" ? clientSecret.value : "",
  };
};

export const asksOwner = (proposal: McpServerProposal): boolean =>
  proposal.kind === "add" && proposal.owner === undefined;

const filled = (names: readonly string[], values: Record<string, string>) =>
  names.every((name) => (values[name] ?? "").length > 0);

export const canSubmitSetup = (
  proposal: McpServerProposal,
  values: McpSecretValues,
  connectionOwner: "personal" | "shared" | null,
  ownerQuestion: boolean,
): boolean => {
  const needs = requiredSecrets(proposal);
  return (
    filled(needs.requestHeaders, values.requestHeaders) &&
    filled(needs.credentialHeaders, values.credentialHeaders) &&
    filled(needs.environment, values.environment) &&
    (!needs.clientSecret || values.clientSecret.length > 0) &&
    (!ownerQuestion || connectionOwner !== null) &&
    (proposal.kind === "add" || connectionOwner !== null)
  );
};

export const transportLabel = (transport: McpTransport): string =>
  transport.type === "stdio"
    ? "stdio"
    : transport.auth.type === "none"
      ? "HTTP, no authentication"
      : transport.auth.type === "headers"
        ? "HTTP, authentication headers"
        : "HTTP, OAuth";

export const diffValueLabel = (value: unknown): string =>
  typeof value === "string" || typeof value === "number"
    ? String(value)
    : typeof value === "boolean"
      ? value
        ? "Enabled"
        : "Disabled"
      : value === null
        ? "None"
        : "Changed";

export const endpointLabel = (transport: McpTransport): string =>
  transport.type === "http"
    ? transport.url
    : [transport.command, ...transport.args].join(" ");

export const workingDirectoryLabel = (transport: McpTransport): string =>
  transport.type === "stdio"
    ? (transport.cwd ?? "Repository root")
    : "Not applicable";

export const clientIdLabel = (transport: McpTransport): string =>
  transport.type === "http" && transport.auth.type === "oauth"
    ? (transport.auth.clientId ?? "Automatic discovery")
    : "Not applicable";

export const clientSecretLabel = (transport: McpTransport): string =>
  transport.type === "http" &&
  transport.auth.type === "oauth" &&
  transport.auth.clientSecretRequired
    ? "Required"
    : "Not required";

export const requestHeaderNames = (transport: McpTransport) =>
  transport.type === "http" ? transport.requestHeaderNames : [];

export const credentialHeaderNames = (transport: McpTransport) =>
  transport.type === "http" && transport.auth.type === "headers"
    ? transport.auth.credentialHeaderNames
    : [];

export const environmentNames = (transport: McpTransport) =>
  transport.type === "stdio" ? transport.environmentNames : [];

const NUMBER_WORDS = [
  "no",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
];

export const serverCountLabel = (count: number): string => {
  const label = `${NUMBER_WORDS[count] ?? String(count)} MCP server${count === 1 ? "" : "s"}`;
  return `${label.slice(0, 1).toUpperCase()}${label.slice(1)}`;
};

export const listLabel = (names: readonly string[]): string =>
  names.length <= 3
    ? names.join(", ")
    : `${names.slice(0, 3).join(", ")} and ${names.length - 3} more`;

export type McpPluginState = Exclude<
  McpSetupState,
  "ready" | "updated" | "connected"
>;

export const pluginStatusLabel = (plugin: {
  state: McpPluginState;
  status?: string;
}): string | undefined => {
  if (plugin.state === "pending") return undefined;
  return plugin.state === "declined"
    ? "Not added"
    : plugin.state === "changed"
      ? "Setup changed"
      : plugin.state === "expired"
        ? "Expired"
        : plugin.state === "private"
          ? "Private"
          : (plugin.status ?? "Added");
};

export const pluginStatus = (plugin: {
  state: McpPluginState;
  needsConnection?: boolean;
  statusNeedsAttention?: boolean;
}): McpSetupStatus =>
  plugin.state === "declined" || plugin.state === "expired"
    ? "skipped"
    : plugin.state === "pending" ||
        plugin.state === "changed" ||
        plugin.needsConnection === true ||
        plugin.statusNeedsAttention === true
      ? "pending"
      : "done";

export const trimSlashes = (path: string): string =>
  path.replace(/^\/+|\/+$/g, "");

export const gitPluginName = (source: {
  repository: string;
  path?: string;
}): string =>
  [...source.repository.split("/"), ...(source.path ?? "").split("/")]
    .filter(Boolean)
    .at(-1) ?? source.repository;

export const proposalName = (proposal: McpSetupProposal): string =>
  proposal.kind === "plugin"
    ? proposal.source.kind === "marketplace"
      ? proposal.source.name
      : gitPluginName(proposal.source)
    : proposal.kind === "update"
      ? proposal.after.displayName
      : proposal.server.displayName;

export const lineLabel = (proposal: McpSetupProposal): string => {
  const name = proposalName(proposal);
  return proposal.kind === "update"
    ? `Proposed an update to ${name}`
    : proposal.kind === "connect"
      ? `Asked to connect ${name}`
      : `Proposed the ${name} ${proposal.kind === "plugin" ? "plugin" : "MCP server"}`;
};

export const lineOutcome = (
  proposal: McpSetupProposal,
  state: McpSetupState,
  actionable: boolean,
): string | undefined => {
  if (state === "private") return undefined;
  return state === "expired"
    ? "Expired"
    : state === "pending"
      ? actionable
        ? "Waiting on you"
        : undefined
      : state === "declined"
        ? "Declined"
        : state === "changed"
          ? "Changed since it was proposed"
          : proposal.kind === "update"
            ? "Updated"
            : proposal.kind === "connect"
              ? "Connected"
              : "Added";
};

export const lineActivatable = (
  state: McpSetupState,
  actionable: boolean,
): boolean =>
  actionable &&
  state !== "declined" &&
  state !== "private" &&
  state !== "expired";

export type McpSetupListing = { current: McpSetupState; expired: boolean };

export const listingState = (listing: McpSetupListing): McpSetupState =>
  listing.expired ? "expired" : listing.current;

export type McpPluginOrigin =
  | { kind: "marketplace"; version?: string; verified: boolean }
  | { kind: "github"; repository: string; path?: string; ref?: string };

export const githubOriginLink = (origin: {
  repository: string;
  path?: string;
  ref?: string;
}): { href: string; title: string } => {
  const path = trimSlashes(origin.path ?? "");
  return {
    href: `https://github.com/${origin.repository}${path === "" ? "" : `/tree/${origin.ref ?? "HEAD"}/${path}`}`,
    title: `github.com/${origin.repository}${path === "" ? "" : `/${path}`}`,
  };
};
