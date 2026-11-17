import { Atom } from "effect/reactivity";
import { ApiClient } from "../client/ApiClient.ts";
import { queryTimeToLive } from "./conventions.ts";

/**
 * Capy Drive atoms, mirroring Capy's: every drive query shares the
 * `volume:<orgId>` reactivity key, so any drive mutation refetches them all.
 * Families key on a JSON string because family keys compare by reference.
 */
export const driveReactivityKey = (orgId: string) => `volume:${orgId}`;

const keyed = <A>(value: A) => JSON.stringify(value);
const parse = <A>(key: string) => JSON.parse(key) as A;

export interface DriveScopeQuery {
  readonly projectId?: string;
  readonly userId?: string;
  readonly automationId?: string;
  readonly captainJamId?: string;
}

const scopeDirectoryFamily = Atom.family((key: string) => {
  const { orgId, page } = parse<{ orgId: string; page: number }>(key);
  return ApiClient.query("volumes", "scopeDirectory", {
    params: { orgId: orgId as never },
    query: { page },
    reactivityKeys: [driveReactivityKey(orgId)],
    timeToLive: queryTimeToLive,
  });
});

export const driveScopeDirectoryAtom = (orgId: string, page = 1) =>
  scopeDirectoryFamily(keyed({ orgId, page }));

const volumesFamily = Atom.family((key: string) => {
  const { orgId, scope } = parse<{ orgId: string; scope: DriveScopeQuery }>(
    key,
  );
  return ApiClient.query("volumes", "list", {
    params: { orgId: orgId as never },
    query: { ...(scope as object), exactScope: "true" },
    reactivityKeys: [driveReactivityKey(orgId)],
    timeToLive: queryTimeToLive,
  });
});

/** The volumes of exactly one scope (unset fields mean "none"). */
export const driveVolumesAtom = (orgId: string, scope: DriveScopeQuery) =>
  volumesFamily(keyed({ orgId, scope }));

const folderFamily = Atom.family((key: string) => {
  const { orgId, volumeId, versionId, dir } = parse<{
    orgId: string;
    volumeId: string;
    versionId: string;
    dir: string;
  }>(key);
  return ApiClient.query("volumes", "manifest", {
    params: {
      orgId: orgId as never,
      volumeId: volumeId as never,
      versionId: versionId as never,
    },
    query: { dir },
    reactivityKeys: [driveReactivityKey(orgId)],
    timeToLive: queryTimeToLive,
  });
});

/** One folder of a volume version (`dir` "" is the root). */
export const driveFolderAtom = (
  orgId: string,
  volumeId: string,
  versionId: string,
  dir: string,
) => folderFamily(keyed({ orgId, volumeId, versionId, dir }));

const treeFamily = Atom.family((key: string) => {
  const { orgId, volumeId, versionId } = parse<{
    orgId: string;
    volumeId: string;
    versionId: string;
  }>(key);
  return ApiClient.query("volumes", "tree", {
    params: {
      orgId: orgId as never,
      volumeId: volumeId as never,
      versionId: versionId as never,
    },
    query: {},
    reactivityKeys: [driveReactivityKey(orgId)],
    timeToLive: queryTimeToLive,
  });
});

/** Every file of a volume version, for search and the file pane. */
export const driveTreeAtom = (
  orgId: string,
  volumeId: string,
  versionId: string,
) => treeFamily(keyed({ orgId, volumeId, versionId }));

const fileFamily = Atom.family((key: string) => {
  const { orgId, volumeId, versionId, sha256 } = parse<{
    orgId: string;
    volumeId: string;
    versionId: string;
    sha256: string;
  }>(key);
  return ApiClient.query("volumes", "file", {
    params: {
      orgId: orgId as never,
      volumeId: volumeId as never,
      versionId: versionId as never,
      sha256,
    },
    reactivityKeys: [driveReactivityKey(orgId)],
    timeToLive: queryTimeToLive,
  });
});

export const driveFileAtom = (
  orgId: string,
  volumeId: string,
  versionId: string,
  sha256: string,
) => fileFamily(keyed({ orgId, volumeId, versionId, sha256 }));

