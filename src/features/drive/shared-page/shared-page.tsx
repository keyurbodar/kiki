import { useAtomRefresh, useAtomValue } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import { Option } from "effect";
import { AsyncResult } from "effect/reactivity";
import { type ReactNode, useState } from "react";
import { AppTopBar } from "@/components/app-top-bar";
import {
  ArrowUpRightIcon,
  CheckmarkIcon,
  ChevronRightSmallIcon,
  CopyIcon,
  copyShareLink,
  DotsHorizontalIcon,
  type DriveShareRow,
  decodeSharePage,
  orgSharesAtom,
  SHARE_VISIBILITIES,
  ShareOsIcon,
  shareViewUrl,
  useActiveOrgId,
  useShareActions,
} from "@/components/share-popover";
import type { OrgId } from "@/data/api/schemas/ids";
import { projectsAtom } from "@/data/atoms/projects";
import { currentUserAtom, organizationsAtom } from "@/data/atoms/session";
import { cn } from "@/lib/cn";
import { Badge } from "@/primitives/badge";
import { Button } from "@/primitives/button";
import { Icon } from "@/primitives/icon";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuSub,
  MenuSubTrigger,
  MenuTrigger,
} from "@/primitives/menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/primitives/tooltip";
import {
  formatChanged,
  matchesShareSearch,
  shareOpenTarget,
  shareScopeLabel,
} from "./shared-scopes";

const track = (owner: string) => `features/drive/shared-page.tsx#${owner}`;

const value = <A, E>(result: AsyncResult.AsyncResult<A, E>) =>
  Option.getOrUndefined(AsyncResult.value(result));

const gridColumns =
  "grid grid-cols-[minmax(0,3fr)_minmax(0,1.4fr)_minmax(7rem,auto)_minmax(0,1.2fr)_minmax(6rem,auto)_auto] max-md:grid-cols-[minmax(0,1fr)_minmax(6rem,auto)_auto]";

const cell = "flex min-w-0 items-center px-4 text-sm text-muted-foreground-1";

export function SharedEmpty({
  title,
  description,
}: {
  readonly title: string;
  readonly description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <ShareOsIcon className="size-(--icon-base) text-muted-foreground-2" />
      <h2 className="text-base font-medium">{title}</h2>
      <p className="text-sm text-muted-foreground-1">{description}</p>
    </div>
  );
}

function SharedTopBar({
  search,
  searching,
  onSearch,
  onSearchingChange,
}: {
  readonly search: string;
  readonly searching: boolean;
  readonly onSearch: (value: string) => void;
  readonly onSearchingChange: (open: boolean) => void;
}) {
  const title = (
    <span className="flex min-w-0 items-center gap-1.5">
      <Link
        data-track-owner={track("SharedPage:Link[Capy Drive]")}
        to="/drive"
        className="focus-gutter min-w-0 truncate rounded font-medium text-muted-foreground-2 transition-colors duration-100 outline-none hover:text-foreground focus-visible:outline-ring-inset"
      >
        Capy Drive
      </Link>
      <ChevronRightSmallIcon
        aria-hidden
        className="size-(--icon-sm) shrink-0 text-muted-foreground-3"
      />
      <span className="min-w-0 truncate">Shared</span>
    </span>
  );
  return (
    <AppTopBar className="sticky top-0 z-(--z-top-bar) flex min-h-11 shrink-0 items-center border-b-hairline border-border-1 bg-panel px-2">
      {searching ? (
        <div className="ml-2.5 flex min-w-0 flex-1 items-center gap-1.5">
          <Icon
            name="search-menu"
            className="size-(--icon-base) shrink-0 text-icon-muted"
          />
          <input
            // biome-ignore lint/a11y/noAutofocus: search opens on demand, as in Capy
            autoFocus
            value={search}
            placeholder="Search shared files"
            aria-label="Search shared files"
            className="min-w-0 flex-1 bg-transparent px-0 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground-3"
            onChange={(event) => onSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              onSearch("");
              onSearchingChange(false);
            }}
          />
        </div>
      ) : (
        <h1 className="ml-2.5 min-w-0 truncate text-sm font-medium text-foreground">
          {title}
        </h1>
      )}
      <div className="ml-auto flex items-center gap-1.5 pl-2">
        <Tooltip>
          <TooltipTrigger
            data-track-owner="shared/app-top-bar.tsx#AppTopBar:TooltipTrigger.1"
            render={
              <Button
                data-track-owner="shared/app-top-bar.tsx#AppTopBar:Button.1"
                variant="ghost"
                size="icon-sm"
                aria-label={searching ? "Close search" : "Search"}
                className="inline-flex size-(--h-control-sm) items-center justify-center rounded text-icon-muted hover:text-foreground"
                onClick={() => {
                  if (searching) onSearch("");
                  onSearchingChange(!searching);
                }}
              >
                <Icon name={searching ? "x" : "search-menu"} size="sm" />
              </Button>
            }
          />
          <TooltipContent side="bottom">
            {searching ? "Close search" : "Search"}
          </TooltipContent>
        </Tooltip>
      </div>
    </AppTopBar>
  );
}

