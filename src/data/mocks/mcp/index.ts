import { DateTime, Effect, Ref } from "effect";
import { fixtureNow } from "../fixtures/time.ts";
import { mockGroup } from "../mockGroup.ts";
import { sampleMcpServers, sampleMcpTools } from "./fixtures.ts";

type MockServer = (typeof sampleMcpServers)[number];

const now = () => DateTime.formatIso(fixtureNow);

export const McpMock = mockGroup("mcp", (handlers) =>
  Effect.gen(function* () {
    const servers = yield* Ref.make<ReadonlyArray<MockServer>>(sampleMcpServers);
    const find = (serverId: string) =>
      Ref.get(servers).pipe(
        Effect.map((all) => all.find((server) => server.id === serverId)),
      );
    const patch = (serverId: string, changes: Partial<MockServer>) =>
      Ref.updateAndGet(servers, (all) =>
        all.map((server) =>
          server.id === serverId
            ? { ...server, ...changes, updatedAt: now() }
            : server,
        ),
      ).pipe(
        Effect.map((all) => all.find((server) => server.id === serverId) ?? null),
      );
    return handlers
      .handle("listServers", () => Ref.get(servers))
      .handle("serverTools", ({ params }) =>
        find(params.serverId).pipe(
          Effect.map((server) => (server === undefined ? null : sampleMcpTools)),
        ),
      )
      .handle("listConnections", () => Effect.succeed([]))
      .handle("enableServer", ({ params }) =>
        patch(params.serverId, { enabled: true }),
      )
      .handle("disableServer", ({ params }) =>
        patch(params.serverId, { enabled: false }),
      )
      .handle("refreshServer", ({ params }) => patch(params.serverId, {}))
      .handle("updateServer", ({ params, payload }) =>
        patch(params.serverId, payload as Partial<MockServer>),
      )
      .handle("deleteServer", ({ params }) =>
        Ref.update(servers, (all) =>
          all.filter((server) => server.id !== params.serverId),
        ).pipe(Effect.as(null)),
      )
      .handle("createServer", ({ payload }) =>
        Effect.gen(function* () {
          const request = payload as Partial<MockServer> & {
            readonly owner?: "user" | "organization";
          };
          const [template] = sampleMcpServers;
          const created: MockServer = {
            ...template,
            ...request,
            id: `mcp_sample_${(yield* Ref.get(servers)).length + 1}`,
            owner:
              request.owner === "user"
                ? { kind: "user", userId: "user_sample_alex" }
                : { kind: "organization" },
            displayName: request.displayName ?? request.serverKey ?? "",
            health: { state: "unchecked" },
            toolCount: null,
            createdAt: now(),
            updatedAt: now(),
          } as unknown as MockServer;
          yield* Ref.update(servers, (all) => [...all, created]);
          return created;
        }),
      )
      .handle("testServer", ({ params }) =>
        find(params.serverId).pipe(
          Effect.map((server) => ({
            version: "2025-06-18",
            auth: server?.auth ?? "none",
            requestedScopes: [],
            grantedScopes: [],
            requiredScopes: null,
            passed: ["connect", "auth", "permissions", "protocol", "list"],
            failure: null,
            toolCount: server?.toolCount ?? 0,
            machines: [],
          })),
        ),
      )
      .handle("probeDraft", () =>
        Effect.succeed({
          reachable: true,
          auth: "none",
          version: "2025-06-18",
          passed: ["connect", "protocol", "list"],
          failure: null,
          toolCount: 3,
        }),
      );
  }),
);
