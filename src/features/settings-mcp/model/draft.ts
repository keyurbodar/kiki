import type {
  McpAuth,
  McpClientIdentity,
  McpPlacement,
  McpServer,
} from "./types.ts";

export const serverKeyPattern = /^[a-z][a-z0-9-]{0,39}$/u;
export const reservedServerKeys: ReadonlyArray<string> = ["linear", "paper"];
export const orgWide = "org-wide";

export interface KeyValueRow {
  readonly id: string;
  readonly key: string;
  readonly value: string;
  readonly required?: boolean;
}

export interface ArgRow {
  readonly id: string;
  readonly value: string;
}

export interface ServerDraft {
  readonly owner: "organization" | "user";
  readonly serverKey: string;
  readonly displayName: string;
  readonly projectId: string;
  readonly placement: "url" | "command";
  readonly savedPlacement: McpPlacement | undefined;
  readonly savedClientIdentity: McpClientIdentity | undefined;
  readonly url: string;
  readonly launchUrl: string;
  readonly command: string;
  readonly args: ReadonlyArray<ArgRow>;
  readonly cwd: string;
  readonly env: ReadonlyArray<KeyValueRow>;
  readonly auth: McpAuth;
  readonly headers: ReadonlyArray<KeyValueRow>;
  readonly requestHeaders: ReadonlyArray<KeyValueRow>;
  readonly clientIdentity: McpClientIdentity;
  readonly connectOnDemand: boolean;
  readonly clientId: string;
  readonly clientSecret: string;
  readonly clearClientSecret: boolean;
  readonly disabledTools: ReadonlyArray<string>;
  readonly allowedTools: ReadonlyArray<string> | null;
}

const newRowId = () => crypto.randomUUID();
export const emptyKeyValue = (): KeyValueRow => ({
  id: newRowId(),
  key: "",
  value: "",
});
export const emptyArg = (): ArgRow => ({ id: newRowId(), value: "" });

export const emptyDraft = (projectId?: string): ServerDraft => ({
  owner: "organization",
  serverKey: "",
  displayName: "",
  projectId: projectId ?? orgWide,
  placement: "url",
  savedPlacement: undefined,
  savedClientIdentity: undefined,
  url: "",
  launchUrl: "",
  command: "",
  args: [emptyArg()],
  cwd: "",
  env: [emptyKeyValue()],
  auth: "none",
  headers: [emptyKeyValue()],
  requestHeaders: [emptyKeyValue()],
  clientIdentity: "auto",
  connectOnDemand: false,
  clientId: "",
  clientSecret: "",
  clearClientSecret: false,
  disabledTools: [],
  allowedTools: null,
});

export const draftFromServer = (server: McpServer): ServerDraft => ({
  owner: server.owner.kind,
  serverKey: server.serverKey,
  displayName: server.displayName,
  projectId: server.projectId ?? orgWide,
  placement: server.command === null ? "url" : "command",
  savedPlacement: server.placement,
  savedClientIdentity: server.clientIdentity,
  url: server.command === null ? (server.url ?? "") : "",
  launchUrl: server.command === null ? "" : (server.url ?? ""),
  command: server.command ?? "",
  args:
    server.args.length === 0
      ? [emptyArg()]
      : server.args.map((value, index) => ({
          id: `${server.id}-arg-${index}`,
          value,
        })),
  cwd: server.cwd ?? "",
  env: [emptyKeyValue()],
  auth: server.auth,
  headers: [emptyKeyValue()],
  requestHeaders: [emptyKeyValue()],
  clientIdentity: server.clientIdentity,
  connectOnDemand: server.connectOnDemand,
  clientId: server.clientId ?? "",
  clientSecret: "",
  clearClientSecret: false,
  disabledTools: server.disabledTools ?? [],
  allowedTools: null,
});

export const parseKeyValues = (
  rows: ReadonlyArray<KeyValueRow>,
  allowEmptyValue: boolean,
): Record<string, string> | undefined => {
  const parsed: Record<string, string> = {};
  for (const row of rows) {
    const key = row.key.trim();
    if (key === "" && row.value === "") continue;
    if (
      key === "" ||
      key.length > 100 ||
      Object.hasOwn(parsed, key) ||
      (!allowEmptyValue && row.value.trim() === "")
    )
      return undefined;
    parsed[key] = row.value;
  }
  return parsed;
};

export const isLoopbackUrl = (url: string) =>
  /^http:\/\/(127\.0\.0\.1|localhost):(\d{1,5}|\{port\})(\/.*)?$/.test(url);

export const placementFor = (draft: ServerDraft): McpPlacement =>
  draft.placement === "command" ? "machine" : "backend";

const hasRows = (rows: ReadonlyArray<KeyValueRow>) =>
  rows.some((row) => row.key.trim() !== "" || row.value.trim() !== "");

export interface DraftValidation {
  readonly validKey: boolean;
  readonly valid: boolean;
  readonly parsedEnv: Record<string, string> | undefined;
  readonly parsedHeaders: Record<string, string> | undefined;
  readonly parsedRequestHeaders: Record<string, string> | undefined;
}

