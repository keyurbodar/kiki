import { type ReactNode, useEffect, useRef } from "react";
import { AppearanceMenu } from "@/components/appearance-menu";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import { Kbd } from "@/primitives/kbd";
import bite from "./art/bite.svg";
import build from "./art/build.svg";
import gift from "./art/gift.svg";
import peer from "./art/peer.svg";
import sail from "./art/sail.svg";
import sit from "./art/sit.svg";
import type { StepperEntry, StepperId } from "./flow";
import { ArrowLeftIcon, CheckIcon } from "./icons";

export const stepArt = { bite, sit, peer, sail, build, gift } as const;

export type StepArt = keyof typeof stepArt;

const chip =
  "rounded border-(length:--panel-border) border-border-2 bg-popover/80 px-2 py-1.5 backdrop-blur-sm";

const textEntry =
  "button, a, textarea, select, [contenteditable], [role=combobox], form input";

const choiceControl =
  "[role=radio], [role=checkbox], input[type=radio], input[type=checkbox]";

export const pressStepPrimary = (panel: HTMLElement, event: KeyboardEvent) => {
  if (event.key !== "Enter" || event.defaultPrevented || event.repeat) return;
  if (event.isComposing) return;
  const target = event.target instanceof Element ? event.target : null;
  const inside = target !== null && panel.contains(target);
  if (
    !inside &&
    target !== null &&
    target !== document.body &&
    target !== document.documentElement
  ) {
    return;
  }
  const slot = Array.from(panel.querySelectorAll("[data-step-primary]")).at(-1);
  const button = slot?.querySelector("button");
  if (button == null || button.disabled) return;
  const needsMod = slot?.getAttribute("data-step-key") === "mod-enter";
  if (needsMod !== (event.metaKey || event.ctrlKey)) return;
  if (
    !needsMod &&
    inside &&
    target.closest(choiceControl) === null &&
    target.closest(textEntry) !== null
  ) {
    return;
  }
  event.preventDefault();
  button.click();
};

