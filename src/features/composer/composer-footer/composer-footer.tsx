import { cx } from "class-variance-authority";
import {
  type ComponentProps,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import { DotGridIcon } from "@/primitives/dot-grid-icon";
import { Icon } from "@/primitives/icon";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuRow,
  MenuSeparator,
  MenuSub,
  MenuSubTrigger,
  MenuTrigger,
} from "@/primitives/menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { MeterBar } from "../context-meter/meter-bar";
import { FooterTrigger, StatusDot } from "./footer-trigger";
import {
  allocationSummary,
  branchRows,
  type FooterBranch,
  type FooterDevice,
  formatDuration,
  formatElapsed,
  formatGb,
  handoffLabel,
  type MachineAllocation,
  machineTriggerLabel,
  type ResourceSample,
  type RunningHandoff,
  type SetupPhaseSummary,
  type SetupStep,
  type StatusColor,
  setupPhaseTitle,
  summarizeSetup,
} from "./machine";

const menuIconSlot =
  "flex size-(--icon-sm) shrink-0 items-center justify-center text-icon-muted in-data-[intent=danger]:text-destructive";
const menuLabel =
  "mask-fade-r min-w-0 flex-1 overflow-hidden whitespace-nowrap";
const menuTrailing =
  "ml-auto flex shrink-0 items-center gap-1.5 text-sm font-normal text-muted-foreground-1";
const menuNote =
  "block min-w-0 truncate px-2 py-1.5 text-xs font-normal text-muted-foreground-2";

function Spinner({ label }: { label: string }) {
  return <DotGridIcon size="inherit" aria-label={label} role="status" />;
}

/** Ticks once a second from `since` (ms epoch); null when not running. */
function useElapsedSeconds(since: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (since === null) return;
    const id = setInterval(() => setNow(Date.now()), 1e3);
    return () => clearInterval(id);
  }, [since]);
  return since === null ? null : Math.max(0, Math.floor((now - since) / 1e3));
}

function Skeleton({ className }: { className: string }) {
  return (
    <span
      className={cx(
        "shimmer-surface shimmer-surface-motion-safe block rounded",
        className,
      )}
    />
  );
}

function RichRow({
  label,
  description,
  trailing,
}: {
  label: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
}) {
  const rich = description != null;
  return (
    <MenuRow
      density="rich"
      className="flex min-w-0 flex-1 items-center gap-2 text-left"
    >
      <span className="flex min-w-0 flex-1 flex-col justify-center">
        <span className="line-clamp-1 min-w-0 text-sm font-normal text-foreground">
          {label}
        </span>
        {rich && (
          <span className="line-clamp-1 min-w-0 text-xs font-normal text-muted-foreground-2">
            {description}
          </span>
        )}
      </span>
      {trailing != null && (
        <span className={cx(menuTrailing, rich && "h-5 self-start")}>
          {trailing}
        </span>
      )}
    </MenuRow>
  );
}

function SetupPhaseRow({ summary }: { summary: SetupPhaseSummary }) {
  const elapsed = useElapsedSeconds(
    summary.status === "running" ? summary.startedAt : null,
  );
  return (
    <div className="flex items-center justify-between gap-2 text-xs font-normal">
      <span className="min-w-0 truncate text-muted-foreground-2">
        {setupPhaseTitle(summary)}
      </span>
      <span
        className={cx(
          "tabular-nums",
          summary.status === "error"
            ? "text-destructive"
            : summary.status === "not_ready"
              ? "text-warning-fg"
              : "text-muted-foreground",
        )}
      >
        {summary.status === "error"
          ? "Failed"
          : summary.status === "running"
            ? formatElapsed(elapsed ?? 0)
            : summary.status === "queued"
              ? "Queued"
              : summary.status === "not_ready"
                ? "Not ready"
                : summary.durationMs === null
                  ? "Done"
                  : formatDuration(summary.durationMs)}
      </span>
    </div>
  );
}

