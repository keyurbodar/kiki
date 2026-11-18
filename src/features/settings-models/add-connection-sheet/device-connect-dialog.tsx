import { useAtomSet } from "@effect/atom-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ConnectFooter,
  ConnectFrame,
  type ConnectNest,
  ConnectStep,
  CopyRow,
} from "@/components/claude-connect-dialog/connect-layout";
import {
  ArrowUpRightGlyph,
  CopyGlyph,
} from "@/components/claude-connect-dialog/glyphs";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { toast } from "@/primitives/toaster";
import { pollDeviceAtom, startDeviceAtom } from "../model-routing/atoms.ts";
import { serviceTitle } from "../model-routing/routing.ts";
import {
  type DeviceAttempt,
  type DevicePoll,
  readDeviceAttempt,
  readDevicePoll,
} from "./device-attempt.ts";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const codexSwitch =
  "In ChatGPT Settings → Security, turn on device code authorization for Codex";
const codexHidden =
  "If your workspace hides the switch, ask your workspace owner to enable device code authentication for Codex CLI";
const codexHelp =
  "https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan";

export const pollFailure = (status: DevicePoll["status"]) =>
  status === "denied"
    ? "The login was denied"
    : status === "expired"
      ? "The code expired, start again"
      : "The login failed";

export type ConnectWaitProps = {
  status: "pending" | "success" | "failed";
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
  size?: "base" | "inline";
};

export function ConnectWait({
  status,
  title,
  description,
  action,
  size = "base",
}: ConnectWaitProps) {
  const iconSize =
    size === "inline" ? "size-4 shrink-0" : "size-(--icon-base) shrink-0";
  return (
    <div className="flex flex-col gap-4">
      <div
        className={cx(
          "grid grid-cols-[auto_minmax(0,1fr)] gap-y-1",
          size === "inline" ? "gap-x-2" : "gap-x-2.5",
        )}
      >
        {status === "pending" ? (
          <Icon
            name="circle-dotted"
            label="Waiting"
            className={cx(iconSize, "animate-spin text-muted-foreground-1")}
          />
        ) : (
          <Icon
            name={status === "success" ? "circle-check" : "circle-x"}
            className={cx(
              iconSize,
              status === "success" ? "text-success" : "text-destructive",
            )}
          />
        )}
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="col-start-2 text-sm font-normal text-muted-foreground-2">
          {description}
        </p>
      </div>
      {action == null ? null : (
        <div className="flex flex-wrap justify-end gap-2">{action}</div>
      )}
    </div>
  );
}

export type DeviceConnectDialogProps = {
  nest?: ConnectNest;
  service: string;
  credentialId?: string;
  onClose: () => void;
  onConnected: () => void;
};

export function DeviceConnectDialog({
  nest,
  service,
  credentialId,
  onClose,
  onConnected,
}: DeviceConnectDialogProps) {
  const startDevice = useAtomSet(startDeviceAtom, { mode: "promise" });
  const pollDevice = useAtomSet(pollDeviceAtom, { mode: "promise" });
  const connected = useRef(onConnected);
  useEffect(() => {
    connected.current = onConnected;
  }, [onConnected]);
  const [attempt, setAttempt] = useState<DeviceAttempt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const start = useCallback(() => {
    setError(null);
    setAttempt(null);
    startDevice({
      params: { service },
      query: credentialId === undefined ? {} : { credentialId },
    })
      .then((raw) => setAttempt(readDeviceAttempt(raw)))
      .catch(() => setError("Could not start the login"));
  }, [service, credentialId, startDevice]);
  const startedFor = useRef<string | null>(null);
  useEffect(() => {
    if (startedFor.current === service) return;
    startedFor.current = service;
    start();
  }, [service, start]);
  useEffect(() => {
    if (attempt === null) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const delay = Math.max(attempt.intervalSeconds, 1) * 1e3;
    const poll = () => {
      pollDevice({ params: { attemptId: attempt.attemptId } })
        .then((raw) => {
          if (stopped) return;
          const { status } = readDevicePoll(raw);
          if (status === "pending") timer = setTimeout(poll, delay);
          else if (status === "connected") connected.current();
          else setError(pollFailure(status));
        })
        .catch(() => {
          if (!stopped) timer = setTimeout(poll, delay);
        });
    };
    timer = setTimeout(poll, attempt.intervalSeconds * 1e3);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [attempt, pollDevice]);
  const codex = service === "codex";
  const title = serviceTitle(service);
  return (
    <ConnectFrame
      nest={nest}
      title={`Connect ${title}`}
      description="Use your own subscription for this provider's models"
      onClose={onClose}
      footer={
        <ConnectFooter
          surface={nest === undefined ? "dialog" : "sheet"}
          help={
            codex
              ? { href: codexHelp, label: "OpenAI sign-in help" }
              : {
                  href: "https://docs.capy.ai/models-and-pricing",
                  label: "Connection help",
                }
          }
          onCancel={onClose}
        >
          {error === null ? null : (
            <Button intent="accent" onClick={start}>
              Try again
            </Button>
          )}
        </ConnectFooter>
      }
    >
      {error !== null ? (
        <ConnectWait
          status="failed"
          title={error}
          description={
            codex ? (
              <>
                {codexSwitch}
                <br />
                {codexHidden}
                <br />
                Start again after changing the settings
              </>
            ) : (
              "Start again to get a fresh code"
            )
          }
          action={null}
        />
      ) : attempt === null ? (
        <ConnectWait
          status="pending"
          title="Requesting a code"
          description="The verification steps appear when the code arrives"
          action={null}
        />
      ) : (
        <>
          {codex ? (
            <ConnectStep
              number={1}
              title={codexSwitch}
              description={
                <>
                  If your workspace hides the switch,{" "}
                  <span className="font-medium">ask your workspace owner</span>{" "}
                  to enable device code authentication for Codex CLI
                </>
              }
            />
          ) : null}
          <ConnectStep number={codex ? 2 : 1} title="Copy this code">
            <CopyRow className="w-48" value={attempt.userCode} label="code" />
          </ConnectStep>
          <ConnectStep
            number={codex ? 3 : 2}
            title={
              codex
                ? "Sign in to ChatGPT, select your workspace if prompted, and enter the code"
                : "Sign in and paste the code on the verification page"
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="base"
                onClick={() =>
                  window.open(attempt.verificationUri, "_blank", "noopener")
                }
              >
                Verification page
                <ArrowUpRightGlyph />
              </Button>
              <Button
                variant="solid"
                size="base"
                onClick={() =>
                  void navigator.clipboard
                    .writeText(attempt.verificationUri)
                    .then(
                      () =>
                        toast.success("Link copied", {
                          description: attempt.verificationUri,
                        }),
                      () => toast.error("Could not copy link"),
                    )
                }
              >
                <CopyGlyph />
                Copy link
              </Button>
            </div>
          </ConnectStep>
          <ConnectWait
            size="inline"
            status="pending"
            title={`Waiting for ${title}`}
            description="Only continue if you started this login in Capy"
            action={null}
          />
        </>
      )}
    </ConnectFrame>
  );
}
