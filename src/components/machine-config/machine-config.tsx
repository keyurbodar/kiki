import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  MENU_CHECK,
  MENU_LABEL,
  MENU_LEADING,
  MENU_TRAILING,
} from "@/components/composer/menu-surface";
import { deviceNoun } from "@/components/desktop-quit-dialog/quit-view";
import {
  formatMachine,
  type MachineSize,
  machineSizes,
  type PlanTier,
  tierLabels,
  tierLimits,
} from "@/components/plan-picker/plan-catalog";
import { desktopBridge } from "@/lib/desktop-bridge";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import {
  ResponsiveMenu,
  ResponsiveMenuContent,
  ResponsiveMenuItem,
  ResponsiveMenuSeparator,
  ResponsiveMenuSub,
  ResponsiveMenuTrigger,
} from "@/primitives/responsive-menu";

/** What a size costs an hour, as Capy prints it in the row's trailing slot. */
const pricePerHour: Record<MachineSize, number> = {
  small: 0.1,
  medium: 0.2,
  large: 0.4,
  ultra: 0.8,
  hyper: 1.6,
  bigguy: 3.2,
};

const priceLabel = (price: number) => `$${price.toFixed(2)}/hr`;

export type MachineConfigVariant = "default" | "minimal";

const promptVariants: readonly MachineConfigVariant[] = ["default", "minimal"];

const promptVariantLabels: Record<MachineConfigVariant, string> = {
  default: "Default",
  minimal: "Minimal",
};

export const machineConfigLabel = (organize: ReactNode | undefined) =>
  organize === undefined ? "Machine configuration" : "Thread configuration";

const sizeIndex = (size: MachineSize) => machineSizes.indexOf(size);

/** A size string from the wire, when the catalog knows it. */
export const toMachineSize = (
  value: string | null | undefined,
): MachineSize | null =>
  value !== null &&
  value !== undefined &&
  (machineSizes as ReadonlyArray<string>).includes(value)
    ? (value as MachineSize)
    : null;

const planOrder: readonly PlanTier[] = ["lite", "pro", "max"];

/** The cheapest plan whose limit reaches a size; its name rides on the lock chip. */
const unlockingTier = (size: MachineSize): PlanTier =>
  planOrder.find(
    (tier) => sizeIndex(tierLimits[tier].maxMachineSize) >= sizeIndex(size),
  ) ?? "max";

/** A project default the org may no longer pick falls back to the largest it may. */
const clampSize = (
  size: MachineSize,
  maxSize: MachineSize | null,
): MachineSize => {
  if (maxSize === null || sizeIndex(maxSize) < 0) return size;
  return sizeIndex(size) <= sizeIndex(maxSize) ? size : maxSize;
};

/** Sizes above the plan's largest stay listed as locked rows that sell the plan. */
const lockOf = (
  size: MachineSize,
  maxSize: MachineSize | null,
): PlanTier | undefined =>
  maxSize === null ||
  sizeIndex(maxSize) < 0 ||
  sizeIndex(size) <= sizeIndex(maxSize)
    ? undefined
    : unlockingTier(size);

export type MachineConfigWorktree = {
  fromOrigin: boolean;
  onFromOriginChange: (fromOrigin: boolean) => void;
};

export type MachineConfigPromptVariant = {
  variant: MachineConfigVariant;
  onVariantChange: (variant: MachineConfigVariant) => void;
};

