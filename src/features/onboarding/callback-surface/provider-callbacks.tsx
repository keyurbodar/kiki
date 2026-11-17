import { useAtomSet } from "@effect/atom-react";
import { Schema } from "effect";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/primitives/icon";
import {
  atomsFor,
  completeGitHubOAuthAtom,
  completeMcpOAuthAtom,
} from "./atoms";
import {
  type CallbackOutcome,
  type CallbackStatus,
  desktopHref,
  errorStage,
  failureHref,
  GitHubCallbackResult,
  gitHubOutcome,
  gitHubReturnHref,
  gitHubReturnStorageKey,
  isGitHubInstallUrl,
  McpCallbackResult,
  mcpReturnHref,
  SettingsCallbackResult,
  settingsPaths,
  statusForStage,
} from "./callback-result";
import { CallbackSurface } from "./callback-surface";
import { LinearLogo, PaperLogo, SlackLogo } from "./icons";
import { browserLocation } from "./location";
import { useSettingsCallback } from "./use-settings-callback";

export type OAuthCallbackInput = {
  code?: string;
  state?: string;
  error?: string;
};

export type GitHubCallbackInput = OAuthCallbackInput & {
  installationId?: string;
  setupAction?: string;
};

export type McpCallbackInput = OAuthCallbackInput & { iss?: string };

const oauthPayload = (input: OAuthCallbackInput) => ({
  code: input.code,
  state: input.state ?? "",
  error: input.error,
});

type SettingsProvider = "slack" | "linear" | "paper";

const settingsProviders = {
  slack: {
    provider: "Slack",
    completingDescription: "Completing your workspace connection",
    icon: <SlackLogo />,
  },
  linear: {
    provider: "Linear",
    completingDescription: "Completing your workspace connection",
    icon: <LinearLogo />,
  },
  paper: {
    provider: "Paper",
    completingDescription: "Completing your Paper connection",
    icon: <PaperLogo />,
  },
} as const;

function SettingsCallback({
  provider,
  input,
}: {
  provider: SettingsProvider;
  input: OAuthCallbackInput;
}) {
  const complete = useAtomSet(atomsFor[provider], { mode: "promise" });
  const run = useCallback(
    () =>
      complete({ payload: oauthPayload(input) }).then(
        Schema.decodeUnknownPromise(SettingsCallbackResult),
      ),
    [complete, input],
  );
  const state = useSettingsCallback(provider, run);
  return <CallbackSurface {...settingsProviders[provider]} {...state} />;
}

export function SlackCallback({ input }: { input: OAuthCallbackInput }) {
  return <SettingsCallback provider="slack" input={input} />;
}

export function LinearCallback({ input }: { input: OAuthCallbackInput }) {
  return <SettingsCallback provider="linear" input={input} />;
}

export function PaperCallback({ input }: { input: OAuthCallbackInput }) {
  return <SettingsCallback provider="paper" input={input} />;
}

