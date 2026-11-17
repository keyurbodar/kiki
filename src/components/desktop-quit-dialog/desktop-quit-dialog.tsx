import { Field } from "@base-ui/react/field";
import { useAtomValue } from "@effect/atom-react";
import { AsyncResult, Atom } from "effect/reactivity";
import {
  type ComponentProps,
  type CSSProperties,
  useEffect,
  useState,
} from "react";
import { ApiClient } from "@/data/client/ApiClient";
import {
  type DesktopQuitDevice,
  type DesktopQuitRequest,
  desktopBridge,
} from "@/lib/desktop-bridge";
import { Button } from "@/primitives/button";
import { Checkbox } from "@/primitives/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/primitives/dialog";
import { Label } from "@/primitives/label";
import {
  type DeviceNoun,
  type DeviceThreads,
  deviceNoun,
  QUIT_THREAD_LIMIT,
  type QuitThread,
  type QuitView,
  quitDescription,
  quitTitle,
  quitView,
  readQuitThreads,
  shortAge,
} from "./quit-view";

export type DesktopQuitDialogProps = ComponentProps<"div">;

type Answer = (quit: boolean, askWhenIdle: boolean) => void;

const activeThreadsAtom = Atom.family((key: string) => {
  const { orgId, deviceId } = JSON.parse(key) as DesktopQuitDevice;
  return ApiClient.query("devices", "activeThreads", {
    params: { orgId, deviceId },
    reactivityKeys: [`jam:${orgId}`],
  });
});

const quitViewAtom = Atom.family((devicesKey: string) =>
  Atom.make((get) =>
    quitView(
      (JSON.parse(devicesKey) as DesktopQuitDevice[]).map(
        (device): DeviceThreads => {
          const result = get(
            activeThreadsAtom(
              JSON.stringify({
                orgId: device.orgId,
                deviceId: device.deviceId,
              }),
            ),
          );
          if (AsyncResult.isSuccess(result)) {
            return { kind: "success", threads: readQuitThreads(result.value) };
          }
          return AsyncResult.isFailure(result)
            ? { kind: "failure" }
            : { kind: "loading" };
        },
      ),
    ),
  ),
);

export function DesktopQuitDialog({ className }: DesktopQuitDialogProps) {
  const bridge = desktopBridge()?.quit;
  const [request, setRequest] = useState<DesktopQuitRequest>();
  const [askWhenIdle, setAskWhenIdle] = useState(true);

  useEffect(() => {
    if (bridge === undefined) return;
    return bridge.subscribe((next) => {
      setAskWhenIdle(true);
      setRequest(next);
    });
  }, [bridge]);

  if (bridge === undefined || request === undefined) return null;
  const answer: Answer = (quit, ask) => {
    setRequest(undefined);
    bridge.answer({ quit, askWhenIdle: ask });
  };
  return (
    <QuitRequest
      request={request}
      askWhenIdle={askWhenIdle}
      setAskWhenIdle={setAskWhenIdle}
      answer={answer}
      className={className}
    />
  );
}

function QuitRequest({
  request,
  ...props
}: Omit<QuitDialogViewProps, "view" | "noun"> & {
  request: DesktopQuitRequest;
}) {
  const view = useAtomValue(quitViewAtom(JSON.stringify(request.devices)));
  const skip = view.tier === "idle" && !request.askWhenIdle;
  const { answer } = props;
  useEffect(() => {
    if (skip) answer(true, false);
  }, [skip, answer]);
  if (skip) return null;
  return (
    <QuitDialogView
      view={view}
      noun={deviceNoun(desktopBridge()?.platform ?? navigator.platform)}
      {...props}
    />
  );
}

export type QuitDialogViewProps = {
  view: QuitView;
  noun: DeviceNoun;
  askWhenIdle: boolean;
  setAskWhenIdle: (askWhenIdle: boolean) => void;
  answer: Answer;
  now?: Date;
  className?: string;
};

