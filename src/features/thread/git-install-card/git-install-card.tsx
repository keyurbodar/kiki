import { useEffect, useState } from "react";
import { AttentionCard } from "@/features/thread/attention-card";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";

export type GitInstallResult =
  | { installed: true }
  | { opened: true }
  | { refused: string };

export type GitBridge = {
  gitBash: () => Promise<boolean>;
  installGit: () => Promise<GitInstallResult>;
};

export type GitInstallState =
  | "present"
  | "missing"
  | "installing"
  | "opened"
  | "installed";

export const GIT_POLL_INTERVAL = 3000;

export const nextInstallState = (
  result: GitInstallResult,
): { state: GitInstallState; error?: string } =>
  "installed" in result
    ? { state: "installed" }
    : "opened" in result
      ? { state: "opened" }
      : { state: "missing", error: result.refused };

export type GitInstallCardProps = {
  bridge?: GitBridge;
  isThisDevice?: boolean;
};

export function GitInstallCard({
  bridge,
  isThisDevice = false,
}: GitInstallCardProps) {
  const [state, setState] = useState<GitInstallState>("present");
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!isThisDevice || bridge === undefined) return;
    let live = true;
    bridge.gitBash().then((present) => {
      if (live && !present) setState("missing");
    });
    return () => {
      live = false;
    };
  }, [isThisDevice, bridge]);

  useEffect(() => {
    if (
      bridge === undefined ||
      !(state === "opened" || (state === "missing" && error !== undefined))
    )
      return;
    const timer = window.setInterval(() => {
      bridge.gitBash().then((present) => {
        if (present) setState("installed");
      });
    }, GIT_POLL_INTERVAL);
    return () => window.clearInterval(timer);
  }, [bridge, state, error]);

  const install = () => {
    if (bridge === undefined) return;
    setError(undefined);
    setState("installing");
    bridge
      .installGit()
      .then((result) => {
        const next = nextInstallState(result);
        setError(next.error);
        setState(next.state);
      })
      .catch((cause: unknown) => {
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not install Git for Windows",
        );
        setState("missing");
      });
  };

  if (state === "present") return null;
  if (state === "installed")
    return (
      <AttentionCard
        status="done"
        icon={<Icon name="console" />}
        className="mb-2"
        title="Git for Windows installed"
        description="Send another message to continue"
      />
    );
  return (
    <AttentionCard
      status="pending"
      className="mb-2"
      icon={<Icon name="console" />}
      title="Install Git for Windows to continue"
      description={
        state === "opened"
          ? "Finish the installer that opened, this card updates on its own"
          : "Capy runs commands on This PC with Git Bash"
      }
      action={
        state === "opened" ? (
          <Button size="sm" variant="ghost" onClick={install}>
            Open installer again
          </Button>
        ) : (
          <Button
            size="sm"
            intent="accent"
            disabled={state === "installing"}
            aria-busy={state === "installing" || undefined}
            onClick={install}
          >
            {state === "installing" ? "Installing" : "Install Git"}
          </Button>
        )
      }
    >
      {error !== undefined && (
        <div role="alert" className="text-sm text-destructive">
          {error}
        </div>
      )}
    </AttentionCard>
  );
}
