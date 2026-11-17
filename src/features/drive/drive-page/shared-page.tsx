// biome-ignore-all lint/a11y: Capy's directory table is an ARIA grid of div subgrid rows (role table/row/cell), class for class from the bundle
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import { DateTime } from "effect";
import { AsyncResult } from "effect/reactivity";
import { useState } from "react";
import type { DriveShareListing } from "@/data/api/schemas/drive";
import {
  driveOrgSharesAtom,
  driveReactivityKey,
  driveRevokeShare,
  driveUpdateShare,
} from "@/data/atoms/drive";
import { Button } from "@/primitives/button";
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from "@/primitives/menu";
import { ShareIcon } from "../icons";
import { formatRelativeTime } from "../lib/format";
import { targetRoute } from "../lib/mount";
import { scopeRows } from "../lib/scopes";
import {
  DirectoryTable,
  DirectoryTableCell,
  DirectoryTableHead,
  DirectoryTableHeader,
  DirectoryTableRow,
  DirectoryTableSection,
} from "./directory-table";
import { DriveTopBar } from "./drive-top-bar";
import { useDriveNames } from "./names";
import { resultValue, useDriveSession } from "./session";
import { useNarrow } from "./use-narrow";

export const shareVisibilities = [
  {
    id: "private",
    label: "Only you",
    description: "Only you can open this link",
  },
  {
    id: "org",
    label: "Organization",
    description: "Members who can see this drive can open it",
  },
  {
    id: "public",
    label: "Anyone",
    description: "Anyone with the link can open it, no account needed",
  },
] as const;

/** The in-app preview of a share link, as Capy's share popover builds it. */
export const sharePreviewUrl = (url: string) => `${url}?view=share`;

/** Where "Open in Capy Drive" goes for a share, by the scope that holds it. */
export const shareRoute = (share: {
  readonly projectId: string | null;
  readonly userId: string | null;
  readonly automationId: string | null;
  readonly captainJamId: string | null;
}) =>
  targetRoute(
    share.captainJamId !== null
      ? { kind: "captain", jamId: share.captainJamId }
      : share.automationId !== null
        ? { kind: "automation", automationId: share.automationId }
        : share.projectId !== null
          ? {
              kind: "project",
              projectId: share.projectId,
              personal: share.userId !== null,
            }
          : share.userId !== null
            ? { kind: "personal" }
            : { kind: "organization" },
  );

/** The scope label a share row shows, with Capy's fallbacks for gone scopes. */
export const shareScopeLabel = (
  share: DriveShareListing,
  names: Parameters<typeof scopeRows>[1],
) =>
  scopeRows(
    [
      {
        projectId: share.projectId,
        userId: share.userId,
        automationId: share.automationId,
        captainJamId: share.captainJamId,
        fileCount: 0,
        totalBytes: 0,
        headUpdatedAt: null,
      },
    ],
    names,
  )[0]?.label ??
  (share.captainJamId !== null
    ? "Captain"
    : share.automationId !== null
      ? "A deleted automation"
      : share.projectId !== null
        ? "A deleted project"
        : "Another drive");

const copy = (url: string) =>
  navigator.clipboard.writeText(new URL(url, window.location.href).href);

function SharedEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <ShareIcon className="size-(--icon-base) text-muted-foreground-2" />
      <h2 className="text-base font-medium">{title}</h2>
      <p className="text-sm text-muted-foreground-1">{description}</p>
    </div>
  );
}

