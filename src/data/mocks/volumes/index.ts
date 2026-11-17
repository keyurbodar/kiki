import { Effect, Ref } from "effect";
import { fields, MockDb, missing, newId } from "../db/MockDb.ts";
import { isoMinutesAgo } from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  agentContext,
  changes,
  type DriveShare,
  type DriveVersion,
  fileVersions,
  organizationDomain,
  organizationName,
  scopes,
  shares,
  skills,
  versions,
  volumeId,
} from "./fixtures.ts";

const active = (rows: ReadonlyArray<DriveShare>) =>
  rows.filter((row) => row.revokedAt === null);

export const VolumesMock = mockGroup("volumes", (handlers) =>
  Effect.gen(function* () {
    const { driveFiles } = yield* MockDb;
    const shareRef = yield* Ref.make<ReadonlyArray<DriveShare>>(shares);
    const versionRef = yield* Ref.make<ReadonlyArray<DriveVersion>>(versions);
    const archivedRef = yield* Ref.make<ReadonlyArray<string>>([]);

    const share = (shareId: string) =>
      Effect.flatMap(Ref.get(shareRef), (rows) => {
        const row = rows.find((candidate) => candidate.id === shareId);
        return row
          ? Effect.succeed(row)
          : Effect.die(new Error(`volumes.shares: no row ${shareId}`));
      });

    const version = (versionId: string) =>
      Effect.flatMap(Ref.get(versionRef), (rows) => {
        const row = rows.find((candidate) => candidate.id === versionId);
        return row
          ? Effect.succeed(row)
          : Effect.die(new Error(`volumes.versions: no row ${versionId}`));
      });

    return handlers
      .handle("readShare", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* share(params.shareId);
          if (row.revokedAt !== null) {
            return yield* Effect.die(
              new Error(`volumes.shares: ${row.id} is revoked`),
            );
          }
          const file = (yield* Ref.get(driveFiles)).find(
            (candidate) => candidate.id === row.fileId,
          );
          return { ...row, file: file ?? null };
        }),
      )
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
      .handle("list", ({ params, query }) =>
        Effect.gen(function* () {
          const files = yield* Ref.get(driveFiles);
          const prefix = String(query.path ?? "");
          const rows = files.filter((file) => file.path.startsWith(prefix));
          return {
            organizationId: params.orgId,
            volumeId,
            items: rows,
            total: rows.length,
          };
        }),
      )
      .handle("scopeDirectory", ({ params, query }) =>
        Effect.gen(function* () {
          const prefix = String(query.path ?? "");
          return {
            organizationId: params.orgId,
            scopes: scopes.filter((scope) => scope.path.startsWith(prefix)),
          };
        }),
      )
      .handle("write", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const path = String(input.path ?? "notes/new-note.md");
          const file = {
            id: newId("file"),
            path,
            size: typeof input.size === "number" ? input.size : 0,
            mimeType: String(input.mimeType ?? "text/markdown"),
            updatedAt: isoMinutesAgo(0),
            updatedBy: String(input.updatedBy ?? "user_sample_alex"),
          };
          yield* Ref.update(driveFiles, (rows) => [...rows, file]);
          return { ...file, organizationId: params.orgId };
        }),
      )
      .handle("listOrgShares", ({ params }) =>
        Effect.gen(function* () {
          const rows = active(yield* Ref.get(shareRef));
          return rows.map((row) => ({
            ...row,
            organizationId: params.orgId,
          }));
        }),
      )
      .handle("updateShare", ({ params, payload }) =>
        Effect.gen(function* () {
          const current = yield* share(params.shareId);
          const input = fields(payload);
          const updated: DriveShare = {
            ...current,
            ...(input.permission === "view" || input.permission === "edit"
              ? { permission: input.permission }
              : {}),
            ...(input.scope === "organization" || input.scope === "public"
              ? { scope: input.scope }
              : {}),
          };
          yield* Ref.update(shareRef, (rows) =>
            rows.map((row) => (row.id === current.id ? updated : row)),
          );
          return updated;
        }),
      )
      .handle("revokeShare", ({ params }) =>
        Effect.gen(function* () {
          yield* share(params.shareId);
          yield* Ref.update(shareRef, (rows) =>
            rows.map((row) =>
              row.id === params.shareId
                ? { ...row, revokedAt: isoMinutesAgo(0) }
                : row,
            ),
          );
          return { ok: true };
        }),
      )
      .handle("skills", ({ params, query }) =>
        Effect.gen(function* () {
          const search = String(query.search ?? "").toLowerCase();
          return {
            organizationId: params.orgId,
            items: skills.filter(
              (skill) =>
                search.length === 0 ||
                skill.name.toLowerCase().includes(search),
            ),
          };
        }),
      )
      .handle("archive", ({ params }) =>
        Effect.gen(function* () {
          if (params.volumeId !== volumeId) {
            return yield* Effect.die(
              new Error(`volumes: no volume ${params.volumeId}`),
            );
          }
          yield* Ref.update(archivedRef, (all) => [...all, params.volumeId]);
          return {
            ok: true,
            volumeId: params.volumeId,
            archived: true,
            organizationId: params.orgId,
          };
        }),
      )
      .handle("fileVersions", ({ query }) =>
        Effect.gen(function* () {
          const fileId = String(query.fileId ?? "");
          return fileVersions.filter(
            (item) => fileId.length === 0 || item.fileId === fileId,
          );
        }),
      )
      .handle("purgeName", ({ params, payload }) => {
        const input = fields(payload);
        const name = String(input.name ?? "notes/old-plan.md");
        return Effect.succeed({
          ok: true,
          volumeId: params.volumeId,
          name,
          purgedAt: isoMinutesAgo(0),
        });
      })
      .handle("restore", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const versionId = String(input.versionId ?? "ver_sample_2");
          const restored = yield* version(versionId);
          yield* Ref.update(archivedRef, (rows) =>
            rows.filter((id) => id !== params.volumeId),
          );
          return {
            ok: true,
            volumeId: params.volumeId,
            versionId: restored.id,
            restoredAt: isoMinutesAgo(0),
          };
        }),
      )
      .handle("listShares", ({ params }) =>
        Effect.gen(function* () {
          const rows = active(yield* Ref.get(shareRef));
          return rows.map((row) => ({
            ...row,
            volumeId: params.volumeId,
          }));
        }),
      )
      .handle("createShare", ({ params, payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const file = (yield* Ref.get(driveFiles)).find(
            (row) => row.id === input.fileId,
          );
          if (!file) {
            return yield* missing("driveFiles", String(input.fileId ?? ""));
          }
          const created: DriveShare = {
            id: newId("shr"),
            fileId: file.id,
            path: file.path,
            scope: input.scope === "public" ? "public" : "organization",
            permission: input.permission === "edit" ? "edit" : "view",
            url: `https://capy.example/s/${newId("share")}`,
            createdBy: String(input.createdBy ?? "user_sample_alex"),
            createdAt: isoMinutesAgo(0),
            revokedAt: null,
          };
          yield* Ref.update(shareRef, (rows) => [...rows, created]);
          return { ...created, volumeId: params.volumeId };
        }),
      )
      .handle("unarchive", ({ params }) =>
        Effect.gen(function* () {
          yield* Ref.update(archivedRef, (rows) =>
            rows.filter((id) => id !== params.volumeId),
          );
          return {
            ok: true,
            volumeId: params.volumeId,
            archived: false,
          };
        }),
      )
      .handle("versions", ({ params }) =>
        Effect.gen(function* () {
          return (yield* Ref.get(versionRef)).filter(
            (row) => row.volumeId === params.volumeId,
          );
        }),
      )
      .handle("manifest", ({ params, query }) =>
        Effect.gen(function* () {
          const row = yield* version(params.versionId);
          const files = yield* Ref.get(driveFiles);
          return {
            ...row,
            volumeId: params.volumeId,
            includeDeleted: query.includeDeleted === "true",
            entries: files.map((file) => ({
              path: file.path,
              size: file.size,
              mimeType: file.mimeType,
            })),
          };
        }),
      )
      .handle("changes", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* version(params.versionId);
          return {
            versionId: row.id,
            volumeId: params.volumeId,
            changes,
          };
        }),
      )
      .handle("file", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* version(params.versionId);
          return {
            versionId: row.id,
            volumeId: params.volumeId,
            sha256: params.sha256,
            content: "Retry gateway timeouts twice.",
            encoding: "utf-8",
          };
        }),
      )
      .handle("tree", ({ params, query }) =>
        Effect.gen(function* () {
          const row = yield* version(params.versionId);
          const files = yield* Ref.get(driveFiles);
          const prefix = String(query.path ?? "");
          return {
            versionId: row.id,
            volumeId: params.volumeId,
            entries: files
              .filter((file) => file.path.startsWith(prefix))
              .map((file) => ({
                path: file.path,
                type: "file" as const,
                size: file.size,
              })),
          };
        }),
      )
      .handle("publicShare", ({ params }) =>
        Effect.gen(function* () {
          const row = yield* share(params.shareId);
          if (row.scope !== "public") {
            return yield* Effect.die(
              new Error(`volumes.shares: ${row.id} is not public`),
            );
          }
          const file = (yield* Ref.get(driveFiles)).find(
            (candidate) => candidate.id === row.fileId,
          );
          return {
            id: row.id,
            path: row.path,
            permission: row.permission,
            organizationName,
            organizationDomain,
            file: file ?? null,
          };
        }),
      );
  }),
);
