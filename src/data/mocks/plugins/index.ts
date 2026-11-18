import { Effect, Ref } from "effect";
import { fields, MockDb, newId } from "../db/MockDb.ts";
import {
  isoMinutesAgo,
  projects as worldProjects,
  threads as worldThreads,
} from "../fixtures/world.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  type MarketplaceListing,
  type PluginInstallation,
  type PluginServerConnection,
  type PluginVersion,
  sampleInstallations,
  sampleMarketplace,
  sampleThreadPlugins,
  sampleVersions,
  type ThreadPluginBinding,
} from "./fixtures.ts";

const locallyMissing = (table: string, id: string) =>
  Effect.die(new Error(`plugins.${table}: no row ${id}`));

const text = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim() !== "" ? value : fallback;

const hasNewerVersion = (
  published: ReadonlyArray<PluginVersion>,
  row: PluginInstallation,
) =>
  published.some(
    (version) =>
      version.pluginKey === row.pluginKey &&
      version.id !== row.versionId &&
      version.publishedAt > (row.installedAt ?? ""),
  );

const lookupInstallation = (
  rows: ReadonlyArray<PluginInstallation>,
  id: string,
) => {
  const found = rows.find((row) => row.id === id);
  return found ? Effect.succeed(found) : locallyMissing("installations", id);
};

