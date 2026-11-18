import { useAtomSet } from "@effect/atom-react";
import { Exit } from "effect";
import { type ComponentProps, useState } from "react";
import { useActiveOrgId } from "@/data/atoms/session";
import { ApiClient } from "@/data/client/ApiClient";
import { Button } from "@/primitives/button";
import { Input } from "@/primitives/input";
import {
  claudeConnectError,
  claudeSetupCommand,
  normalizeClaudeToken,
} from "./claude-token.ts";
import {
  ConnectFooter,
  ConnectFrame,
  type ConnectNest,
  ConnectStep,
  CopyRow,
} from "./connect-layout.tsx";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const connectClaudeSeatAtom = ApiClient.mutation("models", "connectClaudeSeat");

const seatKeys = (orgId: string) => [
  `models:routing:${orgId}`,
  `models:seats:${orgId}`,
];

const help = {
  href: "https://docs.capy.ai/models-and-pricing",
  label: "Connection help",
};

export type ClaudeConnectDialogProps = ComponentProps<"div"> & {
  nest?: ConnectNest;
  reconnect?: { credentialId: string; label?: string };
  install?: string;
  onClose?: () => void;
  onConnected?: (result: unknown) => void;
};

export function ClaudeConnectDialog({
  nest,
  reconnect,
  install,
  onClose,
  onConnected,
  className,
  ...props
}: ClaudeConnectDialogProps) {
  const orgId = useActiveOrgId();
  const connect = useAtomSet(connectClaudeSeatAtom, { mode: "promiseExit" });
  const [token, setToken] = useState("");
  const [label, setLabel] = useState(reconnect?.label ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = () => {
    if (token.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    void connect({
      payload: {
        token,
        label: label.trim() || undefined,
        credentialId: reconnect?.credentialId,
      },
      reactivityKeys: orgId === undefined ? [] : seatKeys(orgId),
    })
      .then((exit) => {
        if (Exit.isFailure(exit)) setError(claudeConnectError(exit.cause));
        else onConnected?.(exit.value);
      })
      .finally(() => setBusy(false));
  };
  return (
    <ConnectFrame
      nest={nest}
      title={
        reconnect === undefined
          ? "Connect your Claude subscription"
          : "Reconnect your Claude subscription"
      }
      description="Link your Claude subscription to use Claude Code"
      onClose={onClose}
      footer={
        <ConnectFooter
          surface={nest === undefined ? "dialog" : "sheet"}
          help={help}
          onCancel={onClose}
        >
          <Button
            intent="accent"
            aria-busy={busy}
            disabled={token.length === 0 || busy}
            onClick={submit}
          >
            Verify and connect
          </Button>
        </ConnectFooter>
      }
    >
      <div
        data-slot="claude-connect-dialog"
        className={cx("contents", className)}
        {...props}
      >
        {install === undefined ? null : (
          <ConnectStep number={1} title="Install Claude Code">
            <CopyRow value={install} label="install command" />
          </ConnectStep>
        )}
        <ConnectStep
          number={install === undefined ? 1 : 2}
          title="Run this on your computer"
        >
          <CopyRow value={claudeSetupCommand} label="command" />
        </ConnectStep>
        <ConnectStep
          number={install === undefined ? 2 : 3}
          title={
            <label
              data-slot="label"
              htmlFor="claude-token"
              className="flex w-fit select-none items-center gap-1.5 text-sm font-medium text-foreground"
            >
              Paste the token it prints
            </label>
          }
        >
          <Input
            id="claude-token"
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder="sk-ant-oat01-…"
            aria-invalid={error !== null}
            value={token}
            onChange={(event) => {
              setToken(normalizeClaudeToken(event.currentTarget.value));
              setError(null);
            }}
            onPaste={(event) => {
              event.preventDefault();
              const input = event.currentTarget;
              setToken(
                normalizeClaudeToken(
                  input.value.slice(0, input.selectionStart ?? 0) +
                    event.clipboardData.getData("text") +
                    input.value.slice(input.selectionEnd ?? input.value.length),
                ),
              );
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              submit();
            }}
          />
          {error === null ? (
            <span className="text-xs font-normal text-muted-foreground-2">
              Capy checks the token with one short request before saving it
            </span>
          ) : (
            <span role="alert" className="text-xs font-normal text-destructive">
              {error}
            </span>
          )}
          <div className="flex flex-col gap-1.5">
            <label
              data-slot="label"
              htmlFor="claude-label"
              className="flex w-fit select-none items-center gap-1.5 text-sm font-medium text-foreground"
            >
              Label
            </label>
            <Input
              id="claude-label"
              autoComplete="off"
              placeholder="Account email or name"
              maxLength={128}
              value={label}
              onChange={(event) => setLabel(event.currentTarget.value)}
            />
            <span className="text-xs font-normal text-muted-foreground-2">
              Optional, otherwise this seat shows as Claude subscription
            </span>
          </div>
        </ConnectStep>
      </div>
    </ConnectFrame>
  );
}