/** Capy Drive's Shared page: every share link in the organization. */
export function SharedPage() {
  const session = useDriveSession();
  const [search, setSearch] = useState("");
  return (
    <div className="flex h-full min-h-0 flex-col">
      <DriveTopBar
        title={
          <span className="flex min-w-0 items-center gap-1.5">
            <Link
              to="/drive"
              className="min-w-0 truncate rounded font-medium text-muted-foreground-2 outline-none transition-colors duration-100 hover:text-foreground focus-visible:outline-ring-inset"
            >
              Capy Drive
            </Link>
            <span aria-hidden="true" className="text-muted-foreground-3">
              ›
            </span>
            <span className="min-w-0 truncate">Shared</span>
          </span>
        }
        search={{
          value: search,
          placeholder: "Search shared files",
          onValueChange: setSearch,
        }}
      />
      <div className="min-h-0 flex-1 overflow-y-auto md:scroll-fade-y">
        <div className="flex w-full flex-col gap-5 px-6 py-4">
          {session.orgId !== undefined && (
            <SharedList
              orgId={session.orgId}
              orgName={session.orgName}
              userId={session.userId}
              search={search}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function SharedList({
  orgId,
  orgName,
  userId,
  search,
}: {
  orgId: string;
  orgName: string | undefined;
  userId: string | undefined;
  search: string;
}) {
  const [page, setPage] = useState(1);
  const result = useAtomValue(driveOrgSharesAtom(orgId, page));
  const names = useDriveNames(orgId, orgName, userId);
  const narrow = useNarrow();
  const directory = resultValue(result);
  if (directory === undefined) {
    return AsyncResult.isFailure(result) ? (
      <SharedEmpty
        title="Shared files are unavailable"
        description="Could not read the share links for this organization"
      />
    ) : (
      <div className="flex flex-col gap-3 pt-2">
        <div className="h-8 w-full animate-skeleton-pulse rounded bg-secondary" />
        <div className="h-8 w-full animate-skeleton-pulse rounded bg-secondary" />
        <div className="h-8 w-2/3 animate-skeleton-pulse rounded bg-secondary" />
      </div>
    );
  }
  if (directory.total === 0) {
    return (
      <SharedEmpty
        title="Nothing shared yet"
        description="Share a file from its page in Capy Drive and it appears here"
      />
    );
  }
  const term = search.trim().toLowerCase();
  const rows = directory.items.map((share) => ({
    share,
    scopeLabel: shareScopeLabel(share, names),
  }));
  const shown =
    term === ""
      ? rows
      : rows.filter((row) =>
          [row.share.path, row.scopeLabel].some((text) =>
            text.toLowerCase().includes(term),
          ),
        );
  const now = Date.now();
  return (
    <>
      <div className="-mx-4">
        <DirectoryTable
          columns={
            narrow
              ? "minmax(0,1fr) minmax(6rem,auto) auto"
              : "minmax(0,3fr) minmax(0,1.4fr) minmax(7rem,auto) minmax(0,1.2fr) minmax(6rem,auto) auto"
          }
        >
          <DirectoryTableHeader>
            <DirectoryTableHead>File</DirectoryTableHead>
            {!narrow && <DirectoryTableHead>Drive</DirectoryTableHead>}
            <DirectoryTableHead>Who can open</DirectoryTableHead>
            {!narrow && <DirectoryTableHead>Shared by</DirectoryTableHead>}
            {!narrow && <DirectoryTableHead>Changed</DirectoryTableHead>}
            <DirectoryTableHead aria-hidden="true" />
          </DirectoryTableHeader>
          <DirectoryTableSection
            label={term === "" ? "Links" : "Matches"}
            count={term === "" ? directory.total : shown.length}
          />
          {term !== "" && directory.pageCount > 1 && (
            <DirectoryTableRow interactive={false}>
              <DirectoryTableCell className="col-span-full">
                <span className="text-xs font-normal text-muted-foreground-2">
                  Matches cover page {directory.page} of {directory.pageCount}
                </span>
              </DirectoryTableCell>
            </DirectoryTableRow>
          )}
          {shown.map((row) => (
            <SharedRow
              key={row.share.id}
              orgId={orgId}
              share={row.share}
              scopeLabel={row.scopeLabel}
              narrow={narrow}
              now={now}
            />
          ))}
          {shown.length === 0 && (
            <DirectoryTableRow interactive={false}>
              <DirectoryTableCell className="col-span-full">
                <span className="text-xs font-normal text-muted-foreground-2">
                  No shared files match “{search.trim()}”
                </span>
              </DirectoryTableCell>
            </DirectoryTableRow>
          )}
        </DirectoryTable>
      </div>
      {directory.pageCount > 1 && (
        <div className="flex items-center justify-between gap-3">
          <Button
            size="sm"
            variant="ghost"
            disabled={directory.page <= 1}
            onClick={() => setPage(Math.max(1, directory.page - 1))}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground-2 tabular-nums">
            Page {directory.page} of {directory.pageCount}
          </span>
          <Button
            size="sm"
            variant="ghost"
            disabled={directory.page >= directory.pageCount}
            onClick={() =>
              setPage(Math.min(directory.pageCount, directory.page + 1))
            }
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
}

function SharedRow({
  orgId,
  share,
  scopeLabel,
  narrow,
  now,
}: {
  orgId: string;
  share: DriveShareListing;
  scopeLabel: string;
  narrow: boolean;
  now: number;
}) {
  const update = useAtomSet(driveUpdateShare);
  const revoke = useAtomSet(driveRevokeShare);
  const open = shareRoute(share);
  const visibility = shareVisibilities.find((v) => v.id === share.visibility);
  const keys = [driveReactivityKey(orgId), `drive-share:${share.id}`];
  return (
    <DirectoryTableRow>
      <DirectoryTableCell className="gap-2.5">
        <span className="flex min-w-0 flex-col">
          <Link
            to={open.to}
            params={open.params as never}
            search={{ file: share.path } as never}
            className="truncate rounded text-sm font-medium text-foreground outline-none hover:underline focus-visible:outline-ring-inset"
          >
            {share.path}
          </Link>
          {narrow && (
            <span className="truncate text-xs font-normal text-muted-foreground-2">
              {scopeLabel}
            </span>
          )}
        </span>
      </DirectoryTableCell>
      {!narrow && (
        <DirectoryTableCell>
          <span className="truncate">{scopeLabel}</span>
        </DirectoryTableCell>
      )}
      <DirectoryTableCell>
        {visibility !== undefined && (
          <span data-slot="badge">{visibility.label}</span>
        )}
      </DirectoryTableCell>
      {!narrow && (
        <DirectoryTableCell>
          <span className="truncate">{share.createdBy ?? "Unknown"}</span>
        </DirectoryTableCell>
      )}
      {!narrow && (
        <DirectoryTableCell>
          {share.changedAt === null ? (
            <span className="truncate text-muted-foreground-3">
              Not in drive
            </span>
          ) : (
            <span className="truncate">
              {formatRelativeTime(DateTime.toDate(share.changedAt), { now })}
            </span>
          )}
        </DirectoryTableCell>
      )}
      <DirectoryTableCell className="justify-end gap-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Copy link"
          disabled={share.visibility === "private" && !share.manageable}
          onClick={() => void copy(share.url)}
        >
          <ShareIcon className="size-(--icon-sm)" />
        </Button>
        <Menu>
          <MenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${share.path}`}
              />
            }
          >
            <span aria-hidden="true">⋯</span>
          </MenuTrigger>
          <MenuContent align="end" className="w-56">
            <MenuItem
              render={
                <Link
                  to={open.to}
                  params={open.params as never}
                  search={{ file: share.path } as never}
                />
              }
            >
              Open in Capy Drive
            </MenuItem>
            <MenuItem
              render={
                <a
                  href={sharePreviewUrl(share.url)}
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              Open link
            </MenuItem>
            {share.manageable && (
              <>
                <MenuSeparator />
                <MenuGroup>
                  <MenuLabel>Who can open</MenuLabel>
                  {shareVisibilities.map((option) => (
                    <MenuItem
                      key={option.id}
                      aria-checked={share.visibility === option.id}
                      onClick={() =>
                        update({
                          params: { orgId: orgId as never, shareId: share.id },
                          payload: { visibility: option.id },
                          reactivityKeys: keys,
                        })
                      }
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </MenuGroup>
                <MenuSeparator />
                <MenuItem
                  intent="danger"
                  onClick={() =>
                    revoke({
                      params: { orgId: orgId as never, shareId: share.id },
                      reactivityKeys: keys,
                    })
                  }
                >
                  Remove link
                </MenuItem>
              </>
            )}
          </MenuContent>
        </Menu>
      </DirectoryTableCell>
    </DirectoryTableRow>
  );
}
