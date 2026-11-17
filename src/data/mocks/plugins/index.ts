import { DateTime, Effect, Ref } from "effect";
import { sampleMcpServers } from "../mcp/fixtures.ts";
import { fixtureNow } from "../fixtures/time.ts";
import { mockGroup } from "../mockGroup.ts";
import {
  sampleInstallations,
  sampleMarketplace,
  samplePluginVersions,
  sampleSearchVersion,
} from "./fixtures.ts";

type MockInstallation = (typeof sampleInstallations)[number];

const now = () => DateTime.formatIso(fixtureNow);

const detail = (installation: MockInstallation) => {
  const version =
    samplePluginVersions.find((entry) => entry.id === installation.versionId) ??
    sampleSearchVersion;
  return {
    installation,
    version,
    pending: null,
    canRollBack: false,
    pendingIsRollback: false,
    held: false,
    removedFromMarketplace: false,
    sourceRef: null,
    servers: version.servers.map((spec) => {
      const server = sampleMcpServers.find(
        (entry) =>
          entry.pluginInstallationId === installation.id &&
          entry.serverKey === spec.serverKey,
      );
      return {
        serverId: server?.id ?? `mcp_for_${installation.id}`,
        ownServerId: null,
        entry: spec.entry,
        serverKey: spec.serverKey,
        displayName: spec.displayName,
        placement: spec.placement,
        transport: spec.transport,
        auth: spec.auth,
        connection: spec.connection,
        status: installation.status ?? "Not checked",
        connected: server !== undefined,
        toolCount: server?.toolCount ?? null,
      };
    }),
  };
};

export const PluginsMock = mockGroup("plugins", (handlers) =>
  Effect.gen(function* () {
    const installations =
      yield* Ref.make<ReadonlyArray<MockInstallation>>(sampleInstallations);
    const find = (installationId: string) =>
      Ref.get(installations).pipe(
        Effect.map((all) => all.find((entry) => entry.id === installationId)),
      );
    const patch = (installationId: string, changes: Partial<MockInstallation>) =>
      Ref.updateAndGet(installations, (all) =>
        all.map((entry) =>
          entry.id === installationId
            ? { ...entry, ...changes, updatedAt: now() }
            : entry,
        ),
      ).pipe(
        Effect.map((all) => {
          const entry = all.find((item) => item.id === installationId);
          return entry === undefined ? null : detail(entry);
        }),
      );
    return handlers
      .handle("listMarketplace", () => Effect.succeed(sampleMarketplace))
      .handle("listInstallations", () => Ref.get(installations))
      .handle("getInstallation", ({ params }) =>
        find(params.installationId).pipe(
          Effect.map((entry) => (entry === undefined ? null : detail(entry))),
        ),
      )
      .handle("getVersion", ({ params }) =>
        Effect.succeed(
          samplePluginVersions.find((entry) => entry.id === params.versionId) ??
            null,
        ),
      )
      .handle("patchInstallation", ({ params, payload }) => {
        const { updatedAt: _, ...changes } = payload as {
          readonly updatedAt?: string;
        } & Partial<MockInstallation>;
        return patch(params.installationId, changes);
      })
      .handle("removeInstallation", ({ params }) =>
        Ref.update(installations, (all) =>
          all.filter((entry) => entry.id !== params.installationId),
        ).pipe(Effect.as(null)),
      )
      .handle("syncInstallation", ({ params }) =>
        find(params.installationId).pipe(
          Effect.map((entry) => ({
            outcome: "unchanged",
            plugin: entry === undefined ? null : detail(entry),
          })),
        ),
      )
      .handle("fetchGitHubVersion", () =>
        Effect.succeed({
          version: { ...samplePluginVersions[2], source: "github" },
          ref: "main",
        }),
      )
      .handle("addInstallation", ({ payload }) =>
        Effect.gen(function* () {
          const request = payload as {
            readonly versionId: string;
            readonly owner: "organization" | "me";
            readonly projectId: string | null;
          };
          const version =
            samplePluginVersions.find((entry) => entry.id === request.versionId) ??
            sampleSearchVersion;
          const created: MockInstallation = {
            ...(sampleInstallations[0] as MockInstallation),
            id: `plugin_inst_sample_${(yield* Ref.get(installations)).length + 1}`,
            pluginId: version.pluginId,
            pluginName: version.name,
            displayName: version.displayName,
            description: version.description,
            versionId: version.id,
            version: version.version,
            repository: version.repository,
            owner: request.owner,
            projectId: request.projectId,
            toolCount: 0,
            skillCount: version.skills.length,
            status: "Not checked",
            createdAt: now(),
            updatedAt: now(),
          };
          yield* Ref.update(installations, (all) => [...all, created]);
          return detail(created);
        }),
      );
  }),
);
