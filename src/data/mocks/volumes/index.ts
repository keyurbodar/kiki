import { DateTime, Effect, Ref } from "effect";
import {
  DrivePurgeNameResult,
  DriveShare,
  DriveShareDirectory,
  type DriveShareId,
  DriveShareListing,
  DriveShareNotFound,
  DriveSharePathNotFound,
  DriveShareRestricted,
  DriveShareView,
  Volume,
  VolumeChange,
  VolumeFileContent,
  VolumeFileNotFound,
  VolumeFileRemoval,
  VolumeFileVersion,
  VolumeFolderEntry,
  VolumeFolderPage,
  VolumeHeadMoved,
  type VolumeId,
  VolumeManifest,
  VolumeManifestEntry,
  VolumeNotFound,
  VolumeScopeDirectory,
  VolumeScopeSummary,
  VolumeSkill,
  VolumeTreePage,
  VolumeVersionChanges,
  type VolumeVersionId,
  VolumeVersionNotFound,
  VolumeVersionRow,
} from "../../api/schemas/drive.ts";
import { OrgId } from "../../api/schemas/ids.ts";
import { MockDb } from "../db/MockDb.ts";
import { fixtureNow } from "../fixtures/time.ts";
import { org, orgId, viewer } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  agentContext,
  type FixtureFile,
  type FixtureScope,
  type FixtureShare,
  type FixtureVersion,
  type FixtureVolume,
  sampleShares,
  sampleStorageLimitBytes,
  sampleVolumes,
  shareId,
  versionId,
  volumeId,
} from "./fixtures.ts";

/**
 * A deterministic 64-hex digest standing in for SHA-256: eight seeded 32-bit
 * string hashes. Fixtures only need stable, well-formed digests.
 */
export const digest = (text: string) => {
  let out = "";
  for (let seed = 1; seed <= 8; seed++) {
    let hash = 0x811c9dc5 ^ (seed * 0x9e3779b1);
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    out += (hash >>> 0).toString(16).padStart(8, "0");
  }
  return out;
};

const encoder = new TextEncoder();
const byteSize = (text: string) => encoder.encode(text).length;
const at = (iso: string) => DateTime.makeUnsafe(iso);

const versionDigest = (files: ReadonlyArray<FixtureFile>) =>
  digest(
    files
      .map((file) => `${file.path}:${file.mode ?? 420}:${digest(file.content)}`)
      .sort()
      .join("\n"),
  );

const entryOf = (file: FixtureFile) =>
  new VolumeManifestEntry({
    path: file.path,
    mode: file.mode ?? 420,
    sizeBytes: byteSize(file.content),
    sha256: digest(file.content),
  });

const head = (volume: FixtureVolume) => volume.versions.at(-1);
const totalBytes = (files: ReadonlyArray<FixtureFile>) =>
  files.reduce((sum, file) => sum + byteSize(file.content), 0);

const toVolume = (volume: FixtureVolume) => {
  const latest = head(volume);
  const files = latest?.files ?? [];
  return new Volume({
    id: volume.id as VolumeId,
    namespace: volume.namespace,
    name: volume.name,
    projectId: volume.scope.projectId as Volume["projectId"],
    userId: volume.scope.userId as Volume["userId"],
    automationId: volume.scope.automationId as Volume["automationId"],
    captainJamId: volume.scope.captainJamId as Volume["captainJamId"],
    description: volume.description,
    archived: volume.archived,
    headVersionId: (latest?.id ?? null) as VolumeVersionId | null,
    headDigest: latest ? versionDigest(latest.files) : null,
    fileCount: files.length,
    totalBytes: totalBytes(files),
    headUpdatedAt: latest ? at(latest.createdAt) : null,
  });
};

const toSummary = (volume: FixtureVolume) => {
  const v = toVolume(volume);
  return new VolumeScopeSummary({
    projectId: v.projectId,
    userId: v.userId,
    automationId: v.automationId,
    captainJamId: v.captainJamId,
    fileCount: v.fileCount,
    totalBytes: v.totalBytes,
    headUpdatedAt: v.headUpdatedAt,
  });
};

