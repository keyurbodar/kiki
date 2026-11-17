import { useState } from "react";
import { CardIcon } from "@/components/diff-cards/cards";
import { Alert, AlertDescription, AlertTitle } from "@/primitives/alert";
import { Button, ButtonIcon } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import {
  DETAIL_LINES,
  formatEventTime,
  formatRetryTime,
  lastLines,
  type SetupFailure,
  setupFailureDescription,
  setupFailureTitle,
  setupOutcomeLabel,
} from "./setup-failure";

export type SetupFailureAlertProps = {
  setup: SetupFailure;
  canRerun?: boolean;
  rerunning?: boolean;
  onRerunSetup?: () => void;
  onOpenSetup?: () => void;
};

export function SetupFailureAlert({
  setup,
  canRerun = false,
  rerunning = false,
  onRerunSetup,
  onOpenSetup,
}: SetupFailureAlertProps) {
  const detail = lastLines(setup.detail, DETAIL_LINES);
  const pending = setup.outcome === undefined;
  const retry =
    pending && setup.retryAtMs !== undefined
      ? `, retrying at ${formatRetryTime(new Date(setup.retryAtMs))}`
      : "";
  const showRerun = pending && canRerun;
  return (
    <div className="py-2">
      <Alert color="warning">
        <Icon name="exclamation-triangle" />
        <AlertTitle>{setupFailureTitle(setup)}</AlertTitle>
        <AlertDescription>{`${setupFailureDescription(setup)}${retry}`}</AlertDescription>
        {detail !== "" && (
          <div className="mt-2">
            <pre className="max-h-40 overflow-auto rounded-md bg-panel px-3 py-2 font-mono text-code-block leading-[1.5] whitespace-pre text-muted-foreground-1">
              <span className="block min-w-max">{detail}</span>
            </pre>
          </div>
        )}
        {(showRerun || onOpenSetup !== undefined) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {showRerun && (
              <Button
                intent={setup.stopped ? "accent" : "neutral"}
                size="sm"
                aria-busy={rerunning || undefined}
                disabled={rerunning}
                onClick={onRerunSetup}
              >
                <ButtonIcon>
                  <Icon name="rotate" />
                </ButtonIcon>
                Run Setup again
              </Button>
            )}
            {onOpenSetup !== undefined && (
              <Button size="sm" onClick={onOpenSetup}>
                Open in Setup
                <CardIcon name="arrow-up-right" className="size-(--icon-sm)" />
              </Button>
            )}
          </div>
        )}
      </Alert>
    </div>
  );
}

export type SetupFailureCardProps = SetupFailureAlertProps;

export function SetupFailureCard(props: SetupFailureCardProps) {
  const { setup } = props;
  const [open, setOpen] = useState(false);
  if (setup.outcome === undefined) return <SetupFailureAlert {...props} />;
  const recovered = setup.outcome.kind === "recovered";
  return (
    <div className="flex flex-col">
      <div className="flex min-h-7 w-full items-center gap-3 py-2">
        <span className="flex min-w-0 flex-1 justify-end">
          <span className="w-full border-t-hairline border-border-2" />
        </span>
        <Button
          variant="bare"
          size="xs"
          className="min-w-0"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {recovered ? (
            <Icon name="circle-check" className="size-(--icon-xs) shrink-0" />
          ) : (
            <Icon
              name="exclamation-triangle"
              className="size-(--icon-xs) shrink-0"
            />
          )}
          <span className="min-w-0 truncate">
            {`${setupOutcomeLabel(setup)} · ${formatEventTime(setup.outcome.at)}`}
          </span>
          <CardIcon
            name="chevron-right-small"
            className={["size-(--icon-xs) shrink-0", open && "rotate-90"]
              .filter(Boolean)
              .join(" ")}
          />
        </Button>
        <span className="flex min-w-0 flex-1">
          <span className="w-full border-t-hairline border-border-2" />
        </span>
      </div>
      {open && <SetupFailureAlert {...props} />}
    </div>
  );
}
