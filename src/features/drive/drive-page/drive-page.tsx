// biome-ignore-all lint/a11y: Capy's directory table is an ARIA grid of div subgrid rows (role table/row/cell), class for class from the bundle
import { useAtomValue } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import { DateTime } from "effect";
import { useState } from "react";
import { driveScopeDirectoryAtom } from "@/data/atoms/drive";
import { Button } from "@/primitives/button";
import { BuildingIcon, InboxIcon, ShareIcon, UserIcon } from "../icons";
import { formatBytes, formatRelativeTime } from "../lib/format";
import { targetRoute } from "../lib/mount";
import {
  compareRows,
  type DriveOrdering,
  type DriveScopeRow,
  type DriveScopeSummary,
  directoryRows,
  driveOrderings,
} from "../lib/scopes";
import {
  DirectoryTable,
  DirectoryTableCell,
  DirectoryTableHead,
  DirectoryTableHeader,
  DirectoryTableRow,
  DirectoryTableSection,
  tableRowClass,
} from "./directory-table";
import { DriveDisplayMenu } from "./display-menu";
import { DriveTopBar } from "./drive-top-bar";
import { useDriveNames } from "./names";
import { resultValue, useDriveSession } from "./session";
import { DriveUsageFooter, usageSegments } from "./usage-footer";
import { useNarrow } from "./use-narrow";

const pageSize = 50;
const orderingKey = "capy-web:volume-ordering";

const storedOrdering = (): DriveOrdering => {
  const value =
    typeof localStorage === "undefined"
      ? null
      : localStorage.getItem(orderingKey);
  const parsed = value === null ? undefined : (JSON.parse(value) as unknown);
  return driveOrderings.find((option) => option === parsed) ?? "updated";
};