const toManifest = (volume: FixtureVolume, version: FixtureVersion) => {
  const index = volume.versions.indexOf(version);
  const parent = index > 0 ? volume.versions[index - 1] : undefined;
  return new VolumeManifest({
    versionId: version.id as VolumeVersionId,
    volumeId: volume.id as VolumeId,
    digest: versionDigest(version.files),
    parentDigest: parent ? versionDigest(parent.files) : null,
    entries: version.files.map(entryOf),
    fileCount: version.files.length,
    totalBytes: totalBytes(version.files),
  });
};

/** The immediate children of `dir` ("" is the root), folders first. */
export const folderEntries = (
  files: ReadonlyArray<FixtureFile>,
  dir: string,
) => {
  const prefix = dir === "" ? "" : `${dir.replace(/\/$/u, "")}/`;
  const folders = new Map<string, number>();
  const entries: Array<VolumeFolderEntry> = [];
  for (const file of files) {
    if (!file.path.startsWith(prefix)) continue;
    const rest = file.path.slice(prefix.length);
    const slash = rest.indexOf("/");
    if (slash === -1) {
      entries.push(
        new VolumeFolderEntry({
          name: rest,
          path: file.path,
          kind: "file",
          mode: file.mode ?? 420,
          sizeBytes: byteSize(file.content),
          sha256: digest(file.content),
        }),
      );
      continue;
    }
    const name = rest.slice(0, slash);
    folders.set(name, (folders.get(name) ?? 0) + byteSize(file.content));
  }
  const folderRows = [...folders].map(
    ([name, size]) =>
      new VolumeFolderEntry({
        name,
        path: `${prefix}${name}`,
        kind: "folder",
        mode: 493,
        sizeBytes: size,
        sha256: null,
      }),
  );
  return [
    ...folderRows.sort((a, b) => a.name.localeCompare(b.name)),
    ...entries.sort((a, b) => a.name.localeCompare(b.name)),
  ];
};

/** Paths added, modified or deleted between two file sets. */
export const changesBetween = (
  before: ReadonlyArray<FixtureFile>,
  after: ReadonlyArray<FixtureFile>,
) => {
  const previous = new Map(before.map((file) => [file.path, file]));
  const next = new Map(after.map((file) => [file.path, file]));
  const changes: Array<VolumeChange> = [];
  for (const file of after) {
    const old = previous.get(file.path);
    if (old && old.content === file.content && old.mode === file.mode) continue;
    changes.push(
      new VolumeChange({
        path: file.path,
        change: old ? "modified" : "added",
        sha256: digest(file.content),
        sizeBytes: byteSize(file.content),
        movedFrom: null,
      }),
    );
  }
  for (const file of before) {
    if (next.has(file.path)) continue;
    changes.push(
      new VolumeChange({
        path: file.path,
        change: "deleted",
        sha256: null,
        sizeBytes: 0,
        movedFrom: null,
      }),
    );
  }
  return changes.sort((a, b) => a.path.localeCompare(b.path));
};

const sameScope = (a: FixtureScope, b: FixtureScope) =>
  a.projectId === b.projectId &&
  a.userId === b.userId &&
  a.automationId === b.automationId &&
  a.captainJamId === b.captainJamId;

const scopeOf = (query: {
  readonly projectId?: string | undefined;
  readonly userId?: string | undefined;
  readonly automationId?: string | undefined;
  readonly captainJamId?: string | undefined;
}): FixtureScope => ({
  projectId: query.projectId ?? null,
  userId: query.userId ?? null,
  automationId: query.automationId ?? null,
  captainJamId: query.captainJamId ?? null,
});

const frontmatter = (content: string, key: string) =>
  new RegExp(`^${key}:\\s*(.+)$`, "mu").exec(content)?.[1]?.trim() ?? "";

const nowIso = () => DateTime.formatIso(fixtureNow);