/** Setup progress per phase, from Capy's `SetupSteps`. */
export function SetupSteps({ steps }: { steps: ReadonlyArray<SetupStep> }) {
  return (
    <div className="flex flex-col gap-1">
      {summarizeSetup(steps).map((summary) => (
        <SetupPhaseRow key={summary.phase} summary={summary} />
      ))}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-xs font-normal">
      <span className="text-muted-foreground-2">{label}</span>
      <span className="text-muted-foreground tabular-nums">{value}</span>
    </div>
  );
}

/** Live CPU, memory and disk for a cloud machine. */
export function MachineResources({
  samples,
}: {
  samples: ReadonlyArray<ResourceSample>;
}) {
  const latest = samples.at(-1);
  if (latest === undefined) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <StatRow label="CPU" value={`${Math.round(latest.cpuUsedPct)}%`} />
      </div>
      <div className="flex flex-col gap-1">
        <StatRow
          label="Memory"
          value={`${formatGb(latest.memoryUsedBytes)} of ${formatGb(latest.memoryTotalBytes)} GB`}
        />
      </div>
      {latest.diskUsedBytes !== null && latest.diskTotalBytes !== null && (
        <div className="flex flex-col gap-1">
          <StatRow
            label="Disk"
            value={`${formatGb(latest.diskUsedBytes)} of ${formatGb(latest.diskTotalBytes)} GB`}
          />
          <MeterBar
            segments={[
              {
                fraction:
                  latest.diskTotalBytes > 0
                    ? latest.diskUsedBytes / latest.diskTotalBytes
                    : 0,
                tone: "primary",
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}

function WaitingForSetup({
  handoff,
  deviceName,
}: {
  handoff: RunningHandoff;
  deviceName: string;
}) {
  const elapsed = useElapsedSeconds(handoff.createdAt.getTime());
  return (
    <div className="flex flex-col gap-0.5 pb-1 text-xs font-normal">
      <span className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-foreground">
          Waiting for Setup
        </span>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          {formatElapsed(elapsed ?? 0)}
        </span>
      </span>
      <span className="text-muted-foreground-2">
        Moves to {deviceName} when the cloud machine finishes setting up
      </span>
    </div>
  );
}

export type MoveTarget = {
  id: string;
  name: string;
  connected: boolean;
  /** Right-hand detail: last seen, hostname, owner or workspace. */
  detail?: string;
};

export type DeviceTargetsSubProps = {
  label: string;
  targets: ReadonlyArray<MoveTarget>;
  starting: string | null;
  note: string | null;
  disabled: boolean;
  onPick: (target: MoveTarget) => void;
};

/** "Move to a device" submenu with online and offline devices. */
export function DeviceTargetsSub({
  label,
  targets,
  starting,
  note,
  disabled,
  onPick,
}: DeviceTargetsSubProps) {
  const online = targets.filter((target) => target.connected);
  const offline = targets.filter((target) => !target.connected);
  const row = (target: MoveTarget) => (
    <MenuItem
      key={target.id}
      disabled={disabled || !target.connected || starting !== null}
      onClick={() => onPick(target)}
    >
      <span className={menuIconSlot}>
        {starting === target.id ? (
          <Spinner label="Starting" />
        ) : (
          <Icon name="macbook" size="sm" />
        )}
      </span>
      <span className={menuLabel}>{target.name}</span>
      {target.detail !== undefined && (
        <span className={menuTrailing}>{target.detail}</span>
      )}
    </MenuItem>
  );
  return (
    <MenuSub>
      <MenuSubTrigger>
        <span className={menuIconSlot}>
          {starting === null ? (
            <Icon name="devices" size="sm" />
          ) : (
            <Spinner label="Starting" />
          )}
        </span>
        <span className={menuLabel}>{label}</span>
      </MenuSubTrigger>
      <MenuContent className="w-auto min-w-64 max-w-96">
        {note !== null && <span className={menuNote}>{note}</span>}
        {online.length === 0 ? (
          <MenuItem disabled>
            <span className={menuLabel}>No devices online</span>
          </MenuItem>
        ) : (
          online.map(row)
        )}
        {offline.length > 0 && (
          <>
            <MenuSeparator />
            <MenuSub>
              <MenuSubTrigger>
                <span className={menuIconSlot}>
                  <StatusDot color="neutral" />
                </span>
                <span className={cx(menuLabel, "text-muted-foreground-2")}>
                  Offline
                </span>
                <span className="min-w-0 max-w-32 truncate text-muted-foreground-2">
                  {String(offline.length)}
                </span>
              </MenuSubTrigger>
              <MenuContent className="w-auto min-w-64 max-w-96">
                {offline.map(row)}
              </MenuContent>
            </MenuSub>
          </>
        )}
      </MenuContent>
    </MenuSub>
  );
}

export type CancelMoveRowProps = {
  /** "device" for a cloud-to-device move, otherwise the destination name. */
  destination: string;
  toDevice: boolean;
  cancelling: boolean;
  disabled: boolean;
  onCancel: () => void;
};

export function CancelMoveRow({
  destination,
  toDevice,
  cancelling,
  disabled,
  onCancel,
}: CancelMoveRowProps) {
  return (
    <>
      <MenuSeparator />
      <MenuItem
        closeOnClick={false}
        disabled={cancelling || disabled}
        onClick={onCancel}
      >
        <span className={menuIconSlot}>
          {cancelling ? (
            <Spinner label="Cancelling" />
          ) : (
            <Icon name={toDevice ? "devices" : "cloud"} size="sm" />
          )}
        </span>
        <span className={menuLabel}>Cancel move to {destination}</span>
      </MenuItem>
    </>
  );
}

export type MoveToCloudRowProps = {
  starting: boolean;
  offline: boolean;
  onMove: () => void;
};

export function MoveToCloudRow({
  starting,
  offline,
  onMove,
}: MoveToCloudRowProps) {
  return (
    <MenuItem disabled={offline || starting} onClick={onMove}>
      <span className={menuIconSlot}>
        {starting ? (
          <Spinner label="Starting" />
        ) : (
          <Icon name="cloud" size="sm" />
        )}
      </span>
      <span className={menuLabel}>Move to cloud</span>
      {offline && <span className={menuTrailing}>Device offline</span>}
    </MenuItem>
  );
}

export type FooterMachine = {
  device:
    | (FooterDevice & {
        connected: boolean;
        isThisDevice: boolean;
        os?: "darwin" | "other";
        /** Shown when the device is offline (e.g. "Last seen 2h ago"). */
        presenceLabel?: string;
      })
    | null;
  state: "running" | "asleep" | "gone" | "starting" | (string & {});
  color: StatusColor;
  /** Long status label (Capy's `zd`), e.g. "Running". */
  statusLabel: string;
  /** Short trigger detail (Capy's `td`), e.g. "Asleep". */
  detail: string | null;
  allocation: MachineAllocation | null;
  /** Size label from machine sizes, e.g. "Large". */
  sizeLabel: string | null;
  settingUp: boolean;
  setupSource?: "snapshot" | "image";
  setupDegraded: boolean;
  setupSteps: ReadonlyArray<SetupStep>;
};

/** Capy's `OC`: "setting up", "setting up from snapshot", "setup degraded". */
export const machineSetupNote = (machine: FooterMachine) =>
  machine.device !== null
    ? null
    : machine.settingUp
      ? machine.setupSource === "snapshot"
        ? "setting up from snapshot"
        : "setting up"
      : machine.setupDegraded
        ? "setup degraded"
        : null;

export type MachineTriggerProps = {
  /** undefined while the thread's machine lifetime loads. */
  machine: FooterMachine | null | undefined;
  failed?: boolean;
  handoff?: RunningHandoff | null;
  /** Name of the device a running cloud-to-device handoff targets. */
  handoffDeviceName?: string;
  /** Live samples for a cloud machine; "loading" shows the skeleton. */
  resources?: ReadonlyArray<ResourceSample> | "loading" | null;
  rerunning?: boolean;
  onRerunSetup?: () => void;
  waking?: boolean;
  onWake?: () => void;
  /** Handoff rows (MoveToCloudRow, DeviceTargetsSub, CancelMoveRow) composed by the caller. */
  moveRows?: ReactNode;
};

/** The machine chip in the composer footer and its menu. */
export function MachineTrigger({
  machine,
  failed = false,
  handoff = null,
  handoffDeviceName = "the device",
  resources = null,
  rerunning = false,
  onRerunSetup,
  waking = false,
  onWake,
  moveRows,
}: MachineTriggerProps) {
  const loading = machine === undefined && !failed;
  const device = machine?.device ?? null;
  const waitingForSetup =
    handoff !== null &&
    handoff.direction === "cloud_to_device" &&
    handoff.state === "capturing" &&
    machine?.settingUp === true;
  const handoffText = handoffLabel(handoff, waitingForSetup);
  const setupNote = machine == null ? null : machineSetupNote(machine);
  const statusNote =
    handoffText ??
    (machine == null || setupNote === null
      ? null
      : `${machine.statusLabel} · ${setupNote}`);
  const towardDevice =
    device !== null && handoff?.direction === "cloud_to_device";
  const label = machineTriggerLabel({
    device,
    handoff,
    handoffText,
    settingUp: machine?.settingUp === true,
    detail: machine?.detail ?? null,
  });
  const icon =
    device === null || (handoff !== null && !towardDevice) ? (
      <Icon name="cloud" size="sm" />
    ) : device.isThisDevice ? (
      <Icon
        name={device.os === "darwin" ? "macbook" : "studio-display"}
        size="sm"
      />
    ) : (
      <Icon name="devices" size="sm" />
    );
  return (
    <Menu>
      <MenuTrigger
        render={
          <FooterTrigger
            aria-label="Machine"
            icon={icon}
            color={machine?.color}
          >
            {label}
          </FooterTrigger>
        }
      />
      <MenuContent className="w-72">
        {loading ? (
          <MenuRow density="rich" className="cursor-default">
            <span className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-2.5 w-36" />
            </span>
          </MenuRow>
        ) : (
          <div className="cursor-default">
            <RichRow
              label={
                device !== null
                  ? device.name
                  : ((machine?.allocation == null ? null : machine.sizeLabel) ??
                    "Cloud")
              }
              description={
                machine == null
                  ? "Starts on the first run"
                  : device === null
                    ? machine.allocation === null
                      ? (statusNote ?? machine.statusLabel)
                      : allocationSummary(machine.allocation)
                    : device.workspaceKind === "worktree"
                      ? "Worktree"
                      : "Current checkout"
              }
              trailing={
                machine == null ? undefined : (
                  <>
                    <StatusDot color={machine.color} />
                    {device === null
                      ? machine.statusLabel
                      : device.connected
                        ? null
                        : device.presenceLabel}
                  </>
                )
              }
            />
          </div>
        )}
        {machine != null &&
          device === null &&
          machine.allocation !== null &&
          (statusNote !== null || machine.setupSteps.length > 0) && (
            <>
              <MenuSeparator />
              <div className="flex flex-col gap-1 px-2 py-1.5">
                {waitingForSetup && handoff !== null ? (
                  <WaitingForSetup
                    handoff={handoff}
                    deviceName={handoffDeviceName}
                  />
                ) : (
                  statusNote !== null && (
                    <span className="min-w-0 truncate text-xs font-normal text-muted-foreground-2">
                      {statusNote}
                    </span>
                  )
                )}
                {machine.setupSteps.length > 0 && (
                  <SetupSteps steps={machine.setupSteps} />
                )}
              </div>
            </>
          )}
        {machine != null && device === null && resources !== null && (
          <>
            <MenuSeparator />
            <div className="px-2 pb-2.5 pt-1.5">
              {resources === "loading" ? (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-7 w-full" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-7 w-full" />
                </div>
              ) : (
                <MachineResources samples={resources} />
              )}
            </div>
          </>
        )}
        {machine != null &&
          device === null &&
          machine.state !== "gone" &&
          machine.setupDegraded &&
          onRerunSetup !== undefined && (
            <MenuItem
              closeOnClick={false}
              disabled={rerunning}
              onClick={onRerunSetup}
            >
              <span className={menuIconSlot}>
                {rerunning ? (
                  <Spinner label="Running Setup again" />
                ) : (
                  <Icon name="rotate" size="sm" />
                )}
              </span>
              <span className={menuLabel}>Run Setup again</span>
            </MenuItem>
          )}
        {machine != null &&
          device === null &&
          machine.state === "asleep" &&
          onWake !== undefined && (
            <MenuItem closeOnClick={false} disabled={waking} onClick={onWake}>
              <span className={menuIconSlot}>
                {waking ? (
                  <Spinner label="Waking" />
                ) : (
                  <Icon name="play" size="sm" />
                )}
              </span>
              <span className={menuLabel}>Wake machine</span>
            </MenuItem>
          )}
        {moveRows}
      </MenuContent>
    </Menu>
  );
}

const copyBranch = (branch: string, onCopied?: (branch: string) => void) =>
  navigator.clipboard.writeText(branch).then(
    () => onCopied?.(branch),
    () => undefined,
  );

export type BranchTriggerProps = {
  repos: ReadonlyArray<FooterBranch>;
  /** Called after a branch name lands on the clipboard (Capy toasts "Copied"). */
  onCopied?: (branch: string) => void;
};

/** One branch copies on click; several open a menu of repo and branch rows. */
export function BranchTrigger({ repos, onCopied }: BranchTriggerProps) {
  const rows = branchRows(repos);
  const first = rows[0];
  if (first === undefined) return null;
  if (rows.length === 1)
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <FooterTrigger
              aria-label={`Copy ${first.branch}`}
              icon={<Icon name="branch-simple" size="sm" />}
              chevron={false}
              className="@max-sm/rail:shrink-0"
              detailClassName="@max-sm/rail:hidden"
              onClick={() => copyBranch(first.branch, onCopied)}
            >
              {first.branch}
            </FooterTrigger>
          }
        />
        <TooltipContent side="top">{first.branch}</TooltipContent>
      </Tooltip>
    );
  return (
    <Menu>
      <MenuTrigger
        render={
          <FooterTrigger
            aria-label="Branches"
            icon={<Icon name="branch-simple" size="sm" />}
            className="@max-sm/rail:shrink-0"
            detailClassName="@max-sm/rail:hidden"
          >
            {`${rows.length} repos`}
          </FooterTrigger>
        }
      />
      <MenuContent className="w-72">
        {rows.map((row) => (
          <MenuItem
            key={row.key}
            onClick={() => copyBranch(row.branch, onCopied)}
          >
            <span className={menuIconSlot}>
              <Icon
                name={row.repoFullName === null ? "branch-simple" : "github"}
                size="sm"
              />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="min-w-0 truncate">{row.label}</span>
              <span className="truncate text-xs font-normal text-muted-foreground-2">
                {row.branch}
              </span>
            </span>
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}

export type ComposerFooterProps = ComponentProps<"div"> & {
  machine?: ReactNode;
  branch?: ReactNode;
  /** Right-aligned slot; Capy puts the context meter here. */
  meter?: ReactNode;
};

/** The row under the thread composer: machine and branch chips left, context meter right. */
export function ComposerFooter({
  machine,
  branch,
  meter,
  className,
  children,
  ...props
}: ComposerFooterProps) {
  return (
    <div
      className={cx(
        "@container/rail flex min-h-8 min-w-0 items-center gap-3 px-4 pt-1",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-3">
        {machine}
        {branch}
      </div>
      {meter !== undefined && (
        <span className="-mr-2 ml-auto flex shrink-0 items-center">
          {meter}
        </span>
      )}
      {children}
    </div>
  );
}