export const PluginsMock = mockGroup("plugins", (handlers) =>
  Effect.gen(function* () {
    const { members } = yield* MockDb;
    const installations = yield* Ref.make<ReadonlyArray<PluginInstallation>>(
      structuredClone(sampleInstallations),
    );
    const versions = yield* Ref.make(structuredClone(sampleVersions));
    const marketplace = yield* Ref.make<ReadonlyArray<MarketplaceListing>>(
      structuredClone(sampleMarketplace),
    );
    const threadPlugins = yield* Ref.make<ReadonlyArray<ThreadPluginBinding>>(
      structuredClone(sampleThreadPlugins),
    );

    return handlers
      .handle("listThreadPlugins", ({ params }) =>
        Effect.gen(function* () {
          const thread = Object.values(worldThreads).find(
            (row) => row.id === params.jamId,
          );
          if (!thread) {
            return yield* locallyMissing("threads", params.jamId);
          }
          const bindings = (yield* Ref.get(threadPlugins)).filter(
            (row) => row.threadId === params.jamId,
          );
          return bindings.map((row) => ({
            ...row,
            threadTitle: thread.title,
          }));
        }),
      )
      .handle("listInstallations", () =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(installations);
          const published = yield* Ref.get(versions);
          return rows.map((row) => ({
            ...row,
            projectName:
              Object.values(worldProjects).find((p) => p.id === row.projectId)
                ?.name ?? null,
            // The same fact the detail page reads: an update exists when a
            // newer version is published, not when the row's status says so.
            updateAvailable: hasNewerVersion(published, row),
          }));
        }),
      )
      .handle("addInstallation", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const versionId = text(input.versionId, "plugver_sample_docs_0_9_0");
          const version = (yield* Ref.get(versions)).find(
            (row) => row.id === versionId,
          );
          if (!version) {
            return yield* locallyMissing("versions", versionId);
          }
          const installIntoThreadId = text(input.threadId, "");
          if (
            installIntoThreadId !== "" &&
            !Object.values(worldThreads).some(
              (row) => row.id === installIntoThreadId,
            )
          ) {
            return yield* locallyMissing("threads", installIntoThreadId);
          }
          const actorId = text(input.installedBy, "");
          if (
            actorId !== "" &&
            !(yield* Ref.get(members)).some((m) => m.id === actorId)
          ) {
            return yield* locallyMissing("members", actorId);
          }
          const id = newId("plugininst");
          const now = isoMinutesAgo(0);
          const installation: PluginInstallation = {
            id,
            pluginKey: version.pluginKey,
            displayName: version.displayName,
            version: version.version,
            versionId: version.id,
            status: "connected",
            threadIds: installIntoThreadId === "" ? [] : [installIntoThreadId],
            projectId:
              typeof input.projectId === "string" ? input.projectId : null,
            installedBy: actorId === "" ? "user_sample_alex" : actorId,
            installedAt: now,
            updatedAt: now,
            updateAvailable: false,
            rollbackVersion: null,
            rollbackToVersion: null,
            lastSyncedAt: now,
            servers: version.manifest.servers
              ? (
                  version.manifest.servers as ReadonlyArray<{
                    readonly key: string;
                    readonly name: string;
                  }>
                ).map((server) => ({
                  serverKey: server.key,
                  name: server.name,
                  status: "disconnected" as const,
                  connectedBy: null,
                  connectedAt: null,
                }))
              : [],
            errorMessage: null,
          };
          yield* Ref.update(installations, (rows) => [...rows, installation]);
          if (installIntoThreadId !== "") {
            yield* Ref.update(threadPlugins, (rows) => [
              ...rows,
              {
                id: newId("plugthread"),
                threadId: installIntoThreadId,
                installationId: id,
                pluginKey: version.pluginKey,
                displayName: version.displayName,
                version: version.version,
                status: "enabled" as const,
                addedBy: installation.installedBy,
                addedAt: now,
              },
            ]);
          }
          yield* Ref.update(marketplace, (rows) =>
            rows.map((row) =>
              row.key === version.pluginKey ? { ...row, installed: true } : row,
            ),
          );
          return installation;
        }),
      )
      .handle("getInstallation", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(installations);
          const installation = yield* lookupInstallation(
            rows,
            params.installationId,
          );
          const published = yield* Ref.get(versions);
          const ofPlugin = published.filter(
            (version) => version.pluginKey === installation.pluginKey,
          );
          const running = ofPlugin.find(
            (version) => version.id === installation.versionId,
          );
          // The badge, the Review control and the review page read one fact:
          // whether a newer version is published. The row's own flag is
          // derived here rather than stored, so it cannot drift from it.
          const updateAvailable = hasNewerVersion(published, installation);
          const available = updateAvailable
            ? ofPlugin
                .filter((version) => version.id !== installation.versionId)
                .toSorted((a, b) =>
                  b.publishedAt.localeCompare(a.publishedAt),
                )[0]
            : undefined;
          return {
            ...installation,
            updateAvailable,
            runningVersion: running ?? null,
            availableVersion: available ?? null,
          };
        }),
      )
      .handle("patchInstallation", ({ params, payload }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(installations);
          const current = yield* lookupInstallation(
            rows,
            params.installationId,
          );
          const input = fields(payload);
          const updated: PluginInstallation = {
            ...current,
            ...(typeof input.displayName === "string"
              ? { displayName: input.displayName }
              : {}),
            ...(typeof input.status === "string"
              ? { status: input.status as PluginInstallation["status"] }
              : {}),
            ...(typeof input.projectId === "string"
              ? { projectId: input.projectId }
              : {}),
            ...(Array.isArray(input.threadIds)
              ? { threadIds: input.threadIds as ReadonlyArray<string> }
              : {}),
            updatedAt: isoMinutesAgo(0),
          };
          yield* Ref.set(
            installations,
            rows.map((row) => (row.id === current.id ? updated : row)),
          );
          return updated;
        }),
      )
      .handle("removeInstallation", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(installations);
          const current = yield* lookupInstallation(
            rows,
            params.installationId,
          );
          yield* Ref.set(
            installations,
            rows.filter((row) => row.id !== current.id),
          );
          yield* Ref.update(threadPlugins, (all) =>
            all.filter((row) => row.installationId !== current.id),
          );
          yield* Ref.update(marketplace, (all) =>
            all.map((row) =>
              row.key === current.pluginKey
                ? { ...row, installed: false }
                : row,
            ),
          );
          return { ok: true, id: current.id };
        }),
      )
      .handle("rollbackInstallation", ({ params, payload }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(installations);
          const current = yield* lookupInstallation(
            rows,
            params.installationId,
          );
          const input = fields(payload);
          const target = text(input.version, current.rollbackVersion ?? "");
          const fallback = (yield* Ref.get(versions))
            .filter((row) => row.pluginKey === current.pluginKey)
            .find((row) => row.version !== current.version);
          const rollbackVersion =
            target || (fallback?.version ?? current.version);
          const updated: PluginInstallation = {
            ...current,
            version: rollbackVersion,
            versionId: fallback?.id ?? current.versionId,
            status: "connected",
            updateAvailable: true,
            rollbackVersion: current.version,
            rollbackToVersion: rollbackVersion,
            updatedAt: isoMinutesAgo(0),
            errorMessage: null,
          };
          yield* Ref.set(
            installations,
            rows.map((row) => (row.id === current.id ? updated : row)),
          );
          yield* Ref.update(threadPlugins, (all) =>
            all.map((row) =>
              row.installationId === current.id
                ? { ...row, version: rollbackVersion }
                : row,
            ),
          );
          return updated;
        }),
      )
      .handle("cancelRollback", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(installations);
          const current = yield* lookupInstallation(
            rows,
            params.installationId,
          );
          const updated: PluginInstallation = {
            ...current,
            rollbackToVersion: null,
            updatedAt: isoMinutesAgo(0),
          };
          yield* Ref.set(
            installations,
            rows.map((row) => (row.id === current.id ? updated : row)),
          );
          return updated;
        }),
      )
      .handle("connectServer", ({ params, payload }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(installations);
          const current = yield* lookupInstallation(
            rows,
            params.installationId,
          );
          const input = fields(payload);
          const server = current.servers.find(
            (row) => row.serverKey === params.serverKey,
          );
          if (!server) {
            return yield* locallyMissing("servers", params.serverKey);
          }
          const connectedBy = text(input.connectedBy, current.installedBy);
          if (
            !(yield* Ref.get(members)).some((row) => row.id === connectedBy)
          ) {
            return yield* locallyMissing("members", connectedBy);
          }
          const connection: PluginServerConnection = {
            ...server,
            name: text(input.name, server.name),
            status: "connected",
            connectedBy,
            connectedAt: isoMinutesAgo(0),
          };
          const updated: PluginInstallation = {
            ...current,
            servers: current.servers.map((row) =>
              row.serverKey === params.serverKey ? connection : row,
            ),
            status: "connected",
            updatedAt: isoMinutesAgo(0),
          };
          yield* Ref.set(
            installations,
            rows.map((row) => (row.id === current.id ? updated : row)),
          );
          return { ...updated, server: connection };
        }),
      )
      .handle("disconnectServer", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(installations);
          const current = yield* lookupInstallation(
            rows,
            params.installationId,
          );
          const server = current.servers.find(
            (row) => row.serverKey === params.serverKey,
          );
          if (!server) {
            return yield* locallyMissing("servers", params.serverKey);
          }
          const connection: PluginServerConnection = {
            ...server,
            status: "disconnected",
            connectedBy: null,
            connectedAt: null,
          };
          const updated: PluginInstallation = {
            ...current,
            servers: current.servers.map((row) =>
              row.serverKey === params.serverKey ? connection : row,
            ),
            updatedAt: isoMinutesAgo(0),
          };
          yield* Ref.set(
            installations,
            rows.map((row) => (row.id === current.id ? updated : row)),
          );
          return { ...updated, server: connection };
        }),
      )
      .handle("syncInstallation", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(installations);
          const current = yield* lookupInstallation(
            rows,
            params.installationId,
          );
          const now = isoMinutesAgo(0);
          const updated: PluginInstallation = {
            ...current,
            lastSyncedAt: now,
            updatedAt: now,
            errorMessage: null,
          };
          yield* Ref.set(
            installations,
            rows.map((row) => (row.id === current.id ? updated : row)),
          );
          return updated;
        }),
      )
      .handle("updateInstallation", ({ params, payload }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(installations);
          const current = yield* lookupInstallation(
            rows,
            params.installationId,
          );
          const input = fields(payload);
          const versionId = text(input.versionId, "");
          const allVersions = yield* Ref.get(versions);
          const target =
            versionId === ""
              ? allVersions.find((row) => row.pluginKey === current.pluginKey)
              : allVersions.find((row) => row.id === versionId);
          if (!target) {
            return yield* locallyMissing("versions", versionId);
          }
          const updated: PluginInstallation = {
            ...current,
            version: target.version,
            versionId: target.id,
            status: "connected",
            updateAvailable: false,
            rollbackVersion: current.version,
            rollbackToVersion: null,
            lastSyncedAt: isoMinutesAgo(0),
            updatedAt: isoMinutesAgo(0),
            errorMessage: null,
          };
          yield* Ref.set(
            installations,
            rows.map((row) => (row.id === current.id ? updated : row)),
          );
          yield* Ref.update(threadPlugins, (all) =>
            all.map((row) =>
              row.installationId === current.id
                ? { ...row, version: target.version }
                : row,
            ),
          );
          return updated;
        }),
      )
      .handle("getVersion", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(versions);
          const found = rows.find((row) => row.id === params.versionId);
          if (!found) {
            return yield* locallyMissing("versions", params.versionId);
          }
          return {
            ...found,
            plugin: {
              id: found.pluginKey,
              key: found.pluginKey,
              displayName: found.displayName,
            },
            installation: {
              version: found.version,
            },
          };
        }),
      )
      .handle("getVersionIcon", ({ params }) =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(versions);
          const found = rows.find((row) => row.id === params.versionId);
          if (!found) {
            return yield* locallyMissing("versions", params.versionId);
          }
          return {
            versionId: found.id,
            url: found.iconUrl,
            contentType: "image/svg+xml",
          };
        }),
      )
      .handle("fetchGitHubVersion", ({ payload }) =>
        Effect.gen(function* () {
          const input = fields(payload);
          const repo = text(input.repository, "acme/ci-helper");
          const version = text(input.version, "1.4.0");
          const match = (yield* Ref.get(marketplace)).find(
            (row) => row.repository === repo,
          );
          const displayName = match?.displayName ?? "CI Helper";
          const resolvedVersion = match?.latestVersion ?? version;
          return {
            id: `plugver_github_${repo.replaceAll("/", "_")}_${resolvedVersion}`,
            repository: repo,
            pluginKey: match?.key ?? "ci-helper",
            displayName,
            version: resolvedVersion,
            changelog: `Upstream notes for ${displayName} ${resolvedVersion}.`,
            manifest: {
              name: match?.key ?? "ci-helper",
              version: resolvedVersion,
              repository: repo,
            },
            publishedAt: isoMinutesAgo(24 * 60),
            source: "github",
          };
        }),
      )
      .handle("listMarketplace", () =>
        Effect.gen(function* () {
          const rows = yield* Ref.get(marketplace);
          const installed = yield* Ref.get(installations);
          return rows.map((row) => ({
            ...row,
            installed: installed.some((item) => item.pluginKey === row.key),
          }));
        }),
      );
  }),
);
