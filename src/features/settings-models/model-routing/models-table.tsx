import { useAtomSet } from "@effect/atom-react";
import { Exit } from "effect";
import { type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
import { BulkBar } from "@/primitives/bulk-bar";
import { Button } from "@/primitives/button";
import { Checkbox } from "@/primitives/checkbox";
import {
  MenuContent,
  MenuGroup,
  MenuLabel,
  MenuTrigger,
} from "@/primitives/menu";
import {
  ResponsiveMenu,
  ResponsiveMenuCheckboxItem,
  ResponsiveMenuItem,
} from "@/primitives/responsive-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import { toastFailure } from "./actions.ts";
import { routingKeys, setModelSettingAtom, useOrgId } from "./atoms.ts";
import { CrossGlyph, DotsHorizontalGlyph, LockGlyphIcon } from "./glyphs.tsx";
import { ProviderIcon } from "./provider-icon.tsx";
import {
  defaultCompactAt,
  effortsLabel,
  formatCount,
  formatPrice,
  formatTokens,
  formatUntil,
  targetLabel,
} from "./routing.ts";
import type {
  CatalogEntry,
  CatalogRow,
  Credential,
  RouteTarget,
} from "./types.ts";

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const wideColumns =
  "minmax(10rem,3fr) minmax(4.5rem,auto) minmax(5.5rem,auto) minmax(4.5rem,auto) minmax(4.5rem,auto) minmax(6rem,auto) minmax(8rem,auto) auto";

const headClass =
  "flex h-8 items-center px-3 text-2xs font-normal text-muted-foreground-3";

const cellClass = "flex min-w-0 items-center px-3 py-2 text-sm";

export const skippedNote = (route: RouteTarget | undefined, now: number) => {
  const skipped = route?.skipped;
  if (skipped === undefined || route === undefined) return undefined;
  const sameSeat =
    skipped.kind === "member_seat" &&
    route.kind === "member_seat" &&
    skipped.ref !== route.ref &&
    (skipped.service !== undefined && route.service !== undefined
      ? skipped.service === route.service
      : skipped.label.split(" (")[0] === route.label.split(" (")[0]);
  if (sameSeat) return undefined;
  if (skipped.idle === "disabled") return `${skipped.label} is turned off`;
  if (skipped.idle === "signed_out")
    return skipped.kind === "member_seat"
      ? `${skipped.label} is signed out`
      : `${/\bkey$/i.test(skipped.label) ? skipped.label : `${skipped.label} key`} was rejected`;
  if (skipped.exhaustedUntil.getTime() <= now) return undefined;
  return skipped.capped === true && skipped.resetNamed === false
    ? `${skipped.label} at your usage cap`
    : `${skipped.label} ${skipped.capped === true ? "at your usage cap" : "out of usage"} until ${formatUntil(skipped.exhaustedUntil, now)}`;
};

export function ServedBy({
  route,
  org,
}: {
  route: RouteTarget | undefined;
  org: RouteTarget | undefined;
}) {
  const note = skippedNote(route, Date.now());
  const locked =
    route?.locked === true
      ? `Your organization serves this model only on ${route.label}`
      : undefined;
  const forOrg =
    org === undefined ||
    (route !== undefined && org.ref === route.ref && org.kind === route.kind)
      ? undefined
      : `For the organization: ${targetLabel(org)}`;
  const lines = [note, locked, forOrg].filter((line) => line !== undefined);
  const content = (
    <span className="flex max-w-full min-w-0 items-center gap-1.5">
      <span
        className={cx(
          "max-w-full shrink-0 truncate",
          route === undefined && "text-muted-foreground-2",
        )}
      >
        {route === undefined ? "Nothing" : targetLabel(route)}
      </span>
      {note === undefined ? null : (
        <span className="min-w-0 truncate text-xs text-muted-foreground-2">
          {note}
        </span>
      )}
      {locked === undefined ? null : (
        <LockGlyphIcon
          aria-label={locked}
          className="size-(--icon-xs) shrink-0 text-muted-foreground-2"
        />
      )}
    </span>
  );
  if (lines.length === 0) return content;
  return (
    <Tooltip>
      <TooltipTrigger render={content} />
      <TooltipContent>
        {lines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </TooltipContent>
    </Tooltip>
  );
}

const useSetModel = () => {
  const orgId = useOrgId();
  const setModelSetting = useAtomSet(setModelSettingAtom, {
    mode: "promiseExit",
  });
  return (payload: Record<string, unknown>) => {
    if (orgId === undefined) return;
    void toastFailure(
      setModelSetting({
        params: { orgId },
        payload,
        reactivityKeys: routingKeys(orgId),
      }),
      "Could not update the model",
    );
  };
};

export function ModelSwitchItem({ row }: { row: CatalogRow }) {
  const setModel = useSetModel();
  const off = row.setting?.off === true;
  return (
    <ResponsiveMenuItem
      onClick={() => setModel({ model: row.route.model, off: !off })}
    >
      {off ? "Turn on for everyone" : "Turn off for everyone"}
    </ResponsiveMenuItem>
  );
}

export function OnlyThisKeyItem({
  row,
  credentials,
}: {
  row: CatalogRow;
  credentials: ReadonlyArray<Credential>;
}) {
  const setModel = useSetModel();
  const only = row.setting?.onlyOrgKey === true;
  const key =
    row.route.org?.kind === "org_credential"
      ? credentials.find((c) => c.id === row.route.org?.ref)
      : undefined;
  if (key === undefined && !only) return null;
  return (
    <ResponsiveMenuCheckboxItem
      checked={only}
      onCheckedChange={(onlyOrgKey) =>
        setModel({ model: row.route.model, onlyOrgKey })
      }
    >
      <span className="flex min-w-0 flex-col">
        <span className="line-clamp-1">
          {key === undefined ? "Only organization keys" : `Only ${key.name}`}
        </span>
        <span className="line-clamp-1 text-xs font-normal text-muted-foreground-2">
          Never members' connections or Capy credits
        </span>
      </span>
    </ResponsiveMenuCheckboxItem>
  );
}

function RichItem({
  label,
  description,
  trailing,
}: {
  label: string;
  description: string;
  trailing: ReactNode;
}) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-3">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate">{label}</span>
        <span className="truncate text-xs font-normal text-muted-foreground-2">
          {description}
        </span>
      </span>
      <span className="shrink-0 text-xs text-muted-foreground-2">
        {trailing}
      </span>
    </span>
  );
}