export function QuitDialogView({
  view,
  noun,
  askWhenIdle,
  setAskWhenIdle,
  answer,
  now,
  className,
}: QuitDialogViewProps) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) answer(false, view.tier !== "idle" || askWhenIdle);
      }}
    >
      <DialogContent
        className={["max-w-sm", className].filter(Boolean).join(" ")}
      >
        <DialogHeader>
          <DialogTitle>{quitTitle(view, noun)}</DialogTitle>
          <DialogDescription>{quitDescription(view, noun)}</DialogDescription>
        </DialogHeader>
        {view.tier === "idle" ? (
          <>
            <DialogBody>
              <Field.Root>
                <Label className="gap-2 text-xs font-normal text-muted-foreground-1">
                  <Checkbox
                    checked={!askWhenIdle}
                    onCheckedChange={(checked) =>
                      setAskWhenIdle(checked !== true)
                    }
                  />
                  Don't ask when nothing is running
                </Label>
              </Field.Root>
            </DialogBody>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => answer(false, askWhenIdle)}
              >
                Cancel
              </Button>
              <Button
                intent="accent"
                autoFocus
                onClick={() => answer(true, askWhenIdle)}
              >
                Quit
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            {view.tier === "unknown" ? (
              <DialogBody />
            ) : (
              <DialogBody className="gap-0 py-3">
                {view.tier === "busy" ? (
                  <>
                    {view.threads.slice(0, QUIT_THREAD_LIMIT).map((thread) => (
                      <QuitThreadRow
                        key={thread.id}
                        thread={thread}
                        now={now ?? new Date()}
                      />
                    ))}
                    {view.threads.length > QUIT_THREAD_LIMIT ? (
                      <div className="-mx-2 px-2 py-1.5 text-xs text-muted-foreground-1">
                        {view.threads.length - QUIT_THREAD_LIMIT} more
                      </div>
                    ) : null}
                  </>
                ) : (
                  <QuitSkeleton
                    label={`Checking what's running on this ${noun}`}
                  />
                )}
              </DialogBody>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => answer(true, true)}>
                Quit Anyway
              </Button>
              <Button
                intent="accent"
                autoFocus
                onClick={() => answer(false, true)}
              >
                Keep Running
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function QuitThreadRow({ thread, now }: { thread: QuitThread; now: Date }) {
  return (
    <div className="-mx-2 flex flex-col gap-0.5 rounded px-2 py-1.5">
      <span className="flex min-w-0 items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          {thread.title ?? "Untitled thread"}
        </span>
      </span>
      <span className="flex min-w-0 items-center gap-1 text-2xs font-normal whitespace-nowrap text-muted-foreground-2">
        {shortAge(thread.sortActivityAt, now)}
        {thread.pullCount > 0 ? (
          <>
            <span aria-hidden>·</span>
            <span className="flex items-center gap-1">
              {thread.pullCount === 1 ? "1 PR" : `${thread.pullCount} PRs`}
            </span>
          </>
        ) : null}
      </span>
    </div>
  );
}

const boneStyle = {
  "--shimmer-surface-base": "var(--card-hover)",
  "--shimmer-surface-gradient": "var(--gradient-skeleton)",
} as CSSProperties;

function QuitSkeleton({ label }: { label: string }) {
  return (
    <div className="opacity-100 transition-opacity delay-(--duration-base) duration-base ease-out-quint starting:opacity-0">
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className="sr-only"
      >
        {label}
      </div>
      <div className="animate-skeleton-pulse h-full motion-reduce:animate-none">
        {[0, 1].map((index) => (
          <div key={index} className="-mx-2 flex flex-col gap-1.5 px-2 py-2">
            <div
              className={`shimmer-surface shimmer-surface-motion-safe rounded ${index === 0 ? "h-3.5 w-48" : "h-3.5 w-36"}`}
              style={boneStyle}
            />
            <div
              className="shimmer-surface shimmer-surface-motion-safe rounded h-2.5 w-24"
              style={boneStyle}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