export type MachineConfigMenuProps = {
  /** Where the thread runs; the cloud branch carries the machine size and project rows. */
  runsOn?: "cloud" | "device";
  /** The size this thread boots at; null inherits the project's default. */
  size?: MachineSize | null;
  /** The project's default size, which the thread inherits until it picks its own. */
  defaultSize?: MachineSize | null;
  /** The largest size the org may pick; larger ones are locked and the default clamps. */
  maxSize?: MachineSize | null;
  /** Whether the org has the Big Guy machine; the row is hidden without it. */
  bigGuyAvailable?: boolean;
  /** Opens the upgrade flow for the plan a locked size needs. */
  onUpgrade?: (tier: PlanTier) => void;
  /** The project whose setup and environment variables the menu links to. */
  projectId?: string;
  onSizeChange?: (size: MachineSize | null) => void;
  /** Device runs pick the worktree's base; the submenu is absent without it. */
  worktree?: MachineConfigWorktree;
  /** The composer's prompt variant, when the surface offers one. */
  promptVariant?: MachineConfigPromptVariant;
  /** Rows a call site adds for its own thread settings, after MCP servers. */
  organize?: ReactNode;
  organizeActive?: boolean;
  /** The menu's first section, when the call site opens it on a section. */
  access?: ReactNode;
  defaultOpen?: false | "machine-size" | "prompt-variant";
};

export type MachineConfigProps = MachineConfigMenuProps;

