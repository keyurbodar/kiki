import { useAtomSet } from "@effect/atom-react";
import { MenuSeparator } from "@/primitives/menu";
import {
  MenuSelect,
  MenuSelectContent,
  MenuSelectItem,
  MenuSelectTrigger,
  MenuSelectValue,
} from "@/primitives/menu-select";
import { ResponsiveMenuItem } from "@/primitives/responsive-menu";
import { useRunner, useSaveModels } from "./actions.ts";
import { setCredentialEnabledAtom } from "./atoms.ts";
import {
  ConnectionShell,
  narrowOnly,
  usageColumnClass,
  wideColumns,
} from "./connection-shell.tsx";
import { orgOnlyReason } from "./credential-row.tsx";
import { ProviderIcon } from "./provider-icon.tsx";
import {
  applyTick,
  formatUntil,
  healthSentence,
  lockedModels,
  serviceTitle,
  usageCapLabels,
  usageCapValues,
} from "./routing.ts";
import { TickTree } from "./tick-tree.tsx";
import type { ModelsRouting, Seat, UsageWindow } from "./types.ts";
import {
  columnWindows,
  describeWindow,
  earliestReset,
  exhaustedWindows,
  fableWindow,
  resetIn,
  type UsageDisplay,
  usageColumns,
  usedPercent,
} from "./usage.ts";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

export function UsageMeter({ window }: { window: UsageDisplay }) {
  const left =
    window.entitlement !== undefined && window.remaining !== undefined
      ? `${window.remaining.toLocaleString()} of ${window.entitlement.toLocaleString()} left`
      : undefined;
  const detail = [left, window.resets]
    .filter((part) => part !== undefined)
    .join(" · ");
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-normal text-muted-foreground">
          {window.label}
        </span>
        <span className="text-xs font-medium tabular-nums">
          {`${Math.round(window.usedPercent)}% used`}
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cx(
            "h-full rounded-full",
            window.usedPercent >= 90 ? "bg-warning" : "bg-primary",
          )}
          style={{ width: `${Math.min(100, window.usedPercent)}%` }}
        />
      </div>
      {detail.length === 0 ? null : (
        <span className="text-xs font-normal text-muted-foreground-2">
          {detail}
        </span>
      )}
    </div>
  );
}

function UsageCell({ usage }: { usage: UsageWindow | undefined }) {
  const percent = usedPercent(usage);
  return (
    <span
      className={cx(
        usageColumnClass,
        "text-xs font-normal tabular-nums",
        percent !== undefined && percent >= 90
          ? "text-warning-fg"
          : "text-muted-foreground-2",
      )}
    >
      {percent === undefined ? "—" : `${percent}%`}
    </span>
  );
}

const exhaustedLabel = (window: UsageWindow, now: number) => {
  const display = describeWindow(window, now);
  return window.resetsAt === undefined
    ? `${display.label} limit reached`
    : `${display.label} limit until ${formatUntil(window.resetsAt, now)}`;
};

export type SeatRowProps = {
  seat: Seat;
  credentialId: string;
  routing: ModelsRouting;
  fableColumn: boolean;
  draggable: boolean;
  reason?: string;
  expanded: boolean;
  onToggle: () => void;
  onRefresh: () => void;
  onRename: () => void;
  /** Absent when this seat's service has no reconnect flow we serve. */
  onReconnect?: () => void;
  onDisconnect: () => void;
};