export const VolumesMock = mockGroup("volumes", (handlers) =>
  Effect.gen(function* () {
    const { driveFiles } = yield* MockDb;
    const volumes = yield* Ref.make(sampleVolumes);
    const shares = yield* Ref.make(sampleShares);
    let mintedVersions = 0;
    let mintedShares = 0;
    let mintedVolumes = 0;

    const findVolume = (id: string) =>
      Effect.flatMap(Ref.get(volumes), (all) => {
        const volume = all.find((row) => row.id === id);
        return volume
          ? Effect.succeed(volume)
          : Effect.fail(new VolumeNotFound({ volumeId: id as VolumeId }));
      });

    const findVersion = (volume: FixtureVolume, id: string) => {
      const version = volume.versions.find((row) => row.id === id);
      return version
        ? Effect.succeed(version)
        : Effect.fail(
            new VolumeVersionNotFound({
              volumeId: volume.id as VolumeId,
              versionId: id as VolumeVersionId,
            }),
          );
    };

    const saveVolume = (next: FixtureVolume) =>
      Ref.update(volumes, (all) =>
        all.map((row) => (row.id === next.id ? next : row)),
      );

    const commit = (
      volume: FixtureVolume,
      files: ReadonlyArray<FixtureFile>,
      expectedDigest: string | null,
    ) =>
      Effect.gen(function* () {
        const latest = head(volume);
        const current = latest ? versionDigest(latest.files) : null;
        if (expectedDigest !== null && expectedDigest !== current) {
          return yield* Effect.fail(
            new VolumeHeadMoved({
              volumeId: volume.id as VolumeId,
              headDigest: current,
              paths: changesBetween(latest?.files ?? [], files).map(
                (change) => change.path,
              ),
            }),
          );
        }
        const version: FixtureVersion = {
          id: versionId(`MOCK${++mintedVersions}`),
          kind: "autosave",
          createdAt: nowIso(),
          threadId: null,
          threadTitle: null,
          authorName: `${viewer.firstName} ${viewer.lastName}`,
          files,
        };
        const next = { ...volume, versions: [...volume.versions, version] };
        yield* saveVolume(next);
        return toManifest(next, version);
      });

    const toShare = (share: FixtureShare) =>
      new DriveShare({
        id: share.id as DriveShareId,
        volumeId: share.volumeId as VolumeId,
        path: share.path,
        visibility: share.visibility,
        url: `/s/${share.id}`,
        createdBy: share.createdBy,
        manageable: true,
        createdAt: at(share.createdAt),
      });

    const findShare = (id: string) =>
      Effect.flatMap(Ref.get(shares), (all) => {
        const share = all.find((row) => row.id === id);
        return share
          ? Effect.succeed(share)
          : Effect.fail(
              new DriveShareNotFound({ shareId: id as DriveShareId }),
            );
      });

    const shareView = (share: FixtureShare, member: boolean) =>
      Effect.gen(function* () {
        const volume = yield* findVolume(share.volumeId).pipe(
          Effect.mapError(
            () => new DriveShareNotFound({ shareId: share.id as DriveShareId }),
          ),
        );
        const latest = head(volume);
        const file = latest?.files.find((row) => row.path === share.path);
        if (!latest || !file) {
          return yield* Effect.fail(
            new DriveShareNotFound({ shareId: share.id as DriveShareId }),
          );
        }
        const base = toVolume(volume);
        return new DriveShareView({
          type: "file",
          id: share.id as DriveShareId,
          path: share.path,
          visibility: share.visibility,
          url: `/s/${share.id}`,
          orgName: org.name,
          authorName: latest.authorName,
          member: member
            ? {
                orgId: OrgId.make(orgId),
                manageable: true,
                projectId: base.projectId,
                userId: base.userId,
                automationId: base.automationId,
                captainJamId: base.captainJamId,
              }
            : null,
          versionId: latest.id as VolumeVersionId,
          versionCreatedAt: at(latest.createdAt),
          sizeBytes: byteSize(file.content),
          file: new VolumeFileContent({
            type: "content",
            content: file.content,
          }),
        });
      });

    return handlers
      .handle("agentContextPreview", ({ params, query }) =>
        Effect.gen(function* () {
          const files = yield* Ref.get(driveFiles);
          const search = String(query.search ?? "").toLowerCase();
          return {
            organizationId: params.orgId,
            ...agentContext,
            sources: agentContext.sources.filter(
              (source) =>
                search.length === 0 ||
                source.path.toLowerCase().includes(search),
            ),
            availableFiles: files.map((file) => file.path),
          };
        }),
      )
      .handle("scopeDirectory", ({ query }) =>
        Effect.map(Ref.get(volumes), (all) => {
          const items = all
            .filter((volume) => !volume.archived)
            .filter(
              (volume) =>
                (query.projectId === undefined ||
                  volume.scope.projectId === query.projectId) &&
                (query.automationId === undefined ||
                  volume.scope.automationId === query.automationId),
            )
            .map(toSummary);
          return new VolumeScopeDirectory({
            storage: {
              usedBytes: items.reduce((sum, item) => sum + item.totalBytes, 0),
              limitBytes: sampleStorageLimitBytes,
              tier: "pro",
            },
            items,
            page: 1,
            pageCount: 1,
            totalScopes: items.length,
          });
        }),
      )
      .handle("list", ({ query }) =>
        Effect.map(Ref.get(volumes), (all) => {
          const wanted = scopeOf(query);
          const archived = query.archived === "true";
          return all
            .filter((volume) => volume.archived === archived)
            .filter((volume) =>
              query.exactScope === "true"
                ? sameScope(volume.scope, wanted)
                : (query.projectId === undefined ||
                    volume.scope.projectId === query.projectId) &&
                  (query.userId === undefined ||
                    volume.scope.userId === query.userId) &&
                  (query.automationId === undefined ||
                    volume.scope.automationId === query.automationId) &&
                  (query.captainJamId === undefined ||
                    volume.scope.captainJamId === query.captainJamId),
            )
            .map(toVolume);
        }),
      )
      .handle("manifest", ({ params, query }) =>
        Effect.gen(function* () {
          const volume = yield* findVolume(params.volumeId);
          const version = yield* findVersion(volume, params.versionId);
          if (query.dir === undefined) return toManifest(volume, version);
          return new VolumeFolderPage({
            versionId: version.id as VolumeVersionId,
            volumeId: volume.id as VolumeId,
            digest: versionDigest(version.files),
            dir: query.dir,
            entries: folderEntries(version.files, query.dir),
            next: null,
            fileCount: version.files.length,
            totalBytes: totalBytes(version.files),
          });
        }),
      )
      .handle("tree", ({ params }) =>
        Effect.gen(function* () {
          const volume = yield* findVolume(params.volumeId);
          const version = yield* findVersion(volume, params.versionId);
          return new VolumeTreePage({
            entries: version.files.map(entryOf),
            next: null,
          });
        }),
      )
      .handle("changes", ({ params }) =>
        Effect.gen(function* () {
          const volume = yield* findVolume(params.volumeId);
          const version = yield* findVersion(volume, params.versionId);
          const index = volume.versions.indexOf(version);
          const previous = index > 0 ? volume.versions[index - 1] : undefined;
          return new VolumeVersionChanges({
            versionId: version.id as VolumeVersionId,
            volumeId: volume.id as VolumeId,
            complete: true,
            changes: changesBetween(previous?.files ?? [], version.files),
          });
        }),
      )
      .handle("file", ({ params }) =>
        Effect.gen(function* () {
          const volume = yield* findVolume(params.volumeId);
          const version = yield* findVersion(volume, params.versionId);
          const file = volume.versions
            .flatMap((row) => row.files)
            .find((row) => digest(row.content) === params.sha256);
          if (!file || !version) {
            return yield* Effect.fail(
              new VolumeFileNotFound({
                volumeId: volume.id as VolumeId,
                sha256: params.sha256,
              }),
            );
          }
          return new VolumeFileContent({
            type: "content",
            content: file.content,
          });
        }),
      )
      .handle("versions", ({ params }) =>
        Effect.map(findVolume(params.volumeId), (volume) =>
          volume.versions
            .map(
              (version) =>
                new VolumeVersionRow({
                  id: version.id as VolumeVersionId,
                  volumeId: volume.id as VolumeId,
                  kind: version.kind,
                  fileCount: version.files.length,
                  totalBytes: totalBytes(version.files),
                  createdAt: at(version.createdAt),
                  threadId: version.threadId as VolumeVersionRow["threadId"],
                  threadTitle: version.threadTitle,
                  authorName: version.authorName,
                }),
            )
            .reverse(),
        ),
      )
      .handle("fileVersions", ({ params, query }) =>
        Effect.map(findVolume(params.volumeId), (volume) => {
          const rows: Array<VolumeFileVersion> = [];
          let previous: FixtureFile | undefined;
          let lastSeen: FixtureFile | undefined;
          const end = volume.versions.findIndex(
            (version) => version.id === query.before,
          );
          for (const version of end === -1
            ? volume.versions
            : volume.versions.slice(0, end)) {
            const file = version.files.find((row) => row.path === query.path);
            if (file && file.content !== previous?.content) {
              rows.push(
                new VolumeFileVersion({
                  versionId: version.id as VolumeVersionId,
                  sha256: digest(file.content),
                  sizeBytes: byteSize(file.content),
                  createdAt: at(version.createdAt),
                  threadTitle: version.threadTitle,
                  authorName: version.authorName,
                }),
              );
            }
            if (!file && lastSeen) {
              const last = rows.at(-1);
              if (last) {
                rows[rows.length - 1] = new VolumeFileVersion({
                  ...last,
                  removedBy: new VolumeFileRemoval({
                    versionId: version.id as VolumeVersionId,
                    createdAt: at(version.createdAt),
                    threadTitle: version.threadTitle,
                    authorName: version.authorName,
                  }),
                });
              }
            }
            previous = file;
            lastSeen = file;
          }
          return rows.reverse();
        }),
      )
      .handle("write", ({ payload }) =>
        Effect.gen(function* () {
          const all = yield* Ref.get(volumes);
          const wanted = scopeOf(payload.scope);
          let volume = all.find((row) => sameScope(row.scope, wanted));
          if (!volume) {
            const created: FixtureVolume = {
              id: volumeId(`MOCK${++mintedVolumes}`),
              namespace: "drive",
              name: "Drive",
              description: null,
              archived: false,
              scope: wanted,
              versions: [],
            };
            yield* Ref.update(volumes, (rows) => [...rows, created]);
            volume = created;
          }
          const files = new Map(
            (head(volume)?.files ?? []).map((file) => [file.path, file]),
          );
          for (const change of payload.changes) {
            if ("delete" in change) {
              for (const path of files.keys()) {
                if (
                  path === change.path ||
                  path.startsWith(`${change.path}/`)
                ) {
                  files.delete(path);
                }
              }
            } else if ("content" in change) {
              files.set(change.path, {
                path: change.path,
                content: change.content,
              });
            } else {
              files.set(change.path, {
                path: change.path,
                content: new TextDecoder().decode(
                  Uint8Array.from(atob(change.contentBase64), (char) =>
                    char.charCodeAt(0),
                  ),
                ),
                mode: change.mode,
              });
            }
          }
          return yield* commit(
            volume,
            [...files.values()],
            payload.expectedDigest,
          );
        }),
      )
      .handle("restore", ({ params, payload }) =>
        Effect.gen(function* () {
          const volume = yield* findVolume(params.volumeId);
          const version = yield* findVersion(volume, payload.versionId);
          return yield* commit(volume, version.files, payload.expectedDigest);
        }),
      )
      .handle("purgeName", ({ params, payload }) =>
        Effect.gen(function* () {
          const volume = yield* findVolume(params.volumeId);
          const deleted = volume.versions.filter((version) =>
            version.files.some((file) => file.path === payload.path),
          ).length;
          return new DrivePurgeNameResult({
            volumeId: volume.id as VolumeId,
            deleted,
            tombstoneFloor: volume.versions.length,
          });
        }),
      )
      .handle("archive", ({ params }) =>
        Effect.gen(function* () {
          const volume = yield* findVolume(params.volumeId);
          const next = { ...volume, archived: true };
          yield* saveVolume(next);
          return toVolume(next);
        }),
      )
      .handle("unarchive", ({ params }) =>
        Effect.gen(function* () {
          const volume = yield* findVolume(params.volumeId);
          const next = { ...volume, archived: false };
          yield* saveVolume(next);
          return toVolume(next);
        }),
      )
      .handle("skills", ({ query }) =>
        Effect.map(Ref.get(volumes), (all) =>
          all
            .filter(
              (volume) =>
                !volume.archived &&
                volume.scope.captainJamId === null &&
                volume.scope.automationId === null &&
                volume.scope.userId === null &&
                (volume.scope.projectId === null ||
                  volume.scope.projectId === query.projectId),
            )
            .flatMap((volume) => head(volume)?.files ?? [])
            .filter((file) => /^skills\/[^/]+\/SKILL\.md$/u.test(file.path))
            .map(
              (file) =>
                new VolumeSkill({
                  name: frontmatter(file.content, "name"),
                  description: frontmatter(file.content, "description"),
                }),
            ),
        ),
      )
      .handle("listShares", ({ params }) =>
        Effect.gen(function* () {
          yield* findVolume(params.volumeId);
          const all = yield* Ref.get(shares);
          return all
            .filter((share) => share.volumeId === params.volumeId)
            .map(toShare);
        }),
      )
      .handle("listOrgShares", () =>
        Effect.gen(function* () {
          const all = yield* Ref.get(shares);
          const vols = yield* Ref.get(volumes);
          const items = all.flatMap((share) => {
            const volume = vols.find((row) => row.id === share.volumeId);
            if (!volume) return [];
            const base = toVolume(volume);
            return [
              new DriveShareListing({
                ...toShare(share),
                projectId: base.projectId,
                userId: base.userId,
                automationId: base.automationId,
                captainJamId: base.captainJamId,
                changedAt: base.headUpdatedAt,
              }),
            ];
          });
          return new DriveShareDirectory({
            items,
            page: 1,
            pageCount: 1,
            total: items.length,
          });
        }),
      )
      .handle("createShare", ({ params, payload }) =>
        Effect.gen(function* () {
          const volume = yield* findVolume(params.volumeId);
          if (!head(volume)?.files.some((file) => file.path === payload.path)) {
            return yield* Effect.fail(
              new DriveSharePathNotFound({
                volumeId: volume.id as VolumeId,
                path: payload.path,
              }),
            );
          }
          const existing = (yield* Ref.get(shares)).find(
            (share) =>
              share.volumeId === params.volumeId && share.path === payload.path,
          );
          if (existing) return toShare(existing);
          const share: FixtureShare = {
            id: shareId(`mock${++mintedShares}`),
            volumeId: params.volumeId,
            path: payload.path,
            visibility: "private",
            createdBy: `${viewer.firstName} ${viewer.lastName}`,
            createdAt: nowIso(),
          };
          yield* Ref.update(shares, (all) => [...all, share]);
          return toShare(share);
        }),
      )
      .handle("updateShare", ({ params, payload }) =>
        Effect.gen(function* () {
          const share = yield* findShare(params.shareId);
          const next = { ...share, visibility: payload.visibility };
          yield* Ref.update(shares, (all) =>
            all.map((row) => (row.id === share.id ? next : row)),
          );
          return toShare(next);
        }),
      )
      .handle("revokeShare", ({ params }) =>
        Effect.gen(function* () {
          const share = yield* findShare(params.shareId);
          yield* Ref.update(shares, (all) =>
            all.filter((row) => row.id !== share.id),
          );
        }),
      )
      .handle("readShare", ({ params }) =>
        Effect.flatMap(findShare(params.shareId), (share) =>
          shareView(share, true),
        ),
      )
      .handle("publicShare", ({ params }) =>
        Effect.gen(function* () {
          const share = yield* findShare(params.shareId);
          if (share.visibility !== "public") {
            return new DriveShareRestricted({ type: "restricted" });
          }
          return yield* shareView(share, false);
        }),
      );
  }),
);