function BulkAction({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export type CompactAtScope = "user" | "org";

export type ModelsTableProps = {
  rows: ReadonlyArray<CatalogRow>;
  credentials: ReadonlyArray<Credential>;
  admin: boolean;
  compactAtOf: (entry: CatalogEntry) => number | undefined;
  myCompactAtOf: (entry: CatalogEntry) => number | undefined;
  onCompactAt: (entry: CatalogEntry, scope: CompactAtScope) => void;
};

export function ModelsTable({
  rows,
  credentials,
  admin,
  compactAtOf,
  myCompactAtOf,
  onCompactAt,
}: ModelsTableProps) {
  const orgId = useOrgId();
  const setModelSetting = useAtomSet(setModelSettingAtom, {
    mode: "promiseExit",
  });
  const [selected, setSelected] = useState(() => new Set<string>());
  const [working, setWorking] = useState(false);
  useEffect(() => {
    if (orgId !== undefined) setSelected(new Set());
  }, [orgId]);
  const chosen = rows.filter((row) => selected.has(row.entry.id));
  const creditsOnly = rows.filter((row) => row.route.mine?.kind === "capy");
  const select = (ids: ReadonlyArray<string>, on: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  const turn = async (off: boolean) => {
    if (orgId === undefined) return;
    const models = [
      ...new Set(
        chosen
          .filter((row) => (row.setting?.off === true) !== off)
          .map((row) => row.route.model),
      ),
    ];
    setWorking(true);
    const results = [];
    for (const model of models)
      results.push(
        await setModelSetting({
          params: { orgId },
          payload: { model, off },
          reactivityKeys: routingKeys(orgId),
        }),
      );
    const failed = results.filter(Exit.isFailure);
    if (failed.length > 0)
      toast.error(
        `Could not update ${failed.length} of ${models.length} models`,
      );
    else toast.success(`${models.length} models turned ${off ? "off" : "on"}`);
    setWorking(false);
  };
  return (
    <div className="flex flex-col">
      <div
        data-slot="card"
        className="overflow-x-auto rounded-(--radius-card) border-hairline border-border-1 bg-card"
      >
        <table
          aria-label="Models"
          className="grid min-w-max"
          style={{ gridTemplateColumns: wideColumns }}
        >
          <thead className="contents">
            <tr className="col-span-full grid grid-cols-subgrid border-b-(length:--border-hairline) border-border-1">
              <th className={headClass}>
                <span className="flex items-center gap-2">
                  {admin ? (
                    <Checkbox
                      checked={rows.length > 0 && chosen.length === rows.length}
                      indeterminate={
                        chosen.length > 0 && chosen.length < rows.length
                      }
                      disabled={working || rows.length === 0}
                      aria-label="Select all models"
                      onCheckedChange={(on) =>
                        select(
                          rows.map((row) => row.entry.id),
                          on === true,
                        )
                      }
                    />
                  ) : null}
                  Model
                </span>
              </th>
              <th className={cx(headClass, "justify-end")}>Context</th>
              <th className={cx(headClass, "justify-end")}>Compact at</th>
              <th className={cx(headClass, "justify-end")}>Input $</th>
              <th className={cx(headClass, "justify-end")}>Output $</th>
              <th className={headClass}>Reasoning</th>
              <th className={headClass}>Served by</th>
              <th aria-hidden className={headClass} />
            </tr>
          </thead>
          <tbody className="contents">
            {rows.map((row) => {
              const off = row.setting?.off === true;
              const orgValue = compactAtOf(row.entry);
              const mine = myCompactAtOf(row.entry);
              const orgDefault = defaultCompactAt(
                row.entry.limits.context,
                orgValue,
              );
              const compactAt =
                mine === undefined
                  ? orgDefault
                  : Math.min(mine, row.entry.limits.context);
              return (
                <tr
                  key={row.entry.id}
                  title={off ? "Turned off for the organization" : undefined}
                  className={cx(
                    "col-span-full grid grid-cols-subgrid border-b-(length:--border-hairline) border-border-1 last:border-b-0",
                    off && "text-muted-foreground-3",
                  )}
                >
                  <td className={cellClass}>
                    <span className="flex min-w-0 items-center gap-2">
                      {admin ? (
                        <Checkbox
                          checked={selected.has(row.entry.id)}
                          disabled={working}
                          aria-label={`Select ${row.entry.name}`}
                          onCheckedChange={(on) =>
                            select([row.entry.id], on === true)
                          }
                        />
                      ) : null}
                      <ProviderIcon
                        provider={row.entry.provider}
                        className="size-4 shrink-0"
                      />
                      <span className="truncate">{row.entry.name}</span>
                    </span>
                  </td>
                  <td className={cx(cellClass, "justify-end tabular-nums")}>
                    {formatTokens(row.entry.limits.context)}
                  </td>
                  <td
                    className={cx(
                      cellClass,
                      "justify-end tabular-nums",
                      (orgValue !== undefined || mine !== undefined) &&
                        "text-foreground",
                    )}
                    title={
                      mine === undefined
                        ? undefined
                        : `Yours, organization default ${formatCount(orgDefault)}`
                    }
                  >
                    {formatTokens(compactAt)}
                  </td>
                  <td className={cx(cellClass, "justify-end tabular-nums")}>
                    {row.entry.pricing === undefined
                      ? "—"
                      : formatPrice(row.entry.pricing.input)}
                  </td>
                  <td className={cx(cellClass, "justify-end tabular-nums")}>
                    {row.entry.pricing === undefined
                      ? "—"
                      : formatPrice(row.entry.pricing.output)}
                  </td>
                  <td className={cx(cellClass, "text-muted-foreground")}>
                    {effortsLabel(row.entry)}
                  </td>
                  <td className={cellClass}>
                    {off ? (
                      <span className="text-xs text-muted-foreground-2">
                        Off
                      </span>
                    ) : (
                      <ServedBy route={row.route.mine} org={row.route.org} />
                    )}
                  </td>
                  <td className={cx(cellClass, "justify-end pr-0")}>
                    <span className="-mr-1 flex items-center">
                      <ResponsiveMenu>
                        <MenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={working}
                              aria-label={`Configure ${row.entry.name}`}
                            />
                          }
                        >
                          <DotsHorizontalGlyph />
                        </MenuTrigger>
                        <MenuContent align="end" className="w-80">
                          <ResponsiveMenuItem
                            onClick={() => onCompactAt(row.entry, "user")}
                          >
                            <RichItem
                              label="Compact at (your threads)"
                              description="Your default for threads you own"
                              trailing={
                                <span className="tabular-nums">
                                  {formatCount(compactAt)}
                                </span>
                              }
                            />
                          </ResponsiveMenuItem>
                          {admin ? (
                            <MenuGroup>
                              <MenuLabel>For every member</MenuLabel>
                              <OnlyThisKeyItem
                                row={row}
                                credentials={credentials}
                              />
                              <ResponsiveMenuItem
                                onClick={() => onCompactAt(row.entry, "org")}
                              >
                                <RichItem
                                  label="Compact at (organization default)"
                                  description="For everyone without their own value"
                                  trailing={
                                    <span className="tabular-nums">
                                      {formatCount(orgDefault)}
                                    </span>
                                  }
                                />
                              </ResponsiveMenuItem>
                              <ModelSwitchItem row={row} />
                            </MenuGroup>
                          ) : null}
                        </MenuContent>
                      </ResponsiveMenu>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {admin && chosen.length > 0 ? (
        <div className="pointer-events-none sticky bottom-0 z-(--z-top-bar) h-0">
          <BulkBar className="pointer-events-auto mx-auto flex w-fit -translate-y-full items-center gap-1 rounded-lg border-hairline border-border-1 bg-popover p-1 shadow-overlay">
            <span className="px-2 text-sm tabular-nums">{`${chosen.length} selected`}</span>
            <BulkAction
              label="Select only models served by Capy credits"
              disabled={working || creditsOnly.length === 0}
              onClick={() =>
                setSelected(new Set(creditsOnly.map((row) => row.entry.id)))
              }
            >
              Capy credits only
            </BulkAction>
            <BulkAction
              label="Turn on for everyone"
              disabled={
                working || !chosen.some((row) => row.setting?.off === true)
              }
              onClick={() => void turn(false)}
            >
              Turn on
            </BulkAction>
            <BulkAction
              label="Turn off for everyone"
              disabled={
                working || !chosen.some((row) => row.setting?.off !== true)
              }
              onClick={() => void turn(true)}
            >
              Turn off
            </BulkAction>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Clear selection"
              onClick={() => setSelected(new Set())}
            >
              <CrossGlyph />
            </Button>
          </BulkBar>
        </div>
      ) : null}
    </div>
  );
}