/** The composer footer's machine menu: size, worktree base, setup and MCP links. */
export function MachineConfigMenu({
  runsOn = "cloud",
  size,
  defaultSize,
  maxSize = null,
  bigGuyAvailable = false,
  onUpgrade,
  projectId,
  onSizeChange,
  worktree,
  promptVariant,
  organize,
  organizeActive = false,
  access,
  defaultOpen = false,
}: MachineConfigMenuProps) {
  const navigate = useNavigate();
  const chosen = size ?? null;
  const inherited =
    defaultSize === undefined || defaultSize === null
      ? undefined
      : clampSize(defaultSize, maxSize);
  const inheritedLabel =
    inherited === undefined ? undefined : formatMachine(inherited);
  const overridden =
    chosen !== null ||
    organizeActive ||
    worktree?.fromOrigin === false ||
    (promptVariant !== undefined && promptVariant.variant !== "default");
  const shownSizes = machineSizes.filter(
    (candidate) => candidate !== "bigguy" || bigGuyAvailable,
  );
  const openProject = (
    to:
      | "/settings/projects/$projectId/dev-environment"
      | "/settings/projects/$projectId/environment-variables",
  ) => {
    if (projectId !== undefined) void navigate({ to, params: { projectId } });
  };
  const noun = deviceNoun(desktopBridge()?.platform);

  const cloudRows =
    runsOn !== "cloud" ? null : (
      <>
        <ResponsiveMenuSub
          icon={<Icon name="server-2" />}
          label="Machine size"
          value={
            chosen === null
              ? (inheritedLabel ?? "Default")
              : formatMachine(chosen)
          }
          valueClassName="max-w-none"
          contentClassName="w-72"
          defaultOpen={defaultOpen === "machine-size"}
        >
          <ResponsiveMenuItem onClick={() => onSizeChange?.(null)}>
            <span className={MENU_LABEL}>Default</span>
            <span className={MENU_TRAILING}>
              {inheritedLabel}
              {chosen === null ? (
                <Icon name="checkmark-1" className={MENU_CHECK} />
              ) : null}
            </span>
          </ResponsiveMenuItem>
          <ResponsiveMenuSeparator />
          {shownSizes.map((candidate) => {
            const lock = lockOf(candidate, maxSize);
            return (
              <ResponsiveMenuItem
                key={candidate}
                disabled={lock !== undefined && onUpgrade === undefined}
                onClick={() =>
                  lock === undefined
                    ? onSizeChange?.(candidate)
                    : onUpgrade?.(lock)
                }
              >
                <span className={`${MENU_LABEL} tabular-nums`}>
                  {formatMachine(candidate)}
                </span>
                <span className={MENU_TRAILING}>
                  <span className="tabular-nums">
                    {priceLabel(pricePerHour[candidate])}
                  </span>
                  {lock === undefined ? null : (
                    <Badge size="xs" className="shrink-0">
                      <Icon name="lock" />
                      <span className="sr-only">Needs </span>
                      {tierLabels[lock]}
                    </Badge>
                  )}
                  {candidate === chosen ? (
                    <Icon name="checkmark-1" className={MENU_CHECK} />
                  ) : null}
                </span>
              </ResponsiveMenuItem>
            );
          })}
        </ResponsiveMenuSub>
        <ResponsiveMenuSeparator />
        <ResponsiveMenuItem
          disabled={projectId === undefined}
          onClick={() =>
            openProject("/settings/projects/$projectId/dev-environment")
          }
        >
          <span className={MENU_LEADING}>
            <Icon name="console" />
          </span>
          Setup and snapshots
        </ResponsiveMenuItem>
        <ResponsiveMenuItem
          disabled={projectId === undefined}
          onClick={() =>
            openProject("/settings/projects/$projectId/environment-variables")
          }
        >
          <span className={MENU_LEADING}>
            <Icon name="key-1" />
          </span>
          Environment variables
        </ResponsiveMenuItem>
      </>
    );

  return (
    <ResponsiveMenu defaultOpen={defaultOpen !== false}>
      <ResponsiveMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative"
            aria-label={machineConfigLabel(organize)}
          >
            <Icon name="settings-slider-ver" />
            {overridden ? (
              <span
                aria-hidden
                className="absolute top-1 right-1 size-1.5 rounded-full bg-primary"
              />
            ) : null}
          </Button>
        }
      />
      <ResponsiveMenuContent className="w-80">
        {access}
        {cloudRows}
        {worktree === undefined ? null : (
          <>
            <ResponsiveMenuSub
              icon={<Icon name="folder-add-left" />}
              label="Worktree base"
              value={worktree.fromOrigin ? "Origin" : "Local"}
              contentClassName="w-72"
            >
              <ResponsiveMenuItem
                onClick={() => worktree.onFromOriginChange(true)}
              >
                <span className={MENU_LABEL}>Origin</span>
                <span className={MENU_TRAILING}>
                  Latest on the remote
                  {worktree.fromOrigin ? (
                    <Icon name="checkmark-1" className={MENU_CHECK} />
                  ) : null}
                </span>
              </ResponsiveMenuItem>
              <ResponsiveMenuItem
                onClick={() => worktree.onFromOriginChange(false)}
              >
                <span className={MENU_LABEL}>Local</span>
                <span className={MENU_TRAILING}>
                  {`As checked out on this ${noun}`}
                  {worktree.fromOrigin ? null : (
                    <Icon name="checkmark-1" className={MENU_CHECK} />
                  )}
                </span>
              </ResponsiveMenuItem>
            </ResponsiveMenuSub>
            <ResponsiveMenuSeparator />
          </>
        )}
        <ResponsiveMenuItem
          onClick={() => void navigate({ to: "/settings/mcp" })}
        >
          <span className={MENU_LEADING}>
            <Icon name="puzzle" />
          </span>
          MCP servers
        </ResponsiveMenuItem>
        {organize === undefined ? null : (
          <>
            <ResponsiveMenuSeparator />
            {organize}
          </>
        )}
        {promptVariant === undefined ? null : (
          <>
            <ResponsiveMenuSeparator />
            <ResponsiveMenuSub
              icon={<Icon name="lab" />}
              label="Prompt variant"
              value={promptVariantLabels[promptVariant.variant]}
              contentClassName="w-56"
              defaultOpen={defaultOpen === "prompt-variant"}
            >
              {promptVariants.map((variant) => (
                <ResponsiveMenuItem
                  key={variant}
                  onClick={() => promptVariant.onVariantChange(variant)}
                >
                  <span className={MENU_LABEL}>
                    {promptVariantLabels[variant]}
                  </span>
                  <span className={MENU_TRAILING}>
                    {variant === promptVariant.variant ? (
                      <Icon name="checkmark-1" className={MENU_CHECK} />
                    ) : null}
                  </span>
                </ResponsiveMenuItem>
              ))}
            </ResponsiveMenuSub>
          </>
        )}
      </ResponsiveMenuContent>
    </ResponsiveMenu>
  );
}

/** The contract name for the same menu. */
export const MachineConfig = MachineConfigMenu;
