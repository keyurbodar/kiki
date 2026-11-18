import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/reactivity";
import { type ComponentProps, useState } from "react";
import { CircleDashedIcon, CrossMediumIcon } from "@/components/release";
import { idleAtom } from "@/data/atoms/idle";
import { useActiveOrgId } from "@/data/atoms/session";
import { Button } from "@/primitives/button";
import { Dialog, DialogContent } from "@/primitives/dialog";
import {
  dismissOnboardingAtom,
  onboardingKeys,
  onboardingStatusAtom,
  skipOnboardingStepAtom,
} from "./atoms";
import {
  onboardingStatus,
  type SetupStep,
  setupSteps,
  setupVisible,
} from "./setup-steps";

const SETUP_ROW_LIMIT = 4;

const idleStatus = idleAtom();

export type SidebarSetupCardProps = ComponentProps<"div">;

export function SidebarSetupCard({
  className,
  ...props
}: SidebarSetupCardProps) {
  const orgId = useActiveOrgId();
  const status = useAtomValue(
    orgId === undefined ? idleStatus : onboardingStatusAtom(orgId),
  );
  const [active, setActive] = useState<string | null>(null);
  const skip = useAtomSet(skipOnboardingStepAtom, { mode: "promise" });
  const dismiss = useAtomSet(dismissOnboardingAtom, { mode: "promise" });
  const parsed = AsyncResult.isSuccess(status)
    ? onboardingStatus(status.value)
    : undefined;
  const steps = parsed === undefined ? [] : setupSteps(parsed);
  const visible = steps.filter((step) => !step.done);
  const rows = visible.slice(0, SETUP_ROW_LIMIT);
  const next = visible[0];
  const show = setupVisible(parsed);
  const activeStep = steps.find((step) => step.id === active);
  if (!show || orgId === undefined) return null;

  const request = (action: "skip" | "dismiss", step?: string) => {
    const keys = onboardingKeys(orgId);
    if (action === "skip" && step !== undefined)
      skip({ params: { orgId, step }, reactivityKeys: keys }).catch(() => {});
    else dismiss({ params: { orgId }, reactivityKeys: keys }).catch(() => {});
    setActive(null);
  };
  const completed = steps.length - visible.length;
  const fraction = steps.length === 0 ? 0 : completed / steps.length;

  return (
    <div
      className={["shrink-0 px-2 pb-2", className].filter(Boolean).join(" ")}
      {...props}
    >
      <section
        aria-label="Finish setting up"
        className="rounded-(--radius-card) border-hairline border-(--card-hairline) bg-card px-2.5 pt-2 pb-2.5 shadow-card"
      >
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            Finish setting up
          </span>
          <Button
            data-track-owner="shared/sidebar-setup-card.tsx#SetupBody:Button[Dismiss setup]"
            variant="bare"
            size="icon-shrink"
            aria-label="Dismiss setup"
            onClick={() => request("dismiss")}
            className="-mr-1 shrink-0 p-1"
          >
            <CrossMediumIcon />
          </Button>
        </div>
        <div className="mt-1.5 flex min-w-0 items-center gap-2">
          <div
            className="h-1 flex-1 overflow-hidden rounded-full bg-border-2"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={steps.length}
            aria-valuenow={completed}
          >
            <div
              className="h-full bg-primary"
              style={{ width: `${fraction * 100}%` }}
            />
          </div>
          <span className="shrink-0 text-2xs text-muted-foreground-2 tabular-nums">
            {completed} of {steps.length}
          </span>
        </div>
        <ul className="-mx-1 mt-1.5 flex flex-col">
          {rows.map((step) => (
            <li key={step.id}>
              <button
                data-track-owner="shared/sidebar-setup-card.tsx#SetupBody:button.1"
                type="button"
                aria-haspopup="dialog"
                onClick={() => setActive(step.id)}
                className="flex h-6 w-full min-w-0 cursor-pointer items-center gap-2 rounded px-1 text-left text-xs outline-none select-none transition-colors duration-hover hover:bg-secondary focus-visible:outline-ring-inset"
              >
                <CircleDashedIcon className="size-(--icon-sm) shrink-0 text-muted-foreground-2" />
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                  {step.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {next?.action !== undefined && (
          <Button
            data-track-owner="shared/sidebar-setup-card.tsx#SetupBody:Button.1"
            className="mt-2 w-full"
            onClick={() => setActive(next.id)}
          >
            {next.action}
          </Button>
        )}
      </section>
      <Dialog
        open={active !== null}
        onOpenChange={(next) => !next && setActive(null)}
      >
        {activeStep !== undefined && (
          <SetupStepDialog
            step={activeStep}
            onAction={() => request("skip", activeStep.id)}
            onSkip={() => request("skip", activeStep.id)}
          />
        )}
      </Dialog>
    </div>
  );
}

export type SetupStepDialogProps = {
  step: SetupStep;
  onAction: () => void;
  onSkip: () => void;
};

export function SetupStepDialog({
  step,
  onAction,
  onSkip,
}: SetupStepDialogProps) {
  const ActionIcon = step.icon;
  return (
    <DialogContent className="p-4" nestedBackdrop>
      {step.image !== undefined && (
        <div className="flex flex-col gap-1">
          <img
            src={step.image.light}
            alt=""
            draggable={false}
            className="aspect-[3/2] w-full rounded-(--radius-card) border-hairline border-border-2 shadow-card block object-cover dark:hidden"
          />
          <img
            src={step.image.dark}
            alt=""
            draggable={false}
            className="aspect-[3/2] w-full rounded-(--radius-card) border-hairline border-border-2 shadow-card hidden object-cover dark:block"
          />
        </div>
      )}
      <h2 className="self-start px-1 pt-4 text-left text-base font-medium text-foreground">
        {step.label}
      </h2>
      {step.description !== undefined && (
        <p className="self-start px-1 pt-1 text-left text-sm text-muted-foreground-2">
          {step.description}
        </p>
      )}
      <div className="flex flex-col gap-2 px-1 pt-5">
        {step.action !== undefined && (
          <Button
            intent="accent"
            size="base"
            className="w-full"
            onClick={onAction}
          >
            <ActionIcon />
            {step.action}
          </Button>
        )}
        {!step.done && (
          <Button
            variant="ghost"
            size="base"
            className="w-full"
            onClick={onSkip}
          >
            Skip this step
          </Button>
        )}
      </div>
    </DialogContent>
  );
}