function Row({
  children,
  interactive = true,
}: {
  readonly children: ReactNode;
  readonly interactive?: boolean;
}) {
  return (
    <tr
      className={cn(
        "col-span-full grid min-h-11 grid-cols-subgrid border-b-hairline border-border-1",
        interactive && "hover:bg-card-hover",
      )}
    >
      {children}
    </tr>
  );
}

function ShareRowActions({
  share,
  visibility,
  removing,
  onVisibility,
  onRemove,
}: {
  readonly share: DriveShareRow;
  readonly visibility: string;
  readonly removing: boolean;
  readonly onVisibility: (id: DriveShareRow["visibility"]) => void;
  readonly onRemove: () => void;
}) {
  const open = shareOpenTarget(share);
  const current = SHARE_VISIBILITIES.find((option) => option.id === visibility);
  return (
    <td className={cn(cell, "justify-end gap-0.5")}>
      <Tooltip>
        <TooltipTrigger
          data-track-owner={track("SharedPage:TooltipTrigger.1")}
          render={
            <Button
              data-track-owner={track("SharedPage:Button[Copy link]")}
              variant="ghost"
              size="icon-sm"
              aria-label="Copy link"
              disabled={share.visibility === "private" && !share.manageable}
              onClick={() => void copyShareLink(share.url)}
            >
              <CopyIcon className="size-(--icon-sm)" />
            </Button>
          }
        />
        <TooltipContent side="top">Copy link</TooltipContent>
      </Tooltip>
      <Menu>
        <MenuTrigger
          data-track-owner={track("SharedPage:ResponsiveMenuTrigger.1")}
          render={
            <Button
              data-track-owner={track("SharedPage:Button.1")}
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${share.path}`}
            >
              <DotsHorizontalIcon className="size-(--icon-sm)" />
            </Button>
          }
        />
        <MenuContent align="end" className="w-56">
          <MenuItem
            data-track-owner={track(
              "SharedPage:ResponsiveMenuItem[Open in Capy Drive]",
            )}
            render={
              <Link
                data-track-owner={track("SharedPage:Link.2")}
                {...open}
                search={{ file: share.path }}
              />
            }
          >
            <Icon name="folder-open" size="sm" />
            Open in Capy Drive
          </MenuItem>
          <MenuItem
            data-track-owner={track("SharedPage:ResponsiveMenuItem[Open link]")}
            render={
              <a
                data-track-owner={track("SharedPage:a.1")}
                href={shareViewUrl(share.url)}
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            <ArrowUpRightIcon className="size-(--icon-sm)" />
            Open link
          </MenuItem>
          {share.manageable && (
            <>
              <MenuSeparator />
              <MenuSub>
                <MenuSubTrigger>
                  <ShareOsIcon className="size-(--icon-sm)" />
                  Who can open
                  <span className="ml-auto text-muted-foreground-2">
                    {current?.label}
                  </span>
                </MenuSubTrigger>
                <MenuContent className="w-48">
                  {SHARE_VISIBILITIES.map((option) => (
                    <MenuItem
                      key={option.id}
                      data-track-owner={track(
                        "SharedPage:ResponsiveMenuItem.1",
                      )}
                      disabled={removing}
                      onClick={() => onVisibility(option.id)}
                    >
                      <option.icon className="size-(--icon-sm)" />
                      {option.label}
                      {visibility === option.id ? (
                        <CheckmarkIcon className="ml-auto size-(--icon-sm) shrink-0 text-foreground" />
                      ) : null}
                    </MenuItem>
                  ))}
                </MenuContent>
              </MenuSub>
              <MenuSeparator />
              <MenuItem
                data-track-owner={track(
                  "SharedPage:ResponsiveMenuItem[Remove link]",
                )}
                intent="danger"
                disabled={removing}
                onClick={onRemove}
              >
                Remove link
              </MenuItem>
            </>
          )}
        </MenuContent>
      </Menu>
    </td>
  );
}

export interface SharedPageProps {
  readonly now?: number;
}

export function SharedPage({ now = Date.now() }: SharedPageProps) {
  const orgId = useActiveOrgId();
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [page, setPage] = useState(1);
  const sharesAtom = orgSharesAtom(orgId ?? ("" as OrgId), page);
  const result = useAtomValue(sharesAtom);
  const refresh = useAtomRefresh(sharesAtom);
  const organization = value(useAtomValue(organizationsAtom))?.[0];
  const user = value(useAtomValue(currentUserAtom));
  const projects = value(useAtomValue(projectsAtom((orgId ?? "") as OrgId))) as
    | ReadonlyArray<{ readonly id: string; readonly name: string }>
    | undefined;
  const raw = orgId === undefined ? undefined : value(result);
  const data = raw === undefined ? undefined : decodeSharePage(raw);
  const actions = useShareActions(data?.items ?? [], refresh);

  const context = {
    organizationName: organization?.name,
    userId: user?.id,
    projects: projects ?? [],
    automations: [],
    captains: [],
  };
  const query = search.trim().toLowerCase();
  const rows = (data?.items ?? []).map((share) => ({
    share,
    scopeLabel: shareScopeLabel(share, context),
  }));
  const visible =
    query === ""
      ? rows
      : rows.filter((row) =>
          matchesShareSearch([row.share.path, row.scopeLabel], query),
        );

  const body =
    data === undefined ? (
      AsyncResult.isFailure(result) ? (
        <SharedEmpty
          title="Shared files are unavailable"
          description="Could not read the share links for this organization"
        />
      ) : (
        <div className="flex flex-col gap-3 pt-2">
          <div className="shimmer-surface shimmer-surface-motion-safe h-8 w-full rounded" />
          <div className="shimmer-surface shimmer-surface-motion-safe h-8 w-full rounded" />
          <div className="shimmer-surface shimmer-surface-motion-safe h-8 w-2/3 rounded" />
        </div>
      )
    ) : data.total === 0 ? (
      <SharedEmpty
        title="Nothing shared yet"
        description="Share a file from its page in Capy Drive and it appears here"
      />
    ) : (
      <div className="-mx-4">
        <table className={cn("w-full", gridColumns)}>
          <tbody className="contents">
            <Row interactive={false}>
              {[
                "File",
                "Drive",
                "Who can open",
                "Shared by",
                "Changed",
                "",
              ].map((label, index) => (
                <th
                  key={label || "actions"}
                  aria-hidden={label === "" || undefined}
                  className={cn(
                    cell,
                    "text-xs font-medium text-muted-foreground-2",
                    (index === 1 || index === 3 || index === 4) &&
                      "max-md:hidden",
                  )}
                >
                  {label}
                </th>
              ))}
            </Row>
            <Row interactive={false}>
              <td
                className={cn(
                  cell,
                  "col-span-full gap-1.5 text-xs font-medium",
                )}
              >
                <span className="text-muted-foreground-2">
                  {query === "" ? "Links" : "Matches"}
                </span>
                <span className="tabular-nums text-muted-foreground-3">
                  {query === "" ? data.total : visible.length}
                </span>
              </td>
            </Row>
            {query !== "" && data.pageCount > 1 && (
              <Row interactive={false}>
                <td className={cn(cell, "col-span-full")}>
                  <span className="text-xs font-normal text-muted-foreground-2">
                    Matches cover page {data.page} of {data.pageCount}
                  </span>
                </td>
              </Row>
            )}
            {visible.map(({ share, scopeLabel }) => {
              const visibility = actions.visibilityOf(share);
              const option = SHARE_VISIBILITIES.find(
                (candidate) => candidate.id === visibility,
              );
              const open = shareOpenTarget(share);
              return (
                <Row key={share.id}>
                  <td className={cn(cell, "gap-2.5")}>
                    <Icon
                      name="file-text"
                      className="size-4 shrink-0 text-muted-foreground-1"
                    />
                    <span className="flex min-w-0 flex-col">
                      <Link
                        data-track-owner={track("SharedPage:Link.1")}
                        {...open}
                        search={{ file: share.path }}
                        className="focus-gutter truncate rounded text-sm font-medium text-foreground outline-none hover:underline focus-visible:outline-ring-inset"
                      >
                        {share.path}
                      </Link>
                      <span className="truncate text-xs font-normal text-muted-foreground-2 md:hidden">
                        {scopeLabel}
                      </span>
                    </span>
                  </td>
                  <td className={cn(cell, "max-md:hidden")}>
                    <span className="truncate">{scopeLabel}</span>
                  </td>
                  <td className={cell}>
                    {option !== undefined && (
                      <Badge
                        size="sm"
                        className="inline-flex items-center gap-1"
                      >
                        <option.icon className="size-(--icon-xs)" />
                        {option.label}
                      </Badge>
                    )}
                  </td>
                  <td className={cn(cell, "max-md:hidden")}>
                    <span className="truncate">
                      {share.createdBy ?? "Unknown"}
                    </span>
                  </td>
                  <td className={cn(cell, "max-md:hidden")}>
                    {share.changedAt === null ? (
                      <span className="truncate text-muted-foreground-3">
                        Not in drive
                      </span>
                    ) : (
                      <span className="truncate" suppressHydrationWarning>
                        {formatChanged(share.changedAt, now)}
                      </span>
                    )}
                  </td>
                  <ShareRowActions
                    share={share}
                    visibility={visibility}
                    removing={actions.removing}
                    onVisibility={(to) => actions.setVisibility(share, to)}
                    onRemove={() => actions.remove(share)}
                  />
                </Row>
              );
            })}
            {visible.length === 0 && (
              <Row interactive={false}>
                <td className={cn(cell, "col-span-full")}>
                  <span className="text-xs font-normal text-muted-foreground-2">
                    No shared files match “{search.trim()}”
                  </span>
                </td>
              </Row>
            )}
          </tbody>
        </table>
      </div>
    );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SharedTopBar
        search={search}
        searching={searching}
        onSearch={setSearch}
        onSearchingChange={setSearching}
      />
      <div className="min-h-0 flex-1 overflow-y-auto md:scroll-fade-y">
        <div className="flex w-full flex-col gap-5 px-6 py-4">
          {body}
          {data !== undefined && data.pageCount > 1 && (
            <div className="flex items-center justify-between gap-3">
              <Button
                data-track-owner={track("SharedPage:Button[Previous]")}
                size="sm"
                variant="ghost"
                disabled={data.page <= 1}
                onClick={() => setPage(Math.max(1, data.page - 1))}
              >
                Previous
              </Button>
              <span className="text-xs tabular-nums text-muted-foreground-2">
                Page {data.page} of {data.pageCount}
              </span>
              <Button
                data-track-owner={track("SharedPage:Button[Next]")}
                size="sm"
                variant="ghost"
                disabled={data.page >= data.pageCount}
                onClick={() => setPage(Math.min(data.pageCount, data.page + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
