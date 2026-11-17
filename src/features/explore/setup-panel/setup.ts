export type SetupHelp = { label: string; url: string };

export type SetupInput =
  | {
      kind: "thread";
      id: string;
      label: string;
      description?: string;
      step: string;
      note?: string;
    }
  | {
      kind: "select";
      id: string;
      label: string;
      description?: string;
      options: Array<{ value: string; label: string }>;
      default: string;
      note?: string;
    }
  | {
      kind: "url";
      id: string;
      label: string;
      description?: string;
      default: string;
      note?: string;
    }
  | {
      kind: "secret";
      id: string;
      label: string;
      description?: string;
      optional?: boolean;
      help?: SetupHelp;
      note?: string;
    }
  | {
      kind: "vendor-step";
      id: string;
      label: string;
      description?: string;
      confirm: string;
      help?: SetupHelp;
      note?: string;
    };

export type SetupAutomationTrigger = { type: string } & Record<string, unknown>;

export type SetupAutomation = {
  name: string;
  purpose: string;
  prompt: string;
  trigger: SetupAutomationTrigger;
};

export type ListingSetup = {
  prompt: string;
  starters?: string[];
  inputs?: SetupInput[];
  automations: SetupAutomation[];
};

export type SetupCard = {
  kind: "plugin" | "skill";
  slug: string;
  displayName: string;
  version: string | null;
  versionId: string | null;
  maker?: { name: string } | null;
  accent: string | null;
};

export type SetupServer = {
  serverId: string;
  displayName: string;
  auth: "oauth" | "headers" | "none";
  placement: "machine" | "remote";
  connected?: boolean;
};

export type SetupContent =
  | { kind: "plugin"; plugin: { servers: SetupServer[] } }
  | { kind: "skill"; skill: { starters: string[] } };

export type SetupInstalled = {
  project: string;
  installationId: string | null;
  on: number;
  total: number;
};

export type InstallFailure = { input: string | null; message: string };

export const trimPeriod = (text: string) => text.replace(/\.$/, "");

export const shortVersion = (version: string) =>
  /^[0-9a-f]{40}$/.test(version) ? version.slice(0, 7) : version;

export const lowerFirst = (text: string) =>
  /^[A-Z][a-z]/.test(text)
    ? `${text.charAt(0).toLowerCase()}${text.slice(1)}`
    : text;

export const contentServers = (content: SetupContent) =>
  content.kind === "plugin" ? content.plugin.servers : [];

export const needsSignIn = (content: SetupContent) =>
  contentServers(content).some((server) => server.auth === "oauth");

export const urlHost = (value: string) => {
  if (!URL.canParse(value)) return undefined;
  const url = new URL(value);
  return url.protocol === "https:" && url.hostname !== ""
    ? url.hostname
    : undefined;
};

export const automationStep = (automation: SetupAutomation) =>
  `Suggest an automation: ${lowerFirst(trimPeriod(automation.purpose))}`;

export function installSummary(
  card: SetupCard,
  content: SetupContent,
  inputs: readonly SetupInput[],
) {
  const maker = card.maker?.name ?? card.displayName;
  const servers = contentServers(content);
  const lead =
    card.kind === "skill"
      ? "Adds the skill to the project's shared files"
      : servers.some((server) => server.auth === "oauth")
        ? `Signs in to ${maker} after Install`
        : servers.some((server) => server.auth === "headers")
          ? "No sign in, the key goes with every request"
          : servers.every((server) => server.placement === "machine")
            ? "No sign in, runs on each thread's machine"
            : "No sign in";
  return [
    lead,
    ...inputs.flatMap((input) =>
      input.note === undefined ? [] : [input.note],
    ),
  ].join(", ");
}

export function installFailureLine(
  failure: InstallFailure,
  inputs: readonly SetupInput[],
) {
  const label = inputs.find((input) => input.id === failure.input)?.label;
  return label === undefined
    ? `${failure.message}, nothing was installed`
    : `Nothing was installed, fix the ${lowerFirst(label)} and try again`;
}

export const automationsOnLabel = (on: number, total: number) =>
  `${on} of ${total} automation${total === 1 ? "" : "s"} on`;

export const automationsNote = (count: number) =>
  count === 1
    ? "The automation is created when you install, on or off as set here"
    : `${count === 2 ? "Both" : "All"} automations are created when you install, on or off as set here`;

export const filledInputs = (values: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(values).filter(([, value]) => value.trim() !== ""),
  );

export function errorMessage(error: unknown, fallback: string) {
  if (typeof error !== "object" || error === null) return fallback;
  const { _tag, message } = error as Record<string, unknown>;
  return typeof _tag === "string" &&
    _tag.startsWith("capy/") &&
    typeof message === "string" &&
    message !== ""
    ? message
    : fallback;
}

export function readInputRejection(error: unknown): InstallFailure | undefined {
  const candidate =
    typeof error === "object" && error !== null && "cause" in error
      ? [error, error.cause]
      : [error];
  for (const value of candidate) {
    if (typeof value !== "object" || value === null) continue;
    const record = value as Record<string, unknown>;
    if (record._tag !== "capy/PluginInputRejected") continue;
    if (typeof record.message !== "string") continue;
    return {
      input: typeof record.input === "string" ? record.input : null,
      message: record.message,
    };
  }
  return undefined;
}

export type SetupPromptRequest = {
  kind: SetupCard["kind"];
  slug: string;
  displayName: string;
  version: string | null;
  setup: ListingSetup;
  first?: string;
};

export function setupPrompt(request: SetupPromptRequest) {
  const version = request.version === null ? "" : ` (${request.version})`;
  const noun = request.kind === "plugin" ? "plugin" : "skill";
  const ask =
    request.kind === "plugin"
      ? `If this organization doesn't have ${request.displayName} yet, request it with tools.mcp.request({ action: "install", source: { plugin: "${request.slug}" } }) and wait for the person to add it; never install anything yourself.`
      : `If this organization doesn't have the ${request.displayName} skill yet, suggest it with explore_suggest listing { kind: "skill", slug: "${request.slug}" } and wait for the person to add it; never add it yourself.`;
  const once =
    request.kind === "plugin" ? "Once it is connected" : "Once it is added";
  const automations = request.setup.automations.map(
    (automation) =>
      `- ${automation.name} (trigger ${JSON.stringify(automation.trigger)}): ${automation.purpose}\n${automation.prompt
        .split("\n")
        .map((line) => `  ${line}`)
        .join("\n")}`,
  );
  return [
    `Set up the ${request.displayName} ${noun}${version} from Explore.`,
    ...(request.first === undefined ? [] : [`First: ${request.first}.`]),
    request.setup.prompt,
    automations.length === 0
      ? `${ask} ${once}, help with the setup above. If the person dismisses the ${noun}, say so and propose nothing.`
      : `${ask} ${once}, read the project and propose the automations below adapted to it, each created with automation_create and enabled: false, and name each one in your reply. If the person dismisses the ${noun}, say so and propose nothing.`,
    ...(automations.length === 0
      ? []
      : [`Suggested automations:\n${automations.join("\n")}`]),
  ].join("\n\n");
}