export function SeatRow({
  seat,
  credentialId,
  routing,
  fableColumn,
  draggable,
  reason,
  expanded,
  onToggle,
  onRefresh,
  onRename,
  onReconnect,
  onDisconnect,
}: SeatRowProps) {
  const { busy, save } = useSaveModels(credentialId);
  const runner = useRunner();
  const setCredential = useAtomSet(setCredentialEnabledAtom, {
    mode: "promiseExit",
  });
  const now = Date.now();
  const title = serviceTitle(seat.service);
  const windows = seat.usage?.windows ?? [];
  const meters = windows.map((window) => describeWindow(window, now));
  const account =
    seat.accountLabel ??
    (seat.service === "supergrok" ? undefined : seat.accountId);
  const firstOfService = routing.seats.filter(
    (s) => s.service === seat.service && s.state !== "not_connected",
  )[0];
  const columns = columnWindows(windows, seat.service, now);
  const reset = earliestReset(columns);
  const problem =
    seat.health.state === "signed_out" || seat.health.state === "disabled"
      ? healthSentence(seat.health, "user", now)
      : seat.state === "needs_reauth"
        ? `${title} needs to reconnect`
        : undefined;
  const exhausted =
    problem === undefined ? exhaustedWindows(windows, seat.usageCap, now) : [];
  const exhaustedText =
    exhausted.length === 0
      ? undefined
      : exhausted.length === 1 && exhausted[0] !== undefined
        ? exhaustedLabel(exhausted[0], now)
        : `${new Intl.ListFormat("en").format(exhausted.map((w) => describeWindow(w, now).label))} limits`;
  const plan = seat.plan === undefined ? undefined : `${seat.plan} plan`;
  const summary =
    problem ??
    (exhaustedText === undefined
      ? [title, plan].filter((part) => part !== undefined).join(", ")
      : `${title}, ${exhaustedText}`);
  const description = (
    <span
      className="block truncate"
      title={
        exhausted.length > 1
          ? `${title}, ${exhausted.map((w) => exhaustedLabel(w, now)).join(", ")}`
          : summary
      }
    >
      {problem !== undefined || exhaustedText === undefined ? (
        summary
      ) : (
        <>
          <span className={narrowOnly}>{`${title}, `}</span>
          <span className="text-warning-fg">{exhaustedText}</span>
        </>
      )}
    </span>
  );
  const badge =
    problem === undefined ? (
      <span className={wideColumns}>
        {usageColumns.map((column, index) => (
          <UsageCell key={column.label} usage={columns[index]} />
        ))}
        {fableColumn ? <UsageCell usage={fableWindow(windows, now)} /> : null}
        <span className="w-12 text-xs font-normal text-muted-foreground-2 tabular-nums">
          {reset === undefined ? undefined : resetIn(reset, now)}
        </span>
      </span>
    ) : null;
  const write = (payload: Record<string, unknown>, message: string) =>
    runner.run(
      (reactivityKeys) =>
        setCredential({
          params: { service: seat.service },
          query: { credentialId },
          payload,
          reactivityKeys,
        }),
      message,
    );
  return (
    <ConnectionShell
      id={
        firstOfService?.credentialId === credentialId ? seat.service : undefined
      }
      sortId={credentialId}
      draggable={draggable}
      dragReason={reason}
      icon={<ProviderIcon provider={seat.service} />}
      label={title}
      display={
        <span className="block truncate" title={account ?? title}>
          {account ?? title}
        </span>
      }
      description={description}
      badge={badge}
      power={
        seat.state === "needs_reauth"
          ? undefined
          : {
              checked: seat.enabled,
              disabled: runner.busy,
              onChange: (enabled) =>
                write(
                  { enabled },
                  enabled
                    ? "Could not turn the subscription on"
                    : "Could not turn the subscription off",
                ),
            }
      }
      menuLabel={`Actions for ${title}`}
      menu={
        <>
          <ResponsiveMenuItem onClick={onRename}>Rename</ResponsiveMenuItem>
          <ResponsiveMenuItem onClick={onRefresh}>
            {seat.service === "claude"
              ? "Refresh usage"
              : "Refresh usage and plan"}
          </ResponsiveMenuItem>
          {onReconnect === undefined ? null : (
            <ResponsiveMenuItem onClick={onReconnect}>
              Reconnect
            </ResponsiveMenuItem>
          )}
          <MenuSeparator />
          <ResponsiveMenuItem
            data-intent="danger"
            className="text-destructive"
            onClick={onDisconnect}
          >
            Disconnect
          </ResponsiveMenuItem>
        </>
      }
      expanded={expanded}
      onToggle={onToggle}
    >
      {seat.expiresAt === undefined ? null : (
        <span className="text-xs font-normal text-muted-foreground">
          {seat.state === "needs_reauth" || seat.expiresAt.getTime() <= now
            ? "Run claude setup-token again and reconnect with the new token"
            : `Token expires by ${formatUntil(seat.expiresAt, now)}`}
        </span>
      )}
      {meters.length > 0 ? (
        <div
          className={cx(
            "grid grid-cols-1 gap-x-6 gap-y-3",
            meters.length > 1 && "sm:grid-cols-2",
            !seat.enabled && "opacity-55",
          )}
        >
          {meters.map((meter) => (
            <UsageMeter key={meter.label} window={meter} />
          ))}
        </div>
      ) : null}
      {meters.length > 0 || seat.usageCap !== undefined ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-xs font-medium">Usage cap</span>
            <span className="text-xs font-normal text-muted-foreground">
              Your next connection takes over when any limit reaches it
            </span>
          </div>
          <MenuSelect
            items={usageCapLabels}
            value={seat.usageCap === undefined ? "none" : String(seat.usageCap)}
            disabled={runner.busy}
            onValueChange={(value) => {
              if (!value) return;
              write(
                { usageCap: value === "none" ? null : Number(value) },
                "Could not change the usage cap",
              );
            }}
          >
            <MenuSelectTrigger className="w-28">
              <MenuSelectValue />
            </MenuSelectTrigger>
            <MenuSelectContent>
              {usageCapValues.map((value) => (
                <MenuSelectItem key={value} value={value}>
                  {usageCapLabels[value]}
                </MenuSelectItem>
              ))}
            </MenuSelectContent>
          </MenuSelect>
        </div>
      ) : null}
      {seat.ticks.length > 0 ? (
        <TickTree
          ticks={seat.ticks}
          via={title}
          editable
          busy={busy}
          lockedModels={lockedModels(routing)}
          lockReason={orgOnlyReason}
          onTick={(change) =>
            save(applyTick(seat.rows, true, seat.ticks, change))
          }
        />
      ) : null}
    </ConnectionShell>
  );
}
