import { Schema } from "effect";

export type CallbackProvider =
  | "slack"
  | "linear"
  | "paper"
  | "github"
  | "mcp"
  | "x";

export type CallbackStatus =
  | "completing"
  | "unknown_account"
  | "returning"
  | "failed";

export type CallbackOutcome = "connected" | "denied" | "failed";

const OptionalString = Schema.optional(Schema.NullOr(Schema.String));

export const SettingsCallbackResult = Schema.Struct({
  result: Schema.Literals(["connected", "denied", "failed"]),
  desktopScheme: OptionalString,
  stage: OptionalString,
  message: OptionalString,
});
export type SettingsCallbackResult = typeof SettingsCallbackResult.Type;

export const GitHubCallbackResult = Schema.Struct({
  result: Schema.Literals([
    "connected",
    "denied",
    "failed",
    "install",
    "choose",
  ]),
  installUrl: OptionalString,
  reason: OptionalString,
  returnTo: OptionalString,
  orgId: OptionalString,
  projectId: OptionalString,
  desktopScheme: OptionalString,
  stage: OptionalString,
});
export type GitHubCallbackResult = typeof GitHubCallbackResult.Type;

export const McpCallbackResult = Schema.Struct({
  result: Schema.Literals(["connected", "denied", "failed"]),
  destination: OptionalString,
  desktopScheme: OptionalString,
  stage: OptionalString,
});
export type McpCallbackResult = typeof McpCallbackResult.Type;

export const settingsPaths: Record<CallbackProvider, string> = {
  slack: "/settings/integrations/slack",
  linear: "/settings/integrations/linear",
  paper: "/settings/integrations/paper",
  github: "/settings/integrations/github",
  mcp: "/settings/mcp",
  x: "/admin/x",
};

export const failureHref = (
  provider: CallbackProvider,
  stage: string,
  message?: string,
) => {
  const href = `${settingsPaths[provider]}?${provider}=failed&stage=${encodeURIComponent(stage)}`;
  return message === undefined
    ? href
    : `${href}&message=${encodeURIComponent(message)}`;
};

export const statusForStage = (stage: string): CallbackStatus =>
  stage === "unknown_account" ? "unknown_account" : "failed";

export const errorStage = (error: unknown) =>
  error instanceof TypeError ? "session" : "browser";

const desktopSchemes = new Set([
  "capy",
  "capy-nightly",
  "capy-staging",
  "capy-preview",
]);

export const desktopHref = (scheme: string | null | undefined, path: string) =>
  scheme != null && desktopSchemes.has(scheme)
    ? `${scheme}://app${path}`
    : undefined;

export const isGitHubInstallUrl = (url: string | null | undefined) => {
  if (url == null || !URL.canParse(url)) return false;
  const parsed = new URL(url);
  return (
    parsed.origin === "https://github.com" &&
    parsed.pathname.startsWith("/apps/")
  );
};

export const gitHubReturnStorageKey = "capy-github-return";

export const gitHubReturnHref = (result: GitHubCallbackResult) => {
  const path =
    result.returnTo === "picker"
      ? "/new"
      : result.result === "choose" && result.returnTo !== "onboarding"
        ? "/settings/integrations/github"
        : result.returnTo === "onboarding"
          ? "/onboarding"
          : result.returnTo === "project" && result.projectId != null
            ? `/settings/projects/${result.projectId}`
            : "/settings/integrations/github";
  const reason =
    result.result === "failed"
      ? `&reason=${encodeURIComponent(result.reason ?? result.stage ?? "unknown")}`
      : "";
  const outcome = result.result === "install" ? "failed" : result.result;
  return `${path}?github=${outcome}${reason}`;
};

export const gitHubOutcome = (
  result: GitHubCallbackResult["result"],
): CallbackOutcome =>
  result === "install" ? "failed" : result === "choose" ? "connected" : result;

export const mcpReturnHref = (result: McpCallbackResult) => {
  const destination = result.destination ?? settingsPaths.mcp;
  return destination === settingsPaths.mcp
    ? `${destination}?mcp=${result.result}`
    : destination;
};