/** Capy Drive's root: every scope the viewer can open, with sizes and the storage meter. */
export function DrivePage() {
  const session = useDriveSession();
  const [ordering, setOrdering] = useState(storedOrdering);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const narrow = useNarrow();
  const changeOrdering = (next: DriveOrdering) => {
    localStorage.setItem(orderingKey, JSON.stringify(next));
    setOrdering(next);
    setPage(1);
  };
  return (
    <div className="flex h-full min-h-0 flex-col">
      <DriveTopBar
        title="Capy Drive"
        search={{
          value: search,
          placeholder: "Search Capy Drive",
          onValueChange: (value) => {
            setSearch(value);
            setPage(1);
          },
        }}
        trailing={
          <>
            <Button
              variant="ghost"
              size="sm"
              render={<Link to="/drive/shared" />}
            >
              <ShareIcon className="size-(--icon-sm)" />
              Shared
            </Button>
            <DriveDisplayMenu ordering={ordering} onOrdering={changeOrdering} />
          </>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto md:scroll-fade-y">
        {session.orgId !== undefined && (
          <DriveDirectory
            orgId={session.orgId}
            orgName={session.orgName}
            userId={session.userId}
            ordering={ordering}
            search={search}
            page={page}
            onPage={setPage}
            narrow={narrow}
          />
        )}
      </div>
    </div>
  );
}

const toSummary = (summary: {
  readonly projectId: string | null;
  readonly userId: string | null;
  readonly automationId: string | null;
  readonly captainJamId: string | null;
  readonly fileCount: number;
  readonly totalBytes: number;
  readonly headUpdatedAt: DateTime.Utc | null;
}): DriveScopeSummary => ({
  projectId: summary.projectId,
  userId: summary.userId,
  automationId: summary.automationId,
  captainJamId: summary.captainJamId,
  fileCount: summary.fileCount,
  totalBytes: summary.totalBytes,
  headUpdatedAt:
    summary.headUpdatedAt === null
      ? null
      : DateTime.toDate(summary.headUpdatedAt),
});

const matches = (row: DriveScopeRow, term: string) =>
  [row.label, row.scopeLabel].some((text) => text.toLowerCase().includes(term));

function DriveDirectory({
  orgId,
  orgName,
  userId,
  ordering,
  search,
  page,
  onPage,
  narrow,
}: {
  orgId: string;
  orgName: string | undefined;
  userId: string | undefined;
  ordering: DriveOrdering;
  search: string;
  page: number;
  onPage: (page: number) => void;
  narrow: boolean;
}) {
  const directory = resultValue(useAtomValue(driveScopeDirectoryAtom(orgId)));
  const names = useDriveNames(orgId, orgName, userId);
  const [active, setActive] = useState<string>();
  const rows = directoryRows(
    (directory?.items ?? []).map(toSummary),
    names,
  ).toSorted(compareRows(ordering));
  const term = search.trim().toLowerCase();
  const searching = term !== "";
  const listed = searching ? rows.filter((row) => matches(row, term)) : rows;
  const pageCount = Math.max(1, Math.ceil(listed.length / pageSize));
  const current = Math.min(page, pageCount);
  const visible = listed.slice((current - 1) * pageSize, current * pageSize);
  const total = Math.max(directory?.totalScopes ?? 0, rows.length);
  const now = Date.now();
  const storage = directory?.storage;
  return (
    <div className="flex w-full flex-col gap-5 px-6 py-4">
      <div className="-mx-4">
        <DirectoryTable
          columns={
            narrow
              ? "minmax(0,1fr) minmax(3rem,auto) minmax(3.5rem,auto)"
              : "minmax(0,3fr) minmax(0,1.6fr) minmax(3.5rem,auto) minmax(4.5rem,auto) minmax(6rem,auto)"
          }
        >
          <DirectoryTableHeader>
            <DirectoryTableHead>Name</DirectoryTableHead>
            {!narrow && <DirectoryTableHead>Shared with</DirectoryTableHead>}
            <DirectoryTableHead>Files</DirectoryTableHead>
            <DirectoryTableHead className="justify-end">
              Size
            </DirectoryTableHead>
            {!narrow && <DirectoryTableHead>Updated</DirectoryTableHead>}
          </DirectoryTableHeader>
          <DirectoryTableSection
            label={searching ? "Matches" : "Scopes"}
            count={searching ? listed.length : total}
          />
          {visible.map((row) => (
            <ScopeRow
              key={row.key}
              row={row}
              narrow={narrow}
              now={now}
              active={active === row.key}
              onActive={(on) => setActive(on ? row.key : undefined)}
            />
          ))}
          {searching && listed.length === 0 && (
            <DirectoryTableRow interactive={false}>
              <DirectoryTableCell className="col-span-full">
                <span className="text-xs font-normal text-muted-foreground-2">
                  No matches
                </span>
              </DirectoryTableCell>
            </DirectoryTableRow>
          )}
          {storage !== undefined && storage.usedBytes > 0 && (
            <DriveUsageFooter
              facts={storage}
              segments={usageSegments(rows)}
              activeKey={active}
              onActiveKey={setActive}
              narrow={narrow}
            />
          )}
        </DirectoryTable>
      </div>
      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-3">
          <Button
            size="sm"
            variant="ghost"
            disabled={current <= 1}
            onClick={() => onPage(Math.max(1, current - 1))}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground-2 tabular-nums">
            Page {current} of {pageCount}
          </span>
          <Button
            size="sm"
            variant="ghost"
            disabled={current >= pageCount}
            onClick={() => onPage(Math.min(pageCount, current + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function ScopeIcon({ row }: { row: DriveScopeRow }) {
  const iconClass = "size-(--icon-base) shrink-0 text-muted-foreground-1";
  const target = row.target;
  if (target.kind === "captain") {
    return (
      <span
        aria-hidden="true"
        className="flex size-(--icon-base) shrink-0 items-center justify-center rounded-xs bg-secondary text-2xs font-medium text-foreground"
      >
        {row.label.slice(0, 1)}
      </span>
    );
  }
  if (target.kind === "organization")
    return <BuildingIcon className={iconClass} />;
  if (target.kind === "automation") return <InboxIcon className={iconClass} />;
  return row.personal ? (
    <UserIcon className={iconClass} />
  ) : (
    <InboxIcon className={iconClass} />
  );
}

function ScopeRow({
  row,
  narrow,
  now,
  active,
  onActive,
}: {
  row: DriveScopeRow;
  narrow: boolean;
  now: number;
  active: boolean;
  onActive: (active: boolean) => void;
}) {
  const route = targetRoute(row.target);
  return (
    <Link
      to={route.to}
      params={route.params as never}
      role="row"
      data-active={active || undefined}
      className={`${tableRowClass} outline-none select-none focus-visible:before:outline-ring-inset data-active:before:bg-section`}
      onMouseEnter={() => onActive(true)}
      onMouseLeave={() => onActive(false)}
      onFocus={() => onActive(true)}
      onBlur={() => onActive(false)}
    >
      <DirectoryTableCell className="gap-2.5">
        <ScopeIcon row={row} />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-foreground">
            {row.label}
          </span>
          {narrow && (
            <span className="truncate text-xs font-normal text-muted-foreground-2">
              {row.scopeLabel}
            </span>
          )}
        </span>
      </DirectoryTableCell>
      {!narrow && (
        <DirectoryTableCell>
          <span className="truncate">{row.scopeLabel}</span>
        </DirectoryTableCell>
      )}
      <DirectoryTableCell className="tabular-nums">
        {row.summary.fileCount}
      </DirectoryTableCell>
      <DirectoryTableCell className="justify-end tabular-nums">
        {formatBytes(row.summary.totalBytes)}
      </DirectoryTableCell>
      {!narrow && (
        <DirectoryTableCell>
          {row.summary.headUpdatedAt !== null && (
            <span className="truncate">
              {formatRelativeTime(row.summary.headUpdatedAt, { now })}
            </span>
          )}
        </DirectoryTableCell>
      )}
    </Link>
  );
}