const versionsFamily = Atom.family((key: string) => {
  const { orgId, volumeId } = parse<{ orgId: string; volumeId: string }>(key);
  return ApiClient.query("volumes", "versions", {
    params: { orgId: orgId as never, volumeId: volumeId as never },
    reactivityKeys: [driveReactivityKey(orgId)],
    timeToLive: queryTimeToLive,
  });
});

export const driveVersionsAtom = (orgId: string, volumeId: string) =>
  versionsFamily(keyed({ orgId, volumeId }));

const changesFamily = Atom.family((key: string) => {
  const { orgId, volumeId, versionId } = parse<{
    orgId: string;
    volumeId: string;
    versionId: string;
  }>(key);
  return ApiClient.query("volumes", "changes", {
    params: {
      orgId: orgId as never,
      volumeId: volumeId as never,
      versionId: versionId as never,
    },
    reactivityKeys: [driveReactivityKey(orgId)],
    timeToLive: queryTimeToLive,
  });
});

export const driveChangesAtom = (
  orgId: string,
  volumeId: string,
  versionId: string,
) => changesFamily(keyed({ orgId, volumeId, versionId }));

const fileVersionsFamily = Atom.family((key: string) => {
  const { orgId, volumeId, path } = parse<{
    orgId: string;
    volumeId: string;
    path: string;
  }>(key);
  return ApiClient.query("volumes", "fileVersions", {
    params: { orgId: orgId as never, volumeId: volumeId as never },
    query: { path },
    reactivityKeys: [driveReactivityKey(orgId)],
    timeToLive: queryTimeToLive,
  });
});

export const driveFileVersionsAtom = (
  orgId: string,
  volumeId: string,
  path: string,
) => fileVersionsFamily(keyed({ orgId, volumeId, path }));

const sharesFamily = Atom.family((key: string) => {
  const { orgId, volumeId } = parse<{ orgId: string; volumeId: string }>(key);
  return ApiClient.query("volumes", "listShares", {
    params: { orgId: orgId as never, volumeId: volumeId as never },
    reactivityKeys: [driveReactivityKey(orgId)],
    timeToLive: queryTimeToLive,
  });
});

export const driveSharesAtom = (orgId: string, volumeId: string) =>
  sharesFamily(keyed({ orgId, volumeId }));

const orgSharesFamily = Atom.family((key: string) => {
  const { orgId, page } = parse<{ orgId: string; page: number }>(key);
  return ApiClient.query("volumes", "listOrgShares", {
    params: { orgId: orgId as never },
    query: { page },
    reactivityKeys: [driveReactivityKey(orgId)],
    timeToLive: queryTimeToLive,
  });
});

export const driveOrgSharesAtom = (orgId: string, page = 1) =>
  orgSharesFamily(keyed({ orgId, page }));

export const driveShareAtom = Atom.family((shareId: string) =>
  ApiClient.query("volumes", "readShare", {
    params: { shareId: shareId as never },
    reactivityKeys: [`drive-share:${shareId}`],
    timeToLive: queryTimeToLive,
  }),
);

export const drivePublicShareAtom = Atom.family((shareId: string) =>
  ApiClient.query("volumes", "publicShare", {
    params: { shareId: shareId as never },
    reactivityKeys: [`drive-share:${shareId}`],
    timeToLive: queryTimeToLive,
  }),
);

export const driveWrite = ApiClient.mutation("volumes", "write");
export const driveRestore = ApiClient.mutation("volumes", "restore");
export const drivePurgeName = ApiClient.mutation("volumes", "purgeName");
export const driveCreateShare = ApiClient.mutation("volumes", "createShare");
export const driveUpdateShare = ApiClient.mutation("volumes", "updateShare");
export const driveRevokeShare = ApiClient.mutation("volumes", "revokeShare");
export const driveArchive = ApiClient.mutation("volumes", "archive");
export const driveUnarchive = ApiClient.mutation("volumes", "unarchive");