export function GitHubCallback({ input }: { input: GitHubCallbackInput }) {
  const complete = useAtomSet(completeGitHubOAuthAtom, { mode: "promise" });
  const [status, setStatus] = useState<CallbackStatus>("completing");
  const [desktop, setDesktop] = useState<string>();
  const [outcome, setOutcome] = useState<CallbackOutcome>();
  const [failedStage, setFailedStage] = useState<string>();
  const [fromOnboarding, setFromOnboarding] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    setFromOnboarding(
      globalThis.sessionStorage.getItem(gitHubReturnStorageKey) ===
        "onboarding",
    );
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    complete({
      payload: {
        ...oauthPayload(input),
        installationId: input.installationId,
        setupAction: input.setupAction,
      },
    })
      .then(Schema.decodeUnknownPromise(GitHubCallbackResult))
      .then(
        (result) => {
          if (
            result.result === "install" &&
            isGitHubInstallUrl(result.installUrl)
          ) {
            browserLocation.replace(result.installUrl as string);
            return;
          }
          globalThis.sessionStorage.removeItem(gitHubReturnStorageKey);
          if (
            result.result === "failed" &&
            statusForStage(result.stage ?? "unknown") === "unknown_account"
          ) {
            setStatus("unknown_account");
            return;
          }
          const href = gitHubReturnHref(result);
          const desktopLink = desktopHref(result.desktopScheme, href);
          if (desktopLink === undefined) {
            browserLocation.replace(href);
            return;
          }
          setDesktop(desktopLink);
          setOutcome(gitHubOutcome(result.result));
          setStatus("returning");
        },
        (error) => {
          globalThis.sessionStorage.removeItem(gitHubReturnStorageKey);
          setFailedStage(errorStage(error));
          setStatus("failed");
        },
      );
  }, [complete, input]);

  return (
    <CallbackSurface
      status={status}
      icon={<Icon name="github" />}
      provider="GitHub"
      completingDescription="Completing your GitHub connection"
      failedDescription={
        fromOnboarding
          ? "Head back to setup and try again"
          : "Return to settings and try connecting again"
      }
      returnHref={
        fromOnboarding
          ? `/onboarding?github=failed&reason=${encodeURIComponent(failedStage ?? "The connection did not complete")}`
          : failureHref("github", failedStage ?? "unknown")
      }
      returnLabel={fromOnboarding ? "Return to setup" : undefined}
      desktopHref={desktop}
      outcome={outcome}
    />
  );
}

export const mcpPendingStorageKey = "capy-web:mcp-connect-pending";

const McpPending = Schema.Struct({
  state: Schema.String,
  name: Schema.String,
  iconPng: Schema.NullOr(Schema.String),
});

export function readMcpPending(state: string | undefined) {
  try {
    const raw = globalThis.localStorage.getItem(mcpPendingStorageKey);
    if (raw === null) return undefined;
    const pending = Schema.decodeUnknownSync(McpPending)(JSON.parse(raw));
    return pending.state === state ? pending : undefined;
  } catch {
    return undefined;
  }
}

export function McpCallback({ input }: { input: McpCallbackInput }) {
  const complete = useAtomSet(completeMcpOAuthAtom, { mode: "promise" });
  const [status, setStatus] = useState<CallbackStatus>("completing");
  const [returnHref, setReturnHref] = useState(settingsPaths.mcp);
  const [desktop, setDesktop] = useState<string>();
  const [outcome, setOutcome] = useState<CallbackOutcome>();
  const [pending] = useState(() => readMcpPending(input.state));
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const fail = (stage: string) => {
      setReturnHref(failureHref("mcp", stage));
      setStatus(statusForStage(stage));
    };
    complete({ payload: { ...oauthPayload(input), iss: input.iss } })
      .then(Schema.decodeUnknownPromise(McpCallbackResult))
      .then(
        (result) => {
          if (result.result === "failed") {
            fail(result.stage ?? "unknown");
            return;
          }
          const href = mcpReturnHref(result);
          const desktopLink = desktopHref(result.desktopScheme, href);
          if (desktopLink === undefined) {
            browserLocation.replace(href);
            return;
          }
          setDesktop(desktopLink);
          setOutcome(result.result);
          setStatus("returning");
        },
        (error) => fail(errorStage(error)),
      );
  }, [complete, input]);

  const icon =
    pending?.iconPng == null ? (
      <Icon name="server-2" />
    ) : (
      <img
        src={`data:image/png;base64,${pending.iconPng}`}
        alt=""
        className="size-(--icon-lg) rounded-(--radius-inner) object-cover"
      />
    );

  return (
    <CallbackSurface
      status={status}
      icon={icon}
      provider={pending?.name ?? "MCP server"}
      completingDescription="Completing the server connection"
      returnHref={returnHref}
      desktopHref={desktop}
      outcome={outcome}
    />
  );
}

export function XCallback(_props: { input: OAuthCallbackInput }) {
  return (
    <CallbackSurface
      status="failed"
      icon={<Icon name="x" />}
      provider="X"
      completingDescription="Completing the shared account connection"
      failedDescription="Return to the command center and try connecting again"
      returnHref={settingsPaths.x}
      returnLabel="Return to X command center"
    />
  );
}