export const validateDraft = (draft: ServerDraft): DraftValidation => {
  const validKey = serverKeyPattern.test(draft.serverKey);
  const parsedHeaders =
    draft.auth === "headers" ? parseKeyValues(draft.headers, false) : {};
  const requestHeaders =
    draft.placement === "url"
      ? parseKeyValues(draft.requestHeaders, false)
      : {};
  const parsedRequestHeaders =
    requestHeaders !== undefined &&
    Object.keys(requestHeaders).some(
      (key) => key.toLowerCase() === "authorization",
    )
      ? undefined
      : requestHeaders;
  const parsedEnv =
    draft.placement === "command" ? parseKeyValues(draft.env, true) : {};
  const valid =
    validKey &&
    (draft.placement === "command"
      ? draft.command.trim() !== "" &&
        parsedEnv !== undefined &&
        (draft.launchUrl.trim() === "" || isLoopbackUrl(draft.launchUrl))
      : draft.url.startsWith("https://") &&
        parsedRequestHeaders !== undefined &&
        (draft.auth !== "headers" || parsedHeaders !== undefined));
  return { validKey, valid, parsedEnv, parsedHeaders, parsedRequestHeaders };
};

const trimmedArgs = (draft: ServerDraft) =>
  draft.args.map((arg) => arg.value.trim()).filter((value) => value !== "");

export const createRequest = (
  draft: ServerDraft,
  validation: DraftValidation,
) => {
  const command = draft.placement === "command";
  const launchUrl =
    command && draft.launchUrl.trim() !== ""
      ? draft.launchUrl.trim()
      : undefined;
  const oauth = !command && draft.auth === "oauth";
  const own = oauth && draft.clientIdentity === "own";
  return {
    owner: draft.owner,
    serverKey: draft.serverKey,
    displayName: draft.displayName === "" ? undefined : draft.displayName,
    placement: placementFor(draft),
    transport: command && launchUrl === undefined ? "stdio" : "http",
    url: command ? launchUrl : draft.url,
    command: command ? draft.command.trim() : undefined,
    args: command ? trimmedArgs(draft) : undefined,
    cwd: command && draft.cwd.trim() !== "" ? draft.cwd.trim() : undefined,
    env: command && hasRows(draft.env) ? validation.parsedEnv : undefined,
    auth: command ? "none" : draft.auth,
    clientId: own && draft.clientId !== "" ? draft.clientId : undefined,
    clientSecret:
      own && draft.clientSecret !== "" ? draft.clientSecret : undefined,
    clientIdentity: oauth ? draft.clientIdentity : undefined,
    connectOnDemand: oauth ? draft.connectOnDemand : undefined,
    headers:
      !command && draft.auth === "headers" && hasRows(draft.headers)
        ? validation.parsedHeaders
        : undefined,
    requestHeaders:
      !command && hasRows(draft.requestHeaders)
        ? validation.parsedRequestHeaders
        : undefined,
    disabledTools:
      draft.disabledTools.length === 0 ? undefined : draft.disabledTools,
    allowedTools: draft.allowedTools ?? undefined,
  };
};

export const updateRequest = (
  draft: ServerDraft,
  validation: DraftValidation,
) => {
  const command = draft.placement === "command";
  const launchUrl =
    command && draft.launchUrl.trim() !== ""
      ? draft.launchUrl.trim()
      : undefined;
  const placementChanged =
    draft.savedPlacement === undefined ||
    (draft.savedPlacement === "backend") !==
      (placementFor(draft) === "backend");
  const oauth = !command && draft.auth === "oauth";
  const sameIdentity = draft.clientIdentity === draft.savedClientIdentity;
  return {
    placement: placementChanged ? placementFor(draft) : undefined,
    deviceId:
      placementChanged && draft.savedPlacement === "device" ? null : undefined,
    transport: command && launchUrl === undefined ? "stdio" : "http",
    url: command ? (launchUrl ?? null) : draft.url,
    command: command ? draft.command.trim() : undefined,
    args: command ? trimmedArgs(draft) : undefined,
    cwd: command
      ? draft.cwd.trim() === ""
        ? null
        : draft.cwd.trim()
      : undefined,
    auth: command ? "none" : draft.auth,
    clientId: !oauth
      ? undefined
      : draft.clientIdentity === "own"
        ? draft.clientId === ""
          ? null
          : draft.clientId
        : sameIdentity
          ? undefined
          : null,
    clientSecret: !oauth
      ? undefined
      : draft.clientIdentity === "own"
        ? draft.clientSecret === ""
          ? draft.clearClientSecret
            ? null
            : undefined
          : draft.clientSecret
        : sameIdentity
          ? undefined
          : null,
    clientIdentity: oauth ? draft.clientIdentity : undefined,
    connectOnDemand: oauth ? draft.connectOnDemand : undefined,
    headers:
      !command && draft.auth === "headers" && hasRows(draft.headers)
        ? validation.parsedHeaders
        : undefined,
    requestHeaders:
      !command && hasRows(draft.requestHeaders)
        ? validation.parsedRequestHeaders
        : undefined,
  };
};

export const deriveServerKey = (name: string) => {
  const slug = name
    .toLowerCase()
    .replaceAll(/[^a-z0-9-]+/g, "-")
    .replaceAll(/^-+|-+$/g, "")
    .slice(0, 40);
  const lettered = /^[a-z]/.test(slug) ? slug : `mcp-${slug}`.slice(0, 40);
  const free = reservedServerKeys.includes(lettered)
    ? `${lettered}-mcp`.slice(0, 40)
    : lettered;
  return serverKeyPattern.test(free) ? free : "";
};

export const uniqueServerKey = (key: string, taken: ReadonlySet<string>) =>
  Array.from({ length: 100 }, (_, index) =>
    index === 0
      ? key
      : `${key.slice(0, 40 - `${index + 1}`.length - 1)}-${index + 1}`,
  ).find((candidate) => !taken.has(candidate)) ?? key;