export function OnboardingShell({
  onLogOut,
  stepper,
  wide = false,
  children,
}: {
  onLogOut?: () => void;
  stepper?: ReactNode;
  wide?: boolean;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (panel.current !== null) pressStepPrimary(panel.current, event);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <div
        aria-hidden
        className="fixed inset-0 bg-background [--panel-border:0.03125rem]"
      >
        <div
          className={`absolute inset-0 bg-background transition-opacity duration-slower ease-out-quint ${wide ? "opacity-90" : "opacity-0"}`}
        />
      </div>
      <div
        data-slot="onboarding-page"
        className={`fixed inset-0 z-(--z-dialog) flex h-dvh flex-col overflow-y-auto overscroll-contain px-4 pt-[calc(3.5rem+var(--safe-top))] pb-[calc(3rem+var(--safe-bottom))] [--panel-border:0.03125rem] ${wide ? "[scrollbar-gutter:stable_both-edges]" : ""}`}
      >
        <div
          ref={panel}
          role="dialog"
          aria-modal="false"
          aria-label="Onboarding"
          className={`relative m-auto flex w-full shrink-0 flex-col text-left outline-none [--table-lead-bg:var(--popover)] ${wide ? "max-w-4xl" : "max-h-full max-w-120"}`}
        >
          <div
            aria-hidden
            className={`absolute inset-0 rounded-(--radius-panel) border-(length:--panel-border) border-border-2 bg-popover shadow-(--sh-overlay) transition-opacity duration-base ease-out-quint ${wide ? "opacity-0" : ""}`}
          />
          <div className="relative m-(--panel-border) flex min-h-0 flex-col">
            <div
              tabIndex={-1}
              className={`flex flex-col overflow-x-hidden overflow-y-auto rounded-[calc(var(--radius-panel)-var(--panel-border))] outline-none ${wide ? "px-6" : "max-h-[calc(100dvh-7rem)] p-6"}`}
            >
              {children}
            </div>
          </div>
          {stepper == null || wide ? null : (
            <div className="pointer-events-none absolute inset-x-0 top-full flex justify-center pt-3">
              <div className={chip}>{stepper}</div>
            </div>
          )}
        </div>
        <div
          data-onboarding-controls=""
          className="pointer-events-none absolute inset-x-0 top-[calc(0.75rem+var(--safe-top))] flex items-center justify-between px-4"
        >
          <span />
          <div className="pointer-events-auto flex items-center gap-1">
            <AppearanceMenu data-track-owner="features/onboarding/onboarding-shell.tsx#OnboardingChrome:AppearanceMenuButton.1" />
            <Button
              data-track-owner="features/onboarding/onboarding-shell.tsx#OnboardingChrome:Button[Log out]"
              variant="ghost"
              size="sm"
              className={onLogOut === undefined ? "invisible" : undefined}
              onClick={() => onLogOut?.()}
            >
              Log out
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export function Stepper({
  steps,
  current,
}: {
  steps: ReadonlyArray<StepperEntry>;
  current: StepperId;
}) {
  const index = steps.findIndex((step) => step.id === current);
  return (
    <ol
      aria-label={`Step ${index + 1} of ${steps.length}`}
      className="flex items-center gap-1.5"
    >
      {steps.map((step, position) => (
        <li
          key={step.id}
          aria-current={position === index ? "step" : undefined}
          aria-label={step.label}
          className={`size-1.5 rounded-full transition-colors duration-fast ease-out-quint ${
            position === index
              ? "bg-foreground"
              : position < index
                ? "bg-muted-foreground-3"
                : "bg-border-3"
          }`}
        />
      ))}
    </ol>
  );
}

export function StepBody({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-6">{children}</div>;
}

export function StepHeader({
  art,
  centered = false,
  title,
  description,
  onBreadcrumb,
}: {
  art?: StepArt;
  centered?: boolean;
  title: ReactNode;
  description?: ReactNode;
  onBreadcrumb?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {art === undefined ? null : (
        <img
          src={stepArt[art]}
          alt=""
          draggable={false}
          className={`pointer-events-none h-20 w-auto select-none ${centered ? "self-center" : "self-start"}`}
        />
      )}
      {onBreadcrumb === undefined ? null : (
        <Button
          data-track-owner="features/onboarding/onboarding-shell.tsx#StepHeader:Button[Recommended]"
          variant="ghost"
          size="sm"
          className="-ml-2 self-start"
          onClick={onBreadcrumb}
        >
          <ArrowLeftIcon className="size-(--icon-sm)" />
          Recommended
        </Button>
      )}
      <div className="flex flex-col">
        <h1
          className={`text-lg font-medium text-foreground ${centered ? "self-center text-center" : "self-start"}`}
        >
          {title}
        </h1>
        {description === undefined ? null : (
          <p
            className={`text-sm text-muted-foreground-1 ${centered ? "text-center" : ""}`}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

const isMac = () =>
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad/u.test(navigator.platform);

export function StepKey({
  mod = false,
  fill = true,
}: {
  mod?: boolean;
  fill?: boolean;
}) {
  const keys = mod ? [isMac() ? "⌘" : "Ctrl", "↵"] : ["↵"];
  return (
    <span className="flex items-center gap-0.5 pointer-coarse:hidden">
      {keys.map((key) => (
        <Kbd key={key} variant={fill ? "onFill" : "chip"}>
          {key}
        </Kbd>
      ))}
    </span>
  );
}

export function StepFooter({
  onBack,
  showBack = true,
  note,
  leading,
  secondary,
  primary,
  primaryKey = "enter",
  wide = false,
  stepper,
}: {
  onBack?: () => void;
  showBack?: boolean;
  note?: ReactNode;
  leading?: ReactNode;
  secondary?: ReactNode;
  primary?: ReactNode;
  primaryKey?: "enter" | "mod-enter";
  wide?: boolean;
  stepper?: ReactNode;
}) {
  return (
    <div
      className={
        wide
          ? "flex flex-col gap-4 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-3"
          : "sticky -bottom-6 -mx-6 -mb-6 flex flex-col gap-4 bg-popover px-6 pb-6 before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:h-6 before:bg-linear-to-t before:from-popover before:to-transparent"
      }
    >
      {wide ? (
        <div className="flex justify-center md:col-start-2 md:row-start-1">
          {note ??
            (stepper == null ? null : <div className={chip}>{stepper}</div>)}
        </div>
      ) : (
        note
      )}
      <div
        className={`flex items-center justify-between gap-3 ${wide ? "md:contents" : ""}`}
      >
        {leading !== undefined ? (
          <div className="-ml-2.5 md:col-start-1 md:row-start-1 md:justify-self-start">
            {leading}
          </div>
        ) : onBack !== undefined && showBack ? (
          <Button
            data-track-owner="features/onboarding/onboarding-shell.tsx#StepFooter:Button.1"
            variant="ghost"
            size="base"
            className="-ml-2.5 md:col-start-1 md:row-start-1 md:justify-self-start"
            onClick={onBack}
          >
            <ArrowLeftIcon className="size-(--icon-sm)" />
            <span className="max-sm:sr-only">Back</span>
          </Button>
        ) : (
          <span />
        )}
        <div className="flex shrink-0 items-center gap-2 md:col-start-3 md:row-start-1 md:justify-self-end">
          {secondary}
          <span
            data-step-primary=""
            data-step-key={primaryKey}
            className="contents"
          >
            {primary}
          </span>
        </div>
      </div>
    </div>
  );
}

export function OptionRow({
  role = "radio",
  checked = false,
  tabStop = false,
  onSelect,
  icon,
  label,
  description,
  disabled = false,
  layout = "row",
  trackOwner = "features/onboarding/onboarding-shell.tsx#OptionRow:button[onClick=onSelect]",
}: {
  role?: "radio" | "checkbox";
  checked?: boolean;
  tabStop?: boolean;
  onSelect: () => void;
  icon?: ReactNode;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  layout?: "row" | "tile";
  trackOwner?: string;
}) {
  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: role is always radio or checkbox, both of which take aria-checked
    <button
      data-track-owner={trackOwner}
      data-layout={layout}
      type="button"
      role={role}
      aria-checked={checked}
      disabled={disabled}
      tabIndex={role === "checkbox" || checked || tabStop ? 0 : -1}
      onClick={onSelect}
      className={`flex w-full cursor-pointer gap-3 p-4 text-left outline-none transition-colors duration-fast hover:bg-card-hover focus-visible:outline-ring-inset disabled:pointer-events-none disabled:opacity-55 ${
        layout === "tile"
          ? "relative flex-col items-start rounded-(--radius-card) border-(length:--panel-border) border-border-2 bg-card aria-checked:border-foreground"
          : "min-h-15 items-center"
      }`}
    >
      {icon === undefined ? null : (
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-secondary text-foreground [&_svg]:size-4">
          {icon}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium text-foreground">
          {label}
        </span>
        {description === undefined ? null : (
          <span className="text-xs font-normal text-muted-foreground-2">
            {description}
          </span>
        )}
      </span>
      <span
        className={`grid size-5 shrink-0 place-items-center ${layout === "tile" ? "absolute top-3 right-3" : ""}`}
      >
        {checked ? <CheckIcon className="size-(--icon-sm)" /> : null}
      </span>
    </button>
  );
}

export function StepRow({
  icon,
  label,
  description,
  onClick,
  children,
  trackOwner,
}: {
  icon?: ReactNode;
  label: ReactNode;
  description?: ReactNode;
  onClick?: () => void;
  children?: ReactNode;
  trackOwner?: string;
}) {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: the row mirrors its trailing button, which stays the keyboard target
    // biome-ignore lint/a11y/useKeyWithClickEvents: the trailing button handles keyboard activation
    <div
      data-slot="settings-row"
      data-track-owner={trackOwner}
      onClick={onClick}
      className={`flex min-h-15 items-center gap-3 p-4 ${onClick === undefined ? "" : "cursor-pointer transition-colors duration-fast hover:bg-card-hover"}`}
    >
      {icon === undefined ? null : (
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-secondary text-foreground [&_svg]:size-4">
          {icon}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description === undefined ? null : (
          <span className="text-xs font-normal text-muted-foreground-2">
            {description}
          </span>
        )}
      </span>
      {children === undefined ? null : (
        // biome-ignore lint/a11y/noStaticElementInteractions: stops the row click so the trailing control acts alone
        // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard events never bubble a row click
        <div
          className="flex shrink-0 items-center gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function RowValue({
  children,
  chevron = false,
}: {
  children: ReactNode;
  chevron?: boolean;
}) {
  return (
    <span className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground-1">
      {children}
      {chevron ? <Icon name="chevron-right" size="sm" /> : null}
    </span>
  );
}

const skeletonRows = ["first", "second", "third", "fourth", "fifth"];

export function StepSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading the next step"
      aria-busy
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-1">
        <div className="h-5 w-56 rounded bg-secondary" />
        <div className="h-3 w-72 rounded bg-secondary" />
      </div>
      <div className="flex flex-col gap-2">
        {skeletonRows.slice(0, rows).map((row) => (
          <div
            key={row}
            className="h-15 rounded-(--radius-card) bg-secondary"
          />
        ))}
      </div>
      <div className="flex justify-end">
        <div className="h-(--h-control-base) w-24 rounded-md bg-secondary" />
      </div>
    </div>
  );
}

export function FeatureList({
  items,
}: {
  items: ReadonlyArray<{ icon: ReactNode; label: string; description: string }>;
}) {
  return (
    <ul className="flex flex-col gap-4">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-secondary text-foreground [&_svg]:size-4">
            {item.icon}
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">
              {item.label}
            </span>
            <span className="text-xs font-normal text-muted-foreground-2">
              {item.description}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function PrimaryLabel({
  busy,
  busyLabel,
  children,
}: {
  busy: boolean;
  busyLabel: string;
  children: ReactNode;
}) {
  return busy ? <span aria-live="polite">{busyLabel}</span> : <>{children}</>;
}
