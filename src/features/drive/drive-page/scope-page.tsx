// biome-ignore-all lint/a11y: Capy's directory table is an ARIA grid of div subgrid rows (role table/row/cell), class for class from the bundle
import { useAtomValue } from "@effect/atom-react";
import { Link } from "@tanstack/react-router";
import { DateTime } from "effect";
import { Fragment } from "react";
import type { Volume } from "@/data/api/schemas/drive";
import type { OrgId } from "@/data/api/schemas/ids";
import { driveVolumesAtom } from "@/data/atoms/drive";
import { useIsNarrow } from "@/primitives/sidebar";
import { formatBytes, formatRelativeTime } from "../lib/format";
import { type DriveMount, mountScope, mountTrail } from "../lib/mount";
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

/**
 * One drive, as Capy mounts it: the volumes a scope holds. The scope routes
 * hand it a mount; the drive root links here.
 */
export function DriveScopePage({ mount }: { mount: DriveMount }) {
  const session = useDriveSession();
  return (
    <div className="flex h-full min-h-0 flex-col">
      <DriveTopBar
        title={
          session.orgId === undefined ? (
            mountTrail(mount, {}, true).title
          ) : (
            <ScopeTitle
              mount={mount}
              orgId={session.orgId}
              orgName={session.orgName}
              userId={session.userId}
            />
          )
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto md:scroll-fade-y">
        {session.orgId !== undefined && (
          <ScopeVolumes
            mount={mount}
            orgId={session.orgId}
            userId={session.userId}
          />
        )}
      </div>
    </div>
  );
}

function ScopeTitle({
  mount,
  orgId,
  orgName,
  userId,
}: {
  mount: DriveMount;
  orgId: OrgId;
  orgName: string | undefined;
  userId: string | undefined;
}) {
  const names = useDriveNames(orgId, orgName, userId);
  const known =
    mount.kind === "captain"
      ? names.captains.find((captain) => captain.id === mount.jamId)?.name
      : mount.kind === "automation"
        ? names.automations.find(
            (automation) => automation.id === mount.automationId,
          )?.name
        : mount.kind === "project"
          ? names.projects.find((project) => project.id === mount.projectId)
              ?.name
          : undefined;
  const trail = mountTrail(
    mount,
    {
      organization: orgName,
      captain: known,
      automation: known,
      project: known,
    },
    true,
  );
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {trail.crumbs.map((crumb) => (
        <Fragment key={crumb.label}>
          <Link
            to={crumb.to ?? (crumb.route?.to as "/drive")}
            params={crumb.route?.params as never}
            className="shrink-0 text-muted-foreground-1 outline-none hover:text-foreground focus-visible:outline-ring-inset"
          >
            {crumb.label}
          </Link>
          <span aria-hidden="true" className="text-muted-foreground-3">
            /
          </span>
        </Fragment>
      ))}
      <span className="truncate text-foreground">{trail.title}</span>
    </span>
  );
}

const volumeRows = (volumes: ReadonlyArray<Volume>, now: number) =>
  volumes
    .map((volume) => ({
      id: volume.id as string,
      name: volume.name,
      namespace: volume.namespace,
      fileCount: volume.fileCount,
      totalBytes: volume.totalBytes,
      headUpdatedAt:
        volume.headUpdatedAt === null
          ? null
          : DateTime.toDate(volume.headUpdatedAt),
      now,
    }))
    .toSorted((a, b) => a.name.localeCompare(b.name));

const scopeQuery = (mount: DriveMount, userId: string | undefined) => {
  const scope = mountScope(mount, userId);
  return {
    projectId: scope.projectId ?? undefined,
    userId: scope.userId ?? undefined,
    automationId: scope.automationId ?? undefined,
    captainJamId: scope.captainJamId ?? undefined,
  };
};

function ScopeVolumes({
  mount,
  orgId,
  userId,
}: {
  mount: DriveMount;
  orgId: OrgId;
  userId: string | undefined;
}) {
  const narrow = useIsNarrow();
  const result = useAtomValue(
    driveVolumesAtom(orgId, scopeQuery(mount, userId)),
  );
  const volumes = resultValue(result);
  const rows = volumeRows(volumes ?? [], Date.now());
  return (
    <div className="flex w-full flex-col gap-5 px-6 py-4">
      <div className="-mx-4">
        <DirectoryTable
          columns={
            narrow
              ? "minmax(0,1fr) minmax(min-content,auto) minmax(min-content,auto)"
              : "minmax(0,3fr) minmax(0,1.6fr) minmax(min-content,auto) minmax(min-content,auto)"
          }
        >
          <DirectoryTableHeader>
            <DirectoryTableHead>Name</DirectoryTableHead>
            {!narrow && <DirectoryTableHead>Folder</DirectoryTableHead>}
            <DirectoryTableHead>Files</DirectoryTableHead>
            <DirectoryTableHead className="justify-end">
              Size
            </DirectoryTableHead>
            {!narrow && <DirectoryTableHead>Updated</DirectoryTableHead>}
          </DirectoryTableHeader>
          <DirectoryTableSection label="Drives" count={rows.length} />
          {rows.map((row) => (
            <DirectoryTableRow key={row.id} interactive={false}>
              <DirectoryTableCell className="gap-2.5">
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {row.name}
                  </span>
                  {narrow && (
                    <span className="truncate text-xs font-normal text-muted-foreground-2">
                      {row.namespace}
                    </span>
                  )}
                </span>
              </DirectoryTableCell>
              {!narrow && (
                <DirectoryTableCell>
                  <span className="truncate">{row.namespace}</span>
                </DirectoryTableCell>
              )}
              <DirectoryTableCell className="tabular-nums">
                {row.fileCount}
              </DirectoryTableCell>
              <DirectoryTableCell className="justify-end tabular-nums">
                {formatBytes(row.totalBytes)}
              </DirectoryTableCell>
              {!narrow && (
                <DirectoryTableCell>
                  {row.headUpdatedAt !== null && (
                    <span className="truncate">
                      {formatRelativeTime(row.headUpdatedAt, { now: row.now })}
                    </span>
                  )}
                </DirectoryTableCell>
              )}
            </DirectoryTableRow>
          ))}
          {rows.length === 0 && (
            <DirectoryTableRow interactive={false}>
              <DirectoryTableCell className="col-span-full">
                <span className="flex flex-col gap-1 py-2">
                  <span className="text-sm font-medium text-foreground">
                    No files yet
                  </span>
                  <span className="text-xs font-normal text-muted-foreground-2">
                    Add a skill or instructions by hand, or ask Capy in a thread
                  </span>
                </span>
              </DirectoryTableCell>
            </DirectoryTableRow>
          )}
        </DirectoryTable>
      </div>
    </div>
  );
}
